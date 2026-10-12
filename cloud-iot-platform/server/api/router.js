/**
 * router.js —— REST 路由汇总
 * 统一挂载各业务域路由到 /api 前缀。
 */
'use strict';

const express = require('express');
const water = require('./water');
const device = require('./device');
const linkage = require('./linkage');
const user = require('./user');
const settings = require('./settings');

const router = express.Router();

router.use('/water', water);
router.use('/devices', device);
router.use('/linkage', linkage);
router.use('/settings', settings);
router.use('/', user);

module.exports = router;
