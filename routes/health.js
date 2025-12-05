/**
 * 健康检查路由
 * 提供系统健康状态检查端点，供监控系统使用
 */
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 检查文件系统
async function checkFileSystem(dirs) {
  const results = {};
  
  for (const [name, dirPath] of Object.entries(dirs)) {
    try {
      await fs.access(dirPath);
      const stats = await fs.stat(dirPath);
      
      // 尝试写入测试文件
      const testFile = path.join(dirPath, '.health_check');
      await fs.writeFile(testFile, 'ok');
      await fs.unlink(testFile);
      
      results[name] = {
        status: 'ok',
        writable: true,
        exists: true
      };
    } catch (error) {
      results[name] = {
        status: 'error',
        writable: false,
        exists: false,
        error: error.message
      };
    }
  }
  
  return results;
}

// 检查内存使用情况
function checkMemory() {
  const usage = process.memoryUsage();
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const percentage = Math.round((usage.heapUsed / usage.heapTotal) * 100);
  
  return {
    heapTotal: `${totalMB}MB`,
    heapUsed: `${usedMB}MB`,
    heapPercentage: `${percentage}%`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    status: percentage > 90 ? 'warning' : 'ok'
  };
}

// 检查进程状态
function checkProcess() {
  return {
    pid: process.pid,
    uptime: Math.round(process.uptime()),
    uptimeFormatted: formatUptime(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

// 格式化运行时间
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);
  
  return parts.join(' ');
}

/**
 * GET /health
 * 健康检查端点 - 简单版本
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
});

/**
 * GET /health/detailed
 * 详细健康检查 - 包含系统信息
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
    const OUTPUT_DIR = path.join(__dirname, '..', 'output');
    const PUBLIC_DIR = path.join(__dirname, '..', 'public');
    
    const fileSystem = await checkFileSystem({
      uploads: UPLOAD_DIR,
      output: OUTPUT_DIR,
      public: PUBLIC_DIR
    });
    
    const memory = checkMemory();
    const processInfo = checkProcess();
    
    // 判断整体健康状态
    const hasError = Object.values(fileSystem).some(check => check.status === 'error');
    const overallStatus = hasError || memory.status === 'warning' ? 'degraded' : 'healthy';
    
    res.status(200).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        filesystem: fileSystem,
        memory: memory,
        process: processInfo
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /health/live
 * 存活探针 - Kubernetes liveness probe
 */
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * GET /health/ready
 * 就绪探针 - Kubernetes readiness probe
 */
router.get('/health/ready', async (req, res) => {
  try {
    const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
    const OUTPUT_DIR = path.join(__dirname, '..', 'output');
    
    // 检查关键目录是否可访问
    await fs.access(UPLOAD_DIR);
    await fs.access(OUTPUT_DIR);
    
    // 检查内存使用是否正常
    const usage = process.memoryUsage();
    const percentage = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (percentage > 95) {
      throw new Error('内存使用过高');
    }
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      reason: error.message 
    });
  }
});

module.exports = router;
