require('dotenv').config();

/**
 * 应用配置中心
 * 统一管理环境变量和默认配置
 */
module.exports = {
  // 服务器配置
  port: parseInt(process.env.PORT || '7788', 10),
  nodeEnv: process.env.NODE_ENV || 'production',

  // 文件路径配置
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  outputDir: process.env.OUTPUT_DIR || './output',

  // 文件大小限制（字节）
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 默认 10MB

  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50', 10), // 最多50次请求
  },

  // 文件清理间隔（毫秒）
  cleanup: {
    uploadsInterval: parseInt(process.env.CLEANUP_INTERVAL_UPLOADS || '600000', 10), // 10分钟
    outputInterval: parseInt(process.env.CLEANUP_INTERVAL_OUTPUT || '3600000', 10), // 1小时
  },
};
