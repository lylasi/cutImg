const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const router = express.Router();

/**
 * 健康检查端点
 * GET /health
 * 返回服务状态、系统资源使用情况等信息
 */
router.get('/', (req, res) => {
  try {
    const healthCheck = {
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: config.nodeEnv,
    };

    // 检查必要的目录是否可访问
    const uploadDir = path.resolve(config.uploadDir);
    const outputDir = path.resolve(config.outputDir);

    try {
      fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
      healthCheck.filesystem = { uploads: 'ok' };
    } catch (error) {
      healthCheck.filesystem = { uploads: 'error' };
      healthCheck.status = 'degraded';
    }

    try {
      fs.accessSync(outputDir, fs.constants.R_OK | fs.constants.W_OK);
      healthCheck.filesystem.output = 'ok';
    } catch (error) {
      healthCheck.filesystem.output = 'error';
      healthCheck.status = 'degraded';
    }

    // 获取活动连接数（如果有 server 对象）
    if (req.app.locals.server) {
      const server = req.app.locals.server;
      healthCheck.connections = server._connections || 0;
    }

    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(503).json({
      status: 'error',
      timestamp: Date.now(),
      error: error.message,
    });
  }
});

module.exports = router;
