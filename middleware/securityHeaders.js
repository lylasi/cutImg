/**
 * 安全中间件配置
 * 使用 helmet 设置各种 HTTP 安全头
 */
const helmet = require('helmet');

module.exports = helmet({
  // 内容安全策略
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // 允许内联脚本（前端需要）
      styleSrc: ["'self'", "'unsafe-inline'"], // 允许内联样式
      imgSrc: ["'self'", "data:", "blob:"], // 允许 base64 和 blob 图片
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  
  // 跨域资源共享
  crossOriginEmbedderPolicy: false, // 允许嵌入外部资源
  
  // 其他安全头
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});
