const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");
const GifEncoder = require("gif-encoder-2");
const crypto = require("crypto");

// 导入配置和中间件
const config = require("./src/config");
const { securityHeaders } = require("./src/middleware/securityHeaders");
const { rateLimiter } = require("./src/middleware/rateLimiter");
const { validateImageFile } = require("./src/middleware/fileValidator");
const { errorHandler } = require("./src/middleware/errorHandler");
const healthRouter = require("./src/routes/health");

const app = express();
const PORT = config.port;

// 确保必要的目录存在
const UPLOAD_DIR = config.uploadDir;
const OUTPUT_DIR = config.outputDir;
const PUBLIC_DIR = path.join(__dirname, "public");
const SHARES_FILE = path.join(__dirname, "shares.json");

[UPLOAD_DIR, OUTPUT_DIR, PUBLIC_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 初始化分享数据文件
if (!fs.existsSync(SHARES_FILE)) {
  fs.writeFileSync(SHARES_FILE, JSON.stringify({}));
}

// 读取分享数据
function readShares() {
  try {
    const data = fs.readFileSync(SHARES_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// 保存分享数据
function saveShares(shares) {
  fs.writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2));
}

// 生成唯一的分享ID
function generateShareId() {
  return crypto.randomBytes(4).toString("hex"); // 8位短链接
}

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
  limits: { fileSize: config.maxFileSize }, // 从配置文件读取
});

// 静态文件服务
app.use(express.static(PUBLIC_DIR));
app.use("/output", express.static(OUTPUT_DIR));

// 应用安全中间件
app.use(securityHeaders);
app.use(rateLimiter);

// JSON 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查路由（不受速率限制）
app.use("/health", healthRouter);

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
        .png({ quality: 100, compressionLevel: 9 }) // 最高质量无损压缩
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
          .png({ quality: 100, compressionLevel: 9 }) // 最高质量无损压缩
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
app.post(
  "/upload",
  upload.single("image"),
  validateImageFile,
  async (req, res) => {
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
  }
);

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

/**
 * 创建GIF动图
 * 接收多张图片，生成GIF动画
 */
