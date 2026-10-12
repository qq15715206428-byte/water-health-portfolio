/**
 * index.js —— 云平台服务入口
 * 启动流程：初始化数据 -> 创建 Express HTTP 服务（REST + 管理控制台） ->
 * 启动 MQTT Broker（TCP + WebSocket）-> 启动模拟监测终端上报。
 */
'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { APP, PORT } = require('./config');
const deviceStore = require('./store/device');
const userStore = require('./store/user');
const apiRouter = require('./api/router');
const { createBroker, startBroker } = require('./mqtt/broker');
const { startSimulator } = require('./mqtt/deviceSimulator');

// 初始化数据（首次启动写入预置设备与管理员账号）
deviceStore.seed();
userStore.seed();

// HTTP 服务
const app = express();
app.use(cors());
app.use(express.json());

// 静态托管管理控制台
const consoleDir = path.join(__dirname, '..', 'console');
app.use(express.static(consoleDir));

// REST API
app.use('/api', apiRouter);

// 根路径返回管理控制台
app.get('/', (req, res) => res.sendFile(path.join(consoleDir, 'index.html')));

const httpServer = http.createServer(app);

// MQTT Broker（TCP 1883 + WebSocket /mqtt）
const broker = createBroker();
startBroker(broker, httpServer);

// 启动 HTTP 服务
httpServer.listen(PORT.http, () => {
  console.log(`[${APP.name} ${APP.version}] 已启动`);
  console.log(`[HTTP] 管理控制台 & REST API: http://localhost:${PORT.http}`);
});

// 启动模拟监测终端
startSimulator();
