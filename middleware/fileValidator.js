/**
 * 文件验证中间件
 * 验证上传文件的真实类型，防止恶意文件伪装
 */
const fs = require('fs').promises;
const { fromFile } = require('file-type');
const config = require('../config');

/**
 * 验证单个文件
 * @param {Object} file - Multer 文件对象
 * @returns {Promise<boolean>} 验证是否通过
 */
async function validateSingleFile(file) {
  try {
    // 1. 检查文件是否存在
    await fs.access(file.path);
    
    // 2. 读取文件魔数（前几个字节）验证真实类型
    const fileTypeResult = await fromFile(file.path);
    
    // 3. 如果无法识别文件类型，拒绝
    if (!fileTypeResult) {
      console.warn(`⚠️ 无法识别文件类型: ${file.originalname}`);
      return false;
    }
    
    // 4. 验证 MIME 类型是否在允许列表中
    if (!config.upload.allowedMimeTypes.includes(fileTypeResult.mime)) {
      console.warn(`⚠️ 不允许的文件类型: ${fileTypeResult.mime}, 文件: ${file.originalname}`);
      return false;
    }
    
    // 5. 验证文件大小
    const stats = await fs.stat(file.path);
    if (stats.size > config.upload.maxFileSize) {
      console.warn(`⚠️ 文件过大: ${stats.size} bytes, 限制: ${config.upload.maxFileSize} bytes`);
      return false;
    }
    
    // 6. 检查文件是否为空
    if (stats.size === 0) {
      console.warn(`⚠️ 空文件: ${file.originalname}`);
      return false;
    }
    
    console.log(`✅ 文件验证通过: ${file.originalname} (${fileTypeResult.mime}, ${stats.size} bytes)`);
    return true;
    
  } catch (error) {
    console.error(`❌ 文件验证失败: ${file.originalname}`, error.message);
    return false;
  }
}

/**
 * 清理无效文件
 * @param {Object|Array} files - 文件或文件数组
 */
async function cleanupInvalidFiles(files) {
  const fileArray = Array.isArray(files) ? files : [files];
  
  for (const file of fileArray) {
    try {
      await fs.unlink(file.path);
      console.log(`🗑️ 已删除无效文件: ${file.path}`);
    } catch (error) {
      console.error(`❌ 删除文件失败: ${file.path}`, error.message);
    }
  }
}

/**
 * 文件验证中间件（用于单文件上传）
 */
async function validateImageFile(req, res, next) {
  // 如果没有上传文件，跳过验证
  if (!req.file && !req.files) {
    return next();
  }
  
  try {
    const files = req.files || [req.file];
    const validationResults = await Promise.all(
      files.map(file => validateSingleFile(file))
    );
    
    // 检查是否所有文件都通过验证
    const allValid = validationResults.every(result => result === true);
    
    if (!allValid) {
      // 清理所有上传的文件（包括有效和无效的）
      await cleanupInvalidFiles(files);
      
      return res.status(400).json({
        error: '文件验证失败',
        message: '上传的文件类型不正确或已损坏',
        details: '请确保上传的是有效的图片文件（JPG、PNG、GIF、WebP）'
      });
    }
    
    // 所有文件验证通过，继续处理
    next();
    
  } catch (error) {
    console.error('❌ 文件验证中间件错误:', error);
    
    // 清理文件
    if (req.file || req.files) {
      await cleanupInvalidFiles(req.files || [req.file]);
    }
    
    res.status(500).json({
      error: '文件验证失败',
      message: '服务器处理文件时发生错误'
    });
  }
}

module.exports = {
  validateImageFile,
  validateSingleFile,
  cleanupInvalidFiles
};
