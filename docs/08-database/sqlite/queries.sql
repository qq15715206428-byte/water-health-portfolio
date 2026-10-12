-- =============================================================
-- 示例查询（对应 04-metrics.md 指标体系的关键分析）
-- 每段对应一个产品问题。
-- =============================================================

-- Q1. 当前最新读数（仪表盘首页）
SELECT m.name, r.value, m.unit, r.recorded_at
FROM readings r
JOIN metrics m ON m.metric_key = r.metric_key
WHERE r.device_id = 'dev-fixed-01'
  AND r.id IN (
    SELECT MAX(id) FROM readings
    WHERE device_id = 'dev-fixed-01'
    GROUP BY metric_key
  );

-- Q2. 近 7 天预警数量（按等级）
SELECT level, level_label, COUNT(*) AS cnt
FROM alerts
WHERE created_at >= datetime('now', '-7 days')
GROUP BY level, level_label;

-- Q3. 每种水质指标的预警频率（Top 指标）
SELECT m.name, COUNT(*) AS alert_cnt
FROM alerts a
JOIN metrics m ON m.metric_key = a.metric_key
GROUP BY a.metric_key
ORDER BY alert_cnt DESC;

-- Q4. 健康画像 → 个性化建议（敏感肌 + 余氯预警）
SELECT p.skin, m.name AS metric, a.level_label, ad.category, ad.advice
FROM health_profiles p
JOIN users u ON u.id = p.user_id
JOIN device_bindings b ON b.user_id = u.id
JOIN alerts a ON a.device_id = b.device_id
JOIN metrics m ON m.metric_key = a.metric_key
JOIN health_advice ad
  ON ad.metric_key = a.metric_key
 AND ad.level = a.level
 AND (ad.profile_condition = p.skin OR ad.profile_condition IS NULL)
WHERE p.skin = '敏感肌' AND a.metric_key = 'chlorine'
LIMIT 5;

-- Q5. 设备联动触发率（自动联动次数 / 需处理异常次数）
SELECT
  (SELECT COUNT(*) FROM linkage_actions WHERE source = 'auto') AS auto_actions,
  (SELECT COUNT(*) FROM alerts WHERE level = 'danger') AS danger_alerts;

-- Q6. 每个设备的在线状态与最近读数时间
SELECT d.name, d.online, MAX(r.recorded_at) AS last_reading
FROM devices d
LEFT JOIN readings r ON r.device_id = d.id
GROUP BY d.id, d.name, d.online;
