-- =============================================================
-- 家庭水质健康管理系统 —— SQLite 落地脚本（DDL + 种子数据）
-- 与 schema.sql（MySQL）同构，字段一一对应，便于本地零依赖运行验证。
-- =============================================================

PRAGMA foreign_keys = ON;

-- ---------- 用户 ----------
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nickname      TEXT,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT
);

-- ---------- 健康画像 ----------
CREATE TABLE health_profiles (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  skin           TEXT,
  scalp          TEXT,
  sensitivity    TEXT,
  family_members TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- 监测终端设备 ----------
CREATE TABLE devices (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('fixed','portable')),
  type_label    TEXT,
  location      TEXT,
  battery       INTEGER,
  installed_date TEXT,
  firmware      TEXT,
  online        INTEGER NOT NULL DEFAULT 0,
  last_seen     TEXT
);

-- ---------- 用户-设备绑定 ----------
CREATE TABLE device_bindings (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  bound_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, device_id)
);

-- ---------- 水质指标字典 ----------
CREATE TABLE metrics (
  metric_key TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  unit       TEXT,
  safe_min   REAL,
  safe_max   REAL,
  warn_min   REAL,
  warn_max   REAL,
  precision  INTEGER NOT NULL DEFAULT 2
);

-- ---------- 水质读数（时序） ----------
CREATE TABLE readings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id   TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  metric_key  TEXT NOT NULL REFERENCES metrics(metric_key) ON DELETE CASCADE,
  value       REAL NOT NULL,
  recorded_at TEXT NOT NULL
);
CREATE INDEX idx_readings_lookup ON readings (device_id, metric_key, recorded_at);

