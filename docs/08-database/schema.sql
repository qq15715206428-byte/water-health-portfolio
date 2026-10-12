-- =============================================================
-- 家庭水质健康管理系统 —— 关系型数据库设计（MySQL 兼容）
-- 说明：两套软著实际使用 JSON 文件存储，本脚本为规模化后的关系型落地，
--       用于展示数据库设计能力，字段与软著真实数据结构一一对应。
-- 引擎：InnoDB（支持外键与事务），字符集 utf8mb4。
-- =============================================================

CREATE DATABASE IF NOT EXISTS water_health
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE water_health;

-- -------------------------------------------------------------
-- 1. 用户表
-- -------------------------------------------------------------
CREATE TABLE users (
  id            VARCHAR(36)  NOT NULL COMMENT 'UUID 主键',
  username      VARCHAR(64)  NOT NULL COMMENT '登录名',
  password_hash VARCHAR(128) NOT NULL COMMENT '口令哈希（盐:哈希）',
  nickname      VARCHAR(64)  NULL COMMENT '昵称',
  role          VARCHAR(16)  NOT NULL DEFAULT 'user' COMMENT 'user / admin',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login    DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username)
) ENGINE=InnoDB COMMENT='用户账号';

-- -------------------------------------------------------------
-- 2. 健康画像表
-- -------------------------------------------------------------
CREATE TABLE health_profiles (
  id             VARCHAR(36) NOT NULL COMMENT 'UUID 主键',
  user_id        VARCHAR(36) NOT NULL COMMENT '所属用户',
  skin           VARCHAR(32) NULL COMMENT '皮肤类型：中性/干性/油性/敏感肌/屏障受损',
  scalp          VARCHAR(32) NULL COMMENT '头皮状况：正常/干枯/出油/头皮瘙痒/分叉',
  sensitivity    VARCHAR(32) NULL COMMENT '敏感点：无特殊/皮肤敏感/呼吸道敏感/肠胃敏感',
  family_members VARCHAR(128) NULL COMMENT '家庭成员（逗号分隔）：成年人/婴幼儿/老年人/孕妇/敏感体质',
  created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_profile_user (user_id),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='用户健康画像';

-- -------------------------------------------------------------
-- 3. 监测终端（设备）表
-- -------------------------------------------------------------
CREATE TABLE devices (
  id            VARCHAR(36) NOT NULL COMMENT '设备 ID（dev-fixed-01 / dev-portable-01）',
  name          VARCHAR(64) NOT NULL COMMENT '设备名',
  type          ENUM('fixed','portable') NOT NULL COMMENT '固定式 / 便携式',
  type_label    VARCHAR(16) NULL COMMENT '固定式 / 便携式 展示标签',
  location      VARCHAR(64) NULL COMMENT '安装位置（家庭总水管/厨房水龙头等）',
  battery       INT         NULL COMMENT '电量百分比（固定式无电池为 NULL）',
  installed_date DATE       NULL COMMENT '安装日期',
  firmware      VARCHAR(16) NULL COMMENT '固件版本',
  online        TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '是否在线',
  last_seen     DATETIME    NULL COMMENT '最后上报时间',
  PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='监测终端设备';

-- -------------------------------------------------------------
-- 4. 用户-设备绑定表（多对多）
-- -------------------------------------------------------------
CREATE TABLE device_bindings (
  id        INT         NOT NULL AUTO_INCREMENT,
  user_id   VARCHAR(36) NOT NULL,
  device_id VARCHAR(36) NOT NULL,
  bound_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_device (user_id, device_id),
  CONSTRAINT fk_binding_user   FOREIGN KEY (user_id)   REFERENCES users (id)   ON DELETE CASCADE,
  CONSTRAINT fk_binding_device FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='用户与设备绑定关系';

-- -------------------------------------------------------------
-- 5. 水质指标字典表
-- -------------------------------------------------------------
CREATE TABLE metrics (
  metric_key VARCHAR(32)   NOT NULL COMMENT '指标键：chlorine/hardness/ph/turbidity/temp/heavyMetal',
  name       VARCHAR(16)   NOT NULL COMMENT '中文名：余氯/硬度/pH/浊度/温度/重金属',
  unit       VARCHAR(16)   NULL COMMENT '单位：mg/L/NTU/℃/ppb',
  safe_min   DECIMAL(8,2)  NULL COMMENT '正常（绿）下界',
  safe_max   DECIMAL(8,2)  NULL COMMENT '正常（绿）上界',
  warn_min   DECIMAL(8,2)  NULL COMMENT '预警（黄）下界',
  warn_max   DECIMAL(8,2)  NULL COMMENT '预警（黄）上界',
  precision  TINYINT       NOT NULL DEFAULT 2 COMMENT '小数位',
  PRIMARY KEY (metric_key)
) ENGINE=InnoDB COMMENT='水质指标字典（三档阈值）';

-- -------------------------------------------------------------
-- 6. 水质读数表（时序）
-- -------------------------------------------------------------
CREATE TABLE readings (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  device_id   VARCHAR(36)  NOT NULL,
  metric_key  VARCHAR(32)  NOT NULL,
  value       DECIMAL(10,3) NOT NULL COMMENT '读数值',
  recorded_at DATETIME     NOT NULL COMMENT '采集时间',
  PRIMARY KEY (id),
  KEY idx_readings_lookup (device_id, metric_key, recorded_at),
  CONSTRAINT fk_reading_device FOREIGN KEY (device_id)  REFERENCES devices (id) ON DELETE CASCADE,
  CONSTRAINT fk_reading_metric FOREIGN KEY (metric_key) REFERENCES metrics (metric_key) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='水质时序读数';

-- -------------------------------------------------------------
-- 7. 预警记录表
-- -------------------------------------------------------------
CREATE TABLE alerts (
  id          VARCHAR(36)  NOT NULL COMMENT 'UUID 主键',
  device_id   VARCHAR(36)  NOT NULL,
  metric_key  VARCHAR(32)  NOT NULL,
  value       DECIMAL(10,3) NULL COMMENT '触发时的读数',
  unit        VARCHAR(16)  NULL,
  level       ENUM('warn','danger') NOT NULL COMMENT '预警等级',
  level_label VARCHAR(16)  NULL COMMENT '饮用水高风险 / 生活用水提示',
  name        VARCHAR(16)  NULL COMMENT '预警名（余氯超标等）',
  advice      VARCHAR(255) NULL COMMENT '建议文案',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_alerts_time (created_at),
  CONSTRAINT fk_alert_device FOREIGN KEY (device_id)  REFERENCES devices (id) ON DELETE CASCADE,
  CONSTRAINT fk_alert_metric FOREIGN KEY (metric_key) REFERENCES metrics (metric_key) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='分级预警记录';

-- -------------------------------------------------------------
-- 8. 可联动设备表
-- -------------------------------------------------------------
CREATE TABLE linkage_devices (
  id        VARCHAR(36) NOT NULL COMMENT '设备 ID（lk-purifier 等）',
  name      VARCHAR(64) NOT NULL COMMENT '设备名',
  type      VARCHAR(32) NOT NULL COMMENT '家用净水器/软水机/智能水龙头/全屋净水系统',
  is_on     TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '是否开启',
  is_auto   TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '是否自动联动',
  location  VARCHAR(64) NULL COMMENT '安装位置',
  PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='可联动处理设备';

-- -------------------------------------------------------------
-- 9. 联动动作日志表
-- -------------------------------------------------------------
CREATE TABLE linkage_actions (
  id                BIGINT      NOT NULL AUTO_INCREMENT,
  linkage_device_id VARCHAR(36) NOT NULL,
  alert_id          VARCHAR(36) NULL COMMENT '触发的预警（手动操作为 NULL）',
  action            ENUM('on','off') NOT NULL COMMENT '开启 / 关闭',
  source            ENUM('auto','manual') NOT NULL COMMENT '自动联动 / 手动',
  created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_linkage_time (created_at),
  CONSTRAINT fk_action_device FOREIGN KEY (linkage_device_id) REFERENCES linkage_devices (id) ON DELETE CASCADE,
  CONSTRAINT fk_action_alert  FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='设备联动动作日志';

-- -------------------------------------------------------------
-- 10. 健康建议库表（规则引擎映射）
-- -------------------------------------------------------------
CREATE TABLE health_advice (
  id                INT         NOT NULL AUTO_INCREMENT,
  metric_key        VARCHAR(32) NOT NULL,
  level             ENUM('warn','danger') NOT NULL,
  profile_condition VARCHAR(64) NULL COMMENT '画像匹配条件（如：敏感肌），NULL 表示通用',
  category          VARCHAR(16) NULL COMMENT '饮水/护肤/护发',
  advice            VARCHAR(255) NOT NULL COMMENT '建议文案',
  PRIMARY KEY (id),
  KEY idx_advice_lookup (metric_key, level),
  CONSTRAINT fk_advice_metric FOREIGN KEY (metric_key) REFERENCES metrics (metric_key) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='健康建议规则库';
