/**
 * linkage.js —— 设备联动接口
 * 提供可联动设备查询与开关控制接口，
 * 供管理控制台联动模块与移动应用端（软著1 HttpDataSource）调用。
 */
'use strict';

const express = require('express');
const deviceStore = require('../store/device');

const router = express.Router();

/** GET /api/linkage —— 可联动设备列表。 */
router.get('/', (req, res) => {
  res.json(deviceStore.getLinkageDevices());
});

/** POST /api/linkage/:id/control —— 控制联动设备开关，body { on }。 */
router.post('/:id/control', (req, res) => {
  const on = !!req.body.on;
  const ok = deviceStore.setLinkageState(req.params.id, on);
  res.json({ success: ok, id: req.params.id, on });
});

module.exports = router;