-- ---------- 预警记录 ----------
CREATE TABLE alerts (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  metric_key  TEXT NOT NULL REFERENCES metrics(metric_key) ON DELETE CASCADE,
  value       REAL,
  unit        TEXT,
  level       TEXT NOT NULL CHECK (level IN ('warn','danger')),
  level_label TEXT,
  name        TEXT,
  advice      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_alerts_time ON alerts (created_at);

-- ---------- 可联动设备 ----------
CREATE TABLE linkage_devices (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  type     TEXT NOT NULL,
  is_on    INTEGER NOT NULL DEFAULT 1,
  is_auto  INTEGER NOT NULL DEFAULT 0,
  location TEXT
);

-- ---------- 联动动作日志 ----------
CREATE TABLE linkage_actions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  linkage_device_id TEXT NOT NULL REFERENCES linkage_devices(id) ON DELETE CASCADE,
  alert_id          TEXT REFERENCES alerts(id) ON DELETE SET NULL,
  action            TEXT NOT NULL CHECK (action IN ('on','off')),
  source            TEXT NOT NULL CHECK (source IN ('auto','manual')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- 健康建议库 ----------
CREATE TABLE health_advice (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_key        TEXT NOT NULL REFERENCES metrics(metric_key) ON DELETE CASCADE,
  level             TEXT NOT NULL CHECK (level IN ('warn','danger')),
  profile_condition TEXT,
  category          TEXT,
  advice            TEXT NOT NULL
);

-- =============================================================
-- 种子数据（与软著 data/*.json 及 config.js 一致）
-- =============================================================

INSERT INTO users (id, username, password_hash, nickname, role) VALUES
  ('u-admin', 'admin', '0afd41…:ee3d…（示例哈希）', '平台管理员', 'admin'),
  ('u-shijia', 'shijia', '（示例哈希）', '石佳', 'user');

INSERT INTO health_profiles (id, user_id, skin, scalp, sensitivity, family_members) VALUES
  ('p-1', 'u-shijia', '敏感肌', '正常', '皮肤敏感', '成年人,婴幼儿');

INSERT INTO devices (id, name, type, type_label, location, battery, installed_date, firmware, online) VALUES
  ('dev-fixed-01', '入户总管式固定监测器', 'fixed', '固定式', '家庭总水管', NULL, '2026-05-12', 'v1.0.2', 1),
  ('dev-portable-01', '水龙头便携监测器', 'portable', '便携式', '厨房水龙头', 86, '2026-06-03', 'v1.0.1', 1);

INSERT INTO device_bindings (user_id, device_id) VALUES
  ('u-shijia', 'dev-fixed-01'),
  ('u-shijia', 'dev-portable-01');

INSERT INTO metrics (metric_key, name, unit, safe_min, safe_max, warn_min, warn_max, precision) VALUES
  ('chlorine',   '余氯',   'mg/L', 0,   0.2,  0.2,  0.3,  2),
  ('hardness',   '硬度',   'mg/L', 0,   300,  300,  450,  0),
  ('ph',         'pH',     '',     6.5, 8.5,  6.0,  9.0,  2),
  ('turbidity',  '浊度',   'NTU',  0,   1,    1,    3,    2),
  ('temp',       '温度',   '℃',    10,  30,   5,    35,   1),
  ('heavyMetal', '重金属', 'ppb',  0,   10,   10,   30,   2);

INSERT INTO readings (device_id, metric_key, value, recorded_at) VALUES
  ('dev-fixed-01', 'chlorine', 0.07, '2026-08-18 05:02:58'),
  ('dev-fixed-01', 'chlorine', 0.26, '2026-08-18 05:05:58'),
  ('dev-fixed-01', 'chlorine', 0.24, '2026-08-18 05:07:47'),
  ('dev-fixed-01', 'hardness', 185,  '2026-08-18 05:07:47'),
  ('dev-fixed-01', 'ph',       7.2,  '2026-08-18 05:07:47'),
  ('dev-fixed-01', 'turbidity', 3.49, '2026-08-18 05:07:47'),
  ('dev-portable-01', 'temp',   2.6,  '2026-08-18 05:07:47'),
  ('dev-portable-01', 'turbidity', 3.49, '2026-08-18 05:07:47'),
  ('dev-portable-01', 'heavyMetal', 6.34, '2026-08-18 05:07:47');

INSERT INTO alerts (id, device_id, metric_key, value, unit, level, level_label, name, advice, created_at) VALUES
  ('a-1', 'dev-portable-01', 'temp',      2.6,  '℃',   'danger', '饮用水高风险', '水温异常', '注意用水舒适度，必要时调节水温。', '2026-08-18 05:07:47'),
  ('a-2', 'dev-portable-01', 'turbidity', 3.49, 'NTU', 'danger', '饮用水高风险', '浊度偏高', '建议启动过滤装置，待水澄清后再使用。', '2026-08-18 05:07:47'),
  ('a-3', 'dev-fixed-01',    'chlorine',  0.24, 'mg/L','warn',   '生活用水提示', '余氯超标', '建议静置或过滤后使用，敏感肌加强防护。', '2026-08-18 05:07:47');

INSERT INTO linkage_devices (id, name, type, is_on, is_auto, location) VALUES
  ('lk-purifier', '家用净水器',   '家用净水器',   1, 1, '厨房'),
  ('lk-softener', '软水机',       '软水机',       1, 1, '卫生间'),
  ('lk-faucet',   '智能水龙头',   '智能水龙头',   1, 0, '厨房'),
  ('lk-whole',    '全屋净水系统', '全屋净水系统', 1, 1, '总水管');

INSERT INTO linkage_actions (linkage_device_id, alert_id, action, source) VALUES
  ('lk-purifier', 'a-2', 'on', 'auto'),
  ('lk-faucet',   NULL,  'on', 'manual');

INSERT INTO health_advice (metric_key, level, profile_condition, category, advice) VALUES
  ('chlorine',   'warn',   '敏感肌',  '护肤', '洗漱前放水 30s，使用除氯花洒，敏感肌加强保湿。'),
  ('chlorine',   'warn',   NULL,      '饮水', '建议静置或过滤后饮用。'),
  ('hardness',   'warn',   NULL,      '护发', '建议软水处理，注意头发与皮肤护理。'),
  ('heavyMetal', 'danger', NULL,      '饮水', '立即停止饮用，启动净水设备并联系复检。'),
  ('turbidity',  'danger', NULL,      '饮水', '建议启动过滤装置，待水澄清后再使用。');