app.post(
  "/create-gif",
  upload.array("images", 20),
  validateImageFile,
  async (req, res) => {
    const startTime = Date.now();
    console.log("\n" + "=".repeat(60));
    console.log("🎬 收到GIF生成请求");
    console.log("=".repeat(60));

    try {
      if (!req.files || req.files.length === 0) {
        console.error("❌ 错误: 未上传任何图片");
        return res.status(400).json({ error: "请至少上传一张图片" });
      }

      console.log(`📸 接收到 ${req.files.length} 张图片`);
      req.files.forEach((file, index) => {
        console.log(
          `  ${index + 1}. ${file.originalname} (${(file.size / 1024).toFixed(
            2
          )} KB)`
        );
      });

      const {
        delay = 500,
        loop = 0,
        width = 300,
        height = 300,
        crop = "none",
        cropRatio = 100,
        sizeMode = "fixed", // fixed: 固定尺寸, auto: 自动适应
        maxSize = 800, // 自动模式下的最大尺寸
      } = req.body;

      console.log("⚙️ GIF参数配置:");
      console.log(`  - 尺寸模式: ${sizeMode}`);
      console.log(`  - 固定尺寸: ${width}x${height}`);
      console.log(`  - 最大尺寸: ${maxSize}`);
      console.log(`  - 帧延迟: ${delay} ms`);
      console.log(`  - 循环次数: ${loop === 0 ? "无限循环" : loop + "次"}`);
      console.log(`  - 裁剪模式: ${crop}`);
      console.log(`  - 裁剪比例: ${cropRatio}%`);

      const sessionId = "gif_" + Date.now();
      const gifFileName = `${sessionId}.gif`;
      const gifPath = path.join(OUTPUT_DIR, gifFileName);

      // 处理图片并生成GIF
      const frames = [];

      // 如果是自动模式，根据第一张图片计算最佳尺寸
      let finalWidth = parseInt(width);
      let finalHeight = parseInt(height);

      if (sizeMode === "auto" && req.files.length > 0) {
        const firstImageMetadata = await sharp(req.files[0].path).metadata();
        const imgWidth = firstImageMetadata.width;
        const imgHeight = firstImageMetadata.height;
        const aspectRatio = imgWidth / imgHeight;

        const maxSizeInt = parseInt(maxSize);

        // 按最大边缩放，保持宽高比
        if (imgWidth > imgHeight) {
          // 横向图片
          finalWidth = Math.min(imgWidth, maxSizeInt);
          finalHeight = Math.round(finalWidth / aspectRatio);
        } else {
          // 纵向或正方形图片
          finalHeight = Math.min(imgHeight, maxSizeInt);
          finalWidth = Math.round(finalHeight * aspectRatio);
        }
        console.log(
          `🎨 自动适应模式: 原图 ${imgWidth}x${imgHeight} → GIF ${finalWidth}x${finalHeight}`
        );
      } else {
        console.log(`🎨 固定尺寸模式: GIF ${finalWidth}x${finalHeight}`);
      }

      console.log("\n🔄 开始处理图片帧...");

      // 读取并调整所有图片到相同尺寸
      for (const file of req.files) {
        let sharpInstance = sharp(file.path);

        // 如果需要裁剪，先进行中心裁剪
        if (crop !== "none") {
          const metadata = await sharpInstance.metadata();
          const { width: imgWidth, height: imgHeight } = metadata;

          let cropWidth, cropHeight;

          // 根据裁剪模式计算裁剪尺寸
          switch (crop) {
            case "square": // 1:1 正方形
              cropWidth = cropHeight = Math.min(imgWidth, imgHeight);
              break;
            case "4:3": // 4:3 横向
              if (imgWidth / imgHeight > 4 / 3) {
                cropHeight = imgHeight;
                cropWidth = Math.floor((cropHeight * 4) / 3);
              } else {
                cropWidth = imgWidth;
                cropHeight = Math.floor((cropWidth * 3) / 4);
              }
              break;
            case "16:9": // 16:9 宽屏
              if (imgWidth / imgHeight > 16 / 9) {
                cropHeight = imgHeight;
                cropWidth = Math.floor((cropHeight * 16) / 9);
              } else {
                cropWidth = imgWidth;
                cropHeight = Math.floor((cropWidth * 9) / 16);
              }
              break;
            case "percent": // 按百分比裁剪
              const ratio = parseInt(cropRatio) / 100;
              cropWidth = Math.floor(imgWidth * ratio);
              cropHeight = Math.floor(imgHeight * ratio);
              break;
            default:
              cropWidth = imgWidth;
              cropHeight = imgHeight;
          }

          // 计算居中裁剪的起始位置
          const left = Math.floor((imgWidth - cropWidth) / 2);
          const top = Math.floor((imgHeight - cropHeight) / 2);

          // 执行裁剪
          sharpInstance = sharpInstance.extract({
            left: Math.max(0, left),
            top: Math.max(0, top),
            width: cropWidth,
            height: cropHeight,
          });
        }

        // 调整到目标尺寸
        // 使用 fit: "contain" 保持完整内容，不裁剪，填充到指定尺寸（背景透明）
        const imageBuffer = await sharpInstance
          .resize(finalWidth, finalHeight, {
            fit: "contain", // 保持宽高比，填充到目标尺寸，不裁剪
            background: { r: 255, g: 255, b: 255, alpha: 0 }, // 透明背景
          })
          .raw()
          .ensureAlpha()
          .toBuffer({ resolveWithObject: true });

        frames.push(imageBuffer);

        // 删除临时文件
        fs.unlinkSync(file.path);
      }

      // 创建GIF编码器
      const encoder = new GifEncoder(finalWidth, finalHeight);
      const stream = fs.createWriteStream(gifPath);

      encoder.createReadStream().pipe(stream);
      encoder.start();
      encoder.setRepeat(parseInt(loop)); // 0 = 无限循环
      encoder.setDelay(parseInt(delay)); // 帧延迟（毫秒）
      encoder.setQuality(10); // 质量 1-20 (1最高质量)

      // 添加所有帧
      for (const frame of frames) {
        encoder.addFrame(frame.data);
      }

      encoder.finish();

      // 等待文件写入完成
      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      const processingTime = Date.now() - startTime;
      const gifStats = fs.statSync(gifPath);

      console.log("\n✅ GIF生成成功!");
      console.log(`  - 文件名: ${gifFileName}`);
      console.log(`  - 尺寸: ${finalWidth}x${finalHeight}`);
      console.log(`  - 帧数: ${req.files.length}`);
      console.log(`  - 文件大小: ${(gifStats.size / 1024).toFixed(2)} KB`);
      console.log(`  - 处理耗时: ${processingTime} ms`);
      console.log("=".repeat(60) + "\n");

      res.json({
        success: true,
        message: `成功生成GIF动图，共${req.files.length}帧`,
        data: {
          fileName: gifFileName,
          frameCount: req.files.length,
          delay: parseInt(delay),
          loop: parseInt(loop),
          width: finalWidth,
          height: finalHeight,
          sizeMode: sizeMode,
        },
      });
    } catch (error) {
      console.error("\n💥 GIF生成失败!");
      console.error("错误类型:", error.name);
      console.error("错误信息:", error.message);
      console.error("错误堆栈:\n", error.stack);
      console.log("=".repeat(60) + "\n");

      // 清理临时文件
      if (req.files) {
        req.files.forEach((file) => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (cleanupError) {
            console.error("清理临时文件失败:", cleanupError.message);
          }
        });
      }

      res.status(500).json({
        success: false,
        error: "生成GIF失败: " + error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

/**
 * 下载GIF文件
 */
app.get("/download-gif/:fileName", (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(OUTPUT_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "文件不存在" });
  }

  res.download(filePath, fileName);
});

/**
 * 生成分享链接
 */
app.post("/api/share/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const folderPath = path.join(OUTPUT_DIR, sessionId);

    // 检查会话是否存在
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: "会话不存在" });
    }

    // 读取现有分享数据
    const shares = readShares();

    // 检查是否已经为该会话创建了分享
    let shareId = null;
    for (const [id, data] of Object.entries(shares)) {
      if (data.sessionId === sessionId) {
        shareId = id;
        break;
      }
    }

    // 如果没有现有分享，创建新的
    if (!shareId) {
      shareId = generateShareId();
      shares[shareId] = {
        sessionId: sessionId,
        createdAt: new Date().toISOString(),
      };
      saveShares(shares);
    }

    const shareUrl = `http://localhost:${PORT}/share/${shareId}`;

    console.log(`🔗 创建分享链接: ${shareUrl} -> ${sessionId}`);

    res.json({
      success: true,
      shareId: shareId,
      shareUrl: shareUrl,
      message: "分享链接生成成功",
    });
  } catch (error) {
    console.error("生成分享链接失败:", error);
    res.status(500).json({ error: "生成分享链接失败" });
  }
});

