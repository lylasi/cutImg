const FileType = require("file-type");
const fs = require("fs");

/**
 * 文件类型验证中间件
 * 通过读取文件的魔数（magic number）验证真实类型
 * 防止用户通过修改扩展名伪造文件类型
 */
const validateImageFile = async (req, res, next) => {
  try {
    // 支持单文件和多文件上传
    const files = req.file ? [req.file] : req.files || [];

    if (files.length === 0) {
      return next();
    }

    // 允许的图片 MIME 类型
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    // 验证每个文件
    for (const file of files) {
      // 读取文件的真实类型（通过魔数）
      const fileType = await FileType.fromFile(file.path);

      // 如果无法识别文件类型或不在允许列表中
      if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
        // 删除非法文件
        fs.unlinkSync(file.path);

        return res.status(400).json({
          success: false,
          error: `文件 ${file.originalname} 不是有效的图片文件`,
        });
      }
    }

    // 所有文件验证通过
    next();
  } catch (error) {
    console.error("文件验证失败:", error);
    return res.status(500).json({
      success: false,
      error: "文件验证失败",
    });
  }
};

module.exports = { validateImageFile };
