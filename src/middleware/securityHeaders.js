const helmet = require('helmet');

/**
 * 安全头中间件
 * 使用 Helmet 自动设置多种 HTTP 安全头
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // 允许内联脚本
      styleSrc: ["'self'", "'unsafe-inline'"],  // 允许内联样式
    },
  },
  crossOriginEmbedderPolicy: false, // 允许跨域嵌入
});

module.exports = { securityHeaders };
