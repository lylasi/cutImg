const config = require('../config');

/**
 * 全局错误处理中间件
 * 统一处理应用中的所有错误，返回标准化的错误响应
 */
const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err);

  // Multer 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: `文件大小超过限制 (最大 ${config.maxFileSize / 1024 / 1024}MB)`,
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: '上传文件数量超过限制',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: '意外的文件字段',
    });
  }

  // 通用错误响应
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || '服务器内部错误';

  const errorResponse = {
    success: false,
    error: errorMessage,
  };

  // 开发环境返回完整堆栈信息
  if (config.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = { errorHandler };
