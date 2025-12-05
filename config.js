/**
 * 应用配置模块
 * 集中管理所有配置项，从环境变量读取
 */
require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT) || 7788,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production'
  },

  // 文件上传配置
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST) || 20,
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',')
  },

  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50
  },

  // 文件清理配置
  cleanup: {
    intervalMs: parseInt(process.env.CLEANUP_INTERVAL_MS) || 10 * 60 * 1000, // 10分钟
    maxAgeMs: parseInt(process.env.FILE_MAX_AGE_MS) || 60 * 60 * 1000 // 1小时
  },

  // 图片处理配置
  image: {
    minRows: 1,
    maxRows: 20,
    minCols: 1,
    maxCols: 20,
    maxMarginCrop: 200
  },

  // GIF配置
  gif: {
    minImages: 2,
    maxImages: 20,
    minDelay: 50,
    maxDelay: 500,
    minSize: 64,
    maxSize: 1024,
    minSizeAuto: 200,
    maxSizeAuto: 1200
  }
};
