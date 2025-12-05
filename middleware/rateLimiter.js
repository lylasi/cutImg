/**
 * 速率限制中间件
 * 防止暴力攻击和滥用
 */
const rateLimit = require('express-rate-limit');
const config = require('../config');

// 通用速率限制（所有端点）
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests * 2, // 通用限制较宽松
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: '请在 {{resetTime}} 后重试'
  },
  standardHeaders: true, // 返回 RateLimit-* 头
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter: new Date(Date.now() + config.rateLimit.windowMs).toISOString()
    });
  }
});

// 上传端点速率限制（更严格）
const uploadLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: '上传请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // 成功的请求也计数
  handler: (req, res) => {
    console.warn(`⚠️ 速率限制触发 - IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: '上传请求过于频繁，请稍后再试',
      retryAfter: new Date(Date.now() + config.rateLimit.windowMs).toISOString(),
      limit: config.rateLimit.maxRequests,
      windowMs: config.rateLimit.windowMs
    });
  }
});

// 分享生成速率限制（防止分享链接泛滥）
const shareLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 每小时最多20个分享
  message: {
    error: '分享链接创建过于频繁'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: '分享链接创建过于频繁，请稍后再试',
      retryAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
  }
});

module.exports = {
  generalLimiter,
  uploadLimiter,
  shareLimiter
};
