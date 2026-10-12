/**
 * water.js —— 水质数据与分析接口
 * 提供最新读数、历史时序、总览统计、预警记录与健康分析接口，
 * 供管理控制台与移动应用端（软著1 HttpDataSource）调用。
 */
'use strict';

const express = require('express');
const readingStore = require('../store/reading');
const deviceStore = require('../store/device');
const alertStore = require('../store/alert');
const { analyzeReading } = require('../engine/alertEngine');
const { generateHealthPlan } = require('../engine/healthEngine');
const { METRIC_ORDER } = require('../config');

const router = express.Router();

/** GET /api/water/current —— 最新水质读数。 */
router.get('/current', (req, res) => {
  res.json(readingStore.getCurrent());
});

/** GET /api/water/history?range=day&metric=chlorine —— 历史时序。 */
router.get('/history', (req, res) => {
  const range = req.query.range || 'day';
  const metric = req.query.metric || METRIC_ORDER[0];
  res.json(readingStore.getHistory(range, metric));
});

/** GET /api/overview —— 平台总览统计。 */
router.get('/overview', (req, res) => {
  const reading = readingStore.getCurrent();
  const result = analyzeReading(reading);
  const devices = deviceStore.getDevices();
  const onlineCount = devices.filter((d) => d.online).length;
  res.json({
    deviceCount: devices.length,
    onlineCount,
    linkageCount: deviceStore.getLinkageDevices().length,
    alertCount: alertStore.getAlerts().length,
    current: reading,
    statuses: result.statuses,
    score: result.score,
    level: result.level,
  });
});

/** GET /api/alerts —— 预警记录列表。 */
router.get('/alerts', (req, res) => {
  res.json(alertStore.getAlerts());
});

/** GET /api/health?skin=&scalp=&sensitivity=&family=a,b —— 健康分析。 */
router.get('/health', (req, res) => {
  const profile = {
    skin: req.query.skin || '',
    scalp: req.query.scalp || '',
    sensitivity: req.query.sensitivity || '',
    family: req.query.family ? String(req.query.family).split(',') : [],
  };
  const reading = readingStore.getCurrent();
  const result = analyzeReading(reading);
  const plan = generateHealthPlan(profile, reading, result.statuses);
  res.json({
    overview: plan.overview,
    items: plan.items,
    score: result.score,
    level: result.level,
  });
});

module.exports = router;
