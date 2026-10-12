/**
 * device.js —— 设备注册表
 * 管理监测终端（monitor）与可联动设备（linkage）两类设备：
 * 监测终端通过 MQTT 上报水质数据；联动设备由云端根据水质状态下发控制。
 * 设备结构对齐移动应用端（软著1）渲染所需字段。
 */
'use strict';

const { JsonStore } = require('./db');
const { LINKAGE_DEVICE_TYPES } = require('../config');

const monitors = new JsonStore('device', { devices: [] });
const linkages = new JsonStore('linkage', { devices: [] });

/** 初始化设备：首次启动写入预置监测终端与联动设备。 */
function seed() {
  if (monitors.data.devices.length === 0) {
    monitors.data.devices = [
      {
        id: 'dev-fixed-01', name: '入户总管式固定监测器', type: 'fixed', typeLabel: '固定式',
        online: false, location: '家庭总水管', battery: null,
        installed: '2026-05-12', firmware: 'v1.0.2', lastSeen: null,
      },
      {
        id: 'dev-portable-01', name: '水龙头便携监测器', type: 'portable', typeLabel: '便携式',
        online: false, location: '厨房水龙头', battery: 86,
        installed: '2026-06-03', firmware: 'v1.0.1', lastSeen: null,
      },
    ];
    monitors.save();
  }
  if (linkages.data.devices.length === 0) {
    linkages.data.devices = [
      { id: 'lk-purifier', name: '家用净水器', type: LINKAGE_DEVICE_TYPES[0], on: false, auto: true, location: '厨房' },
      { id: 'lk-softener', name: '软水机', type: LINKAGE_DEVICE_TYPES[1], on: false, auto: true, location: '卫生间' },
      { id: 'lk-faucet', name: '智能水龙头', type: LINKAGE_DEVICE_TYPES[2], on: true, auto: false, location: '厨房' },
      { id: 'lk-whole', name: '全屋净水系统', type: LINKAGE_DEVICE_TYPES[3], on: false, auto: true, location: '总水管' },
    ];
    linkages.save();
  }
}

/** 获取监测终端列表。 */
function getDevices() {
  return monitors.data.devices;
}

/** 获取可联动设备列表。 */
function getLinkageDevices() {
  return linkages.data.devices;
}

/** 更新监测终端在线状态与最后上报时间。 */
function markOnline(id, online) {
  const d = monitors.data.devices.find((x) => x.id === id);
  if (d) {
    d.online = online;
    d.lastSeen = online ? new Date().toISOString() : d.lastSeen;
    monitors.save();
  }
}

/** 设置联动设备开关状态。 */
function setLinkageState(id, on) {
  const d = linkages.data.devices.find((x) => x.id === id);
  if (!d) return false;
  d.on = !!on;
  linkages.save();
  return true;
}

/** 新增监测终端。 */
function addMonitor(device) {
  monitors.data.devices.push(device);
  monitors.save();
  return device;
}

/** 解绑监测终端。 */
function removeMonitor(id) {
  const i = monitors.data.devices.findIndex((x) => x.id === id);
  if (i < 0) return false;
  monitors.data.devices.splice(i, 1);
  monitors.save();
  return true;
}

module.exports = {
  seed,
  getDevices,
  getLinkageDevices,
  markOnline,
  setLinkageState,
  addMonitor,
  removeMonitor,
};
