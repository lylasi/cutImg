const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * 速率限制中间件
 * 防止恶意用户频繁请求，保护服务器资源
 */
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 时间窗口
  max: config.rateLimit.max, // 最大请求数
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true, // 返回速率限制信息在 `RateLimit-*` 头中
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
});

module.exports = { rateLimiter };
