/**
 * crypto.js —— 数据安全模块
 * 基于 Node 内置 crypto 实现口令哈希（PBKDF2）与数据加密（AES-256-GCM），
 * 用于管理员口令的安全存储与敏感水质数据 / 用户画像的加密保护（呼应申报书数据安全要求）。
 */
'use strict';

const crypto = require('crypto');

// AES 主密钥（演示用，生产环境应从环境变量或密钥管理服务读取）
const SECRET = 'whh-cloud-platform-2026';
const KEY = crypto.createHash('sha256').update(SECRET).digest();

const PBKDF2_ITERATIONS = 10000;
const PBKDF2_KEYLEN = 32;

/** 口令哈希：返回 `salt:hash` 形式。 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

/** 校验口令是否匹配已存哈希。 */
function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const check = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256');
  const target = Buffer.from(hash, 'hex');
  if (check.length !== target.length) return false;
  return crypto.timingSafeEqual(check, target);
}

/** AES-256-GCM 加密，返回 `iv:tag:ciphertext`（均为 hex）。 */
function aesEncrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

/** AES-256-GCM 解密。 */
function aesDecrypt(payload) {
  const parts = String(payload).split(':');
  if (parts.length !== 3) return '';
  const [ivHex, tagHex, encHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const dec = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { hashPassword, verifyPassword, aesEncrypt, aesDecrypt };
