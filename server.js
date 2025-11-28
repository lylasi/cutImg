const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 7788;

// 确保必要的目录存在
const UPLOAD_DIR = path.join(__dirname, "uploads");
const OUTPUT_DIR = path.join(__dirname, "output");
const PUBLIC_DIR = path.join(__dirname, "public");

[UPLOAD_DIR, OUTPUT_DIR, PUBLIC_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("只支持图片文件 (jpeg, jpg, png, gif, webp)"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
});

// 静态文件服务
app.use(express.static(PUBLIC_DIR));
app.use("/output", express.static(OUTPUT_DIR));

// 清理旧文件（超过1小时）
function cleanOldFiles() {
  const dirs = [UPLOAD_DIR, OUTPUT_DIR];
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  dirs.forEach((dir) => {
    fs.readdir(dir, (err, files) => {
      if (err) return;

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          if (stats.mtimeMs < oneHourAgo) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  });
}

// 每10分钟清理一次
setInterval(cleanOldFiles, 10 * 60 * 1000);

/**
 * 剪切图片为 6列4行 的小图
 */
async function cutImage(
  inputPath,
  outputFolder,
  rows = 4,
  cols = 6,
  cropMargins = {}
) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let width = metadata.width;
    let height = metadata.height;

    // 提取边距参数
    const {
      cropTop = 0,
      cropBottom = 0,
      cropLeft = 0,
      cropRight = 0,
    } = cropMargins;

    // 如果有边距设置，先裁剪原图
    let processedImagePath = inputPath;
    if (cropTop || cropBottom || cropLeft || cropRight) {
      const croppedWidth = width - cropLeft - cropRight;
      const croppedHeight = height - cropTop - cropBottom;

      // 创建临时裁剪后的图片
      const tempCroppedPath = path.join(
        path.dirname(inputPath),
        "temp_cropped_" + Date.now() + ".png"
      );

      await sharp(inputPath)
        .extract({
          left: cropLeft,
          top: cropTop,
          width: croppedWidth,
          height: croppedHeight,
        })
        .png()
        .toFile(tempCroppedPath);

      // 使用裁剪后的图片进行后续处理
      processedImagePath = tempCroppedPath;
      width = croppedWidth;
      height = croppedHeight;
    }

    // 计算每个小图的尺寸
    const cellWidth = Math.floor(width / cols);
    const cellHeight = Math.floor(height / rows);

    const cutPromises = [];
    const fileNames = [];

    // 剪切所有小图
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col + 1;
        const fileName = `emoji_${String(index).padStart(2, "0")}.png`;
        const outputPath = path.join(outputFolder, fileName);

        const left = col * cellWidth;
        const top = row * cellHeight;

        const cutPromise = sharp(processedImagePath)
          .extract({
            left: left,
            top: top,
            width: cellWidth,
            height: cellHeight,
          })
          .png()
          .toFile(outputPath);

        cutPromises.push(cutPromise);
        fileNames.push(fileName);
      }
    }

    await Promise.all(cutPromises);

    // 如果创建了临时裁剪图片，删除它
    if (processedImagePath !== inputPath && fs.existsSync(processedImagePath)) {
      fs.unlinkSync(processedImagePath);
    }

    return {
      success: true,
      count: rows * cols,
      files: fileNames,
      outputFolder: path.basename(outputFolder),
    };
  } catch (error) {
    console.error("剪切图片失败:", error);
    throw error;
  }
}

/**
 * 上传并剪切接口
 */
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "请上传图片文件" });
    }

    const inputPath = req.file.path;
    const timestamp = Date.now();
    const outputFolder = path.join(OUTPUT_DIR, `cut_${timestamp}`);

    // 创建输出文件夹
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    // 获取自定义的行列数（如果有的话）
    const rows = parseInt(req.body.rows) || 4;
    const cols = parseInt(req.body.cols) || 6;

    // 获取边距参数（兼容 marginTop 和 cropTop 两种参数名）
    const cropMargins = {
      cropTop: parseInt(req.body.cropTop || req.body.marginTop) || 0,
      cropBottom: parseInt(req.body.cropBottom || req.body.marginBottom) || 0,
      cropLeft: parseInt(req.body.cropLeft || req.body.marginLeft) || 0,
      cropRight: parseInt(req.body.cropRight || req.body.marginRight) || 0,
    };

    // 执行剪切
    const result = await cutImage(
      inputPath,
      outputFolder,
      rows,
      cols,
      cropMargins
    );

    // 删除上传的原图
    fs.unlinkSync(inputPath);

    res.json({
      success: true,
      message: `成功剪切为 ${result.count} 张表情`,
      data: {
        sessionId: `cut_${timestamp}`,
        count: result.count,
        files: result.files,
      },
    });
  } catch (error) {
    console.error("处理失败:", error);
    res.status(500).json({
      error: "处理图片失败",
      details: error.message,
    });
  }
});

/**
 * 下载单张图片
 */
app.get("/download/:sessionId/:fileName", (req, res) => {
  const { sessionId, fileName } = req.params;
  const filePath = path.join(OUTPUT_DIR, sessionId, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "文件不存在" });
  }

  res.download(filePath, fileName);
});

/**
 * 打包下载所有图片（ZIP）
 */
app.get("/download-all/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const folderPath = path.join(OUTPUT_DIR, sessionId);

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: "文件不存在" });
  }

  // 创建ZIP压缩包
  const archive = archiver("zip", {
    zlib: { level: 9 }, // 最高压缩级别
  });

  res.attachment(`emojis_${sessionId}.zip`);

  archive.on("error", (err) => {
    console.error("压缩失败:", err);
    res.status(500).send("压缩失败");
  });

  archive.pipe(res);

  // 添加文件夹中的所有文件
  archive.directory(folderPath, false);

  archive.finalize();
});

/**
 * 获取剪切结果预览
 */
app.get("/preview/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const folderPath = path.join(OUTPUT_DIR, sessionId);

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: "会话不存在" });
  }

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "读取文件失败" });
    }

    const imageFiles = files.filter((f) =>
      /\.(png|jpg|jpeg|gif|webp)$/i.test(f)
    );

    res.json({
      success: true,
      sessionId,
      count: imageFiles.length,
      files: imageFiles,
    });
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🎉 表情包剪切工具已启动！`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`\n使用说明：`);
  console.log(`1. 打开浏览器访问上述地址`);
  console.log(`2. 上传你的表情版图（支持6×4、7×5等多种规格）`);
  console.log(`3. 选择行列数或使用快捷预设按钮`);
  console.log(`4. 调整边距裁剪（如有留白）`);
  console.log(`5. 自动剪切成单张表情`);
  console.log(`6. 支持单张下载或ZIP打包下载\n`);
});

// 优雅退出
process.on("SIGINT", () => {
  console.log("\n\n👋 服务器正在关闭...");
  process.exit(0);
});