/**
 * 获取分享数据
 */
app.get("/api/share/:shareId/data", (req, res) => {
  try {
    const { shareId } = req.params;
    const shares = readShares();

    if (!shares[shareId]) {
      return res.status(404).json({ error: "分享不存在" });
    }

    const sessionId = shares[shareId].sessionId;
    const folderPath = path.join(OUTPUT_DIR, sessionId);

    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: "分享的文件已失效" });
    }

    // 读取文件列表
    const files = fs
      .readdirSync(folderPath)
      .filter((f) => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
      .sort();

    res.json({
      success: true,
      sessionId: sessionId,
      count: files.length,
      files: files,
      createdAt: shares[shareId].createdAt,
    });
  } catch (error) {
    console.error("获取分享数据失败:", error);
    res.status(500).json({ error: "获取分享数据失败" });
  }
});

/**
 * 访问分享页面
 */
app.get("/share/:shareId", (req, res) => {
  const sharePage = path.join(PUBLIC_DIR, "share.html");
  if (!fs.existsSync(sharePage)) {
    return res.status(404).send("分享页面不存在");
  }
  res.sendFile(sharePage);
});

// 全局错误处理中间件（必须在所有路由之后）
app.use(errorHandler);

// 仅在非测试环境下启动服务器
if (process.env.NODE_ENV !== "test") {
  // 启动服务器
  app.listen(PORT, () => {
    console.log(`\n🎉 表情包剪切工具已启动！`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🔒 环境: ${config.nodeEnv}`);
    console.log(
      `🛡️  安全: Helmet + 速率限制 (${config.rateLimit.max}次/15分钟)`
    );
    console.log(`📁 上传目录: ${UPLOAD_DIR}`);
    console.log(`📁 输出目录: ${OUTPUT_DIR}`);
    console.log(`\n使用说明：`);
    console.log(`1. 打开浏览器访问上述地址`);
    console.log(`2. 上传你的表情版图（支持6×4、7×5等多种规格）`);
    console.log(`3. 选择行列数或使用快捷预设按钮`);
    console.log(`4. 调整边距裁剪（如有留白）`);
    console.log(`5. 自动剪切成单张表情`);
    console.log(`6. 支持单张下载或ZIP打包下载`);
    console.log(`7. 支持GIF动图生成`);
    console.log(`8. 健康检查: http://localhost:${PORT}/health\n`);
  });

  // 优雅退出
  process.on("SIGINT", () => {
    console.log("\n\n👋 服务器正在关闭...");
    process.exit(0);
  });
}

// 导出 app 供测试使用
module.exports = app;
