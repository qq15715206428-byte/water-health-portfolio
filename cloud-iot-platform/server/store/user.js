/**
 * user.js —— 用户与账号存储
 * 管理平台管理员与注册用户，口令以 PBKDF2 哈希安全存储，
 * 供管理控制台登录与用户管理模块使用。
 */
'use strict';

const { JsonStore } = require('./db');
const { ADMIN } = require('../config');
const { hashPassword, verifyPassword } = require('../util/crypto');
const { uuid } = require('../util/format');

const store = new JsonStore('user', { users: [] });

/** 初始化：写入平台管理员账号（口令哈希存储）。 */
function seed() {
  if (store.data.users.length === 0) {
    store.data.users.push({
      id: uuid(),
      username: ADMIN.username,
      passwordHash: hashPassword(ADMIN.password),
      nickname: '平台管理员',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: null,
    });
    store.save();
  }
}

/** 按用户名查找账号。 */
function findByUsername(username) {
  return store.data.users.find((u) => u.username === username);
}

/** 校验登录，成功返回脱敏用户信息，失败返回 null。 */
function verifyLogin(username, password) {
  const u = findByUsername(username);
  if (!u || !verifyPassword(password, u.passwordHash)) return null;
  u.lastLogin = new Date().toISOString();
  store.save();
  return { id: u.id, username: u.username, nickname: u.nickname, role: u.role };
}

/** 获取全部用户（脱敏，不含口令哈希）。 */
function getUsers() {
  return store.data.users.map((u) => {
    const { passwordHash, ...rest } = u;
    return rest;
  });
}

/** 新增注册用户，用户名重复返回 null。 */
function addUser({ username, password, nickname }) {
  if (findByUsername(username)) return null;
  const u = {
    id: uuid(),
    username,
    nickname: nickname || username,
    role: 'user',
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    lastLogin: null,
  };
  store.data.users.push(u);
  store.save();
  return { id: u.id, username: u.username, nickname: u.nickname, role: u.role };
}

/** 删除用户（管理员账号不可删除）。 */
function removeUser(id) {
  const i = store.data.users.findIndex((u) => u.id === id);
  if (i < 0 || store.data.users[i].role === 'admin') return false;
  store.data.users.splice(i, 1);
  store.save();
  return true;
}

module.exports = { seed, findByUsername, verifyLogin, getUsers, addUser, removeUser };
