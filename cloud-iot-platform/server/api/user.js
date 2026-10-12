/**
 * user.js —— 用户与鉴权接口
 * 提供管理员登录与用户管理接口，口令经哈希校验、AES 加密敏感字段。
 */
'use strict';

const express = require('express');
const userStore = require('../store/user');
const { aesEncrypt } = require('../util/crypto');

const router = express.Router();

/** POST /api/auth/login —— 登录，返回脱敏用户信息与令牌。 */
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = userStore.verifyLogin(username, password);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  // 生成简单会话令牌（AES 加密用户标识）
  const token = aesEncrypt(`${user.id}:${Date.now()}`);
  res.json({ token, user });
});

/** GET /api/users —— 用户列表。 */
router.get('/users', (req, res) => {
  res.json(userStore.getUsers());
});

/** POST /api/users —— 新增用户。 */
router.post('/users', (req, res) => {
  const { username, password, nickname } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: '缺少用户名或密码' });
  }
  const user = userStore.addUser({ username, password, nickname });
  if (!user) {
    return res.status(409).json({ error: '用户名已存在' });
  }
  res.json(user);
});

/** DELETE /api/users/:id —— 删除用户。 */
router.delete('/users/:id', (req, res) => {
  const ok = userStore.removeUser(req.params.id);
  res.json({ success: ok });
});

module.exports = router;
