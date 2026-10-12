/**
 * device.js —— 设备管理接口
 * 提供监测终端的查询、注册与解绑接口，供管理控制台设备管理模块调用。
 */
'use strict';

const express = require('express');
const deviceStore = require('../store/device');
const { uuid } = require('../util/format');

const router = express.Router();

/** GET /api/devices —— 监测终端列表。 */
router.get('/', (req, res) => {
  res.json(deviceStore.getDevices());
});

/** POST /api/devices —— 注册新监测终端。 */
router.post('/', (req, res) => {
  const { name, type, typeLabel, location } = req.body || {};
  if (!name || !type) {
    return res.status(400).json({ error: '缺少设备名称或类型' });
  }
  const device = {
    id: 'dev-' + uuid().slice(0, 8),
    name,
    type,
    typeLabel: typeLabel || (type === 'fixed' ? '固定式' : '便携式'),
    online: false,
    location: location || '',
    battery: null,
    installed: new Date().toISOString().slice(0, 10),
    firmware: 'v1.0.0',
    lastSeen: null,
  };
  deviceStore.addMonitor(device);
  res.json(device);
});

/** DELETE /api/devices/:id —— 解绑监测终端。 */
router.delete('/:id', (req, res) => {
  const ok = deviceStore.removeMonitor(req.params.id);
  res.json({ success: ok });
});

module.exports = router;
