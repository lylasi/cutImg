/**
 * 全局错误处理中间件
 * 统一处理所有未捕获的错误，提供一致的错误响应格式
 */

/**
 * 404 错误处理中间件
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: '资源未找到',
    message: `无法找到请求的资源: ${req.method} ${req.path}`,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  console.error('\n' + '='.repeat(60));
  console.error('❌ 错误发生:');
  console.error('时间:', new Date().toISOString());
  console.error('路径:', req.method, req.path);
  console.error('错误类型:', err.name);
  console.error('错误信息:', err.message);
  if (err.stack) {
    console.error('堆栈信息:', err.stack);
  }
  console.error('='.repeat(60) + '\n');
  
  // 处理 Multer 文件上传错误
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: '文件过大',
        message: `文件大小超过限制（最大 ${Math.round(err.limit / 1024 / 1024)}MB）`,
        code: 'FILE_TOO_LARGE'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: '文件数量超限',
        message: `一次最多上传 ${err.limit} 个文件`,
        code: 'TOO_MANY_FILES'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: '意外的文件字段',
        message: `不支持的文件字段名: ${err.field}`,
        code: 'UNEXPECTED_FIELD'
      });
    }
    
    return res.status(400).json({
      error: '文件上传错误',
      message: err.message,
      code: err.code
    });
  }
  
  // 处理自定义的文件类型错误
  if (err.message && err.message.includes('只支持图片文件')) {
    return res.status(400).json({
      error: '文件类型不支持',
      message: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  // 处理 Sharp 图片处理错误
  if (err.message && (err.message.includes('Input file') || err.message.includes('sharp'))) {
    return res.status(400).json({
      error: '图片处理失败',
      message: '上传的文件无法处理，请确保是有效的图片文件',
      code: 'IMAGE_PROCESSING_ERROR'
    });
  }
  
  // 处理参数验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '参数验证失败',
      message: err.message,
      code: 'VALIDATION_ERROR'
    });
  }
  
  // 处理语法错误（通常是 JSON 解析错误）
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: '请求格式错误',
      message: '无法解析请求数据',
      code: 'PARSE_ERROR'
    });
  }
  
  // 默认处理未知错误
  const statusCode = err.statusCode || err.status || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(statusCode).json({
    error: statusCode === 500 ? '服务器内部错误' : '请求处理失败',
    message: isDevelopment ? err.message : '服务器处理请求时发生错误，请稍后重试',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack }), // 开发环境返回堆栈信息
    timestamp: new Date().toISOString()
  });
}

/**
 * 异步路由错误包装器
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler
};
