/**
 * settings.js —— 系统设置接口
 * 提供阈值配置查询、预警记录与历史数据的清除管理接口，
 * 供管理控制台系统设置模块调用。
 */
'use strict';

const express = require('express');
const alertStore = require('../store/alert');
const readingStore = require('../store/reading');
const { METRICS, METRIC_ORDER } = require('../config');

const router = express.Router();

/** GET /api/settings/thresholds —— 水质指标阈值配置。 */
router.get('/thresholds', (req, res) => {
  const thresholds = METRIC_ORDER.map((key) => {
    const m = METRICS[key];
    return {
      key: m.key,
      name: m.name,
      unit: m.unit,
      safeMin: m.safeMin,
      safeMax: m.safeMax,
      warnMin: m.warnMin,
      warnMax: m.warnMax,
    };
  });
  res.json({ thresholds });
});

/** POST /api/settings/clear-alerts —— 清空预警记录。 */
router.post('/clear-alerts', (req, res) => {
  alertStore.clearAlerts();
  res.json({ success: true });
});

/** POST /api/settings/clear-history —— 清空历史时序数据。 */
router.post('/clear-history', (req, res) => {
  readingStore.clearHistory();
  res.json({ success: true });
});

module.exports = router;
