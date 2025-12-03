# 🎨 Emoji Cutter - 表情包剪切工具

一站式表情包处理解决方案 - 自动剪切表情版图 & 生成GIF动图

## 📖 Overview

Emoji Cutter 是一个基于 Web 的图片处理工具，专注于表情包的自动化批量处理。它提供两大核心功能：

**表情包剪切**：将整张表情版图（例如 6×4 排列的表情包大图）智能分割成单独的小图片，支持自定义行列数、边距裁剪，并提供高清无损的 PNG 输出。用户可通过拖拽上传、Ctrl+V 粘贴等多种方式快速处理图片，适合表情包创作者、设计师批量制作表情。

**GIF 动图生成**：支持将多张图片合成为 GIF 动图，提供可视化的拖拽排序、参数自定义（帧延迟、尺寸、循环模式）等功能。适用于制作动态表情包、简单动画效果等场景。

项目采用前后端分离架构，后端使用 Express 框架提供 RESTful API，前端为纯原生 HTML5 实现，无需复杂构建工具。服务端通过 Sharp 库实现高性能图片处理，支持多种图片格式，并自动清理临时文件，确保服务稳定运行。

## 🛠️ Technology Stack

### 核心技术
- **运行环境**: Node.js (推荐 v14+)
- **Web 框架**: Express.js ^4.18.2
- **图片处理**: Sharp ^0.33.1 (高性能原生 C++ 绑定)
- **GIF 编码**: gif-encoder-2 ^1.0.5

### 关键依赖
- **文件上传**: Multer ^1.4.5-lts.1
- **压缩打包**: Archiver ^6.0.1
- **前端技术**: 原生 HTML5 + CSS3 + JavaScript (Canvas API, Drag & Drop API)

### 开发工具
- **进程管理**: PM2 (生产环境推荐)
- **包管理器**: npm / pnpm

## 📁 Project Structure

```
cutImg/
├── 📄 package.json              # 项目配置与依赖管理
├── 🚀 server.js                 # Express 服务器主程序
│   ├── cutImage()               # 表情包剪切核心函数
│   ├── POST /upload             # 图片上传与剪切 API
│   ├── POST /create-gif         # GIF 生成 API
│   └── 自动清理机制             # 每10分钟清理1小时前的临时文件
│
├── ⚙️ ecosystem.config.js       # PM2 进程管理配置
│   ├── 实例数: 1
│   ├── 端口: 7788
│   └── 内存限制: 1GB
│
├── 📖 README.md                 # 项目说明文档
├── 📖 SNOW.md                   # 项目技术文档（本文件）
│
├── 🌐 public/                   # 前端静态资源目录
│   └── index.html               # Web 用户界面
│       ├── 表情剪切 Tab         # 支持拖拽/粘贴/边距调整/实时预览
│       └── GIF生成 Tab          # 支持拖拽排序/参数配置/实时预览
│
├── 📂 uploads/                  # 上传文件临时目录（自动创建）
├── 📂 output/                   # 剪切结果输出目录（自动创建）
│   └── cut_<timestamp>/         # 每次剪切创建独立会话目录
│       ├── emoji_01.png
│       ├── emoji_02.png
│       └── ...
│
├── 📂 logs/                     # PM2 日志目录（自动创建）
│   ├── out.log                  # 标准输出日志
│   └── err.log                  # 错误日志
│
├── 📜 install-deps.sh           # Linux/Mac 依赖安装脚本
├── 📜 install-deps.bat          # Windows 依赖安装脚本
│
└── 📚 文档/
    ├── PM2使用指南.md
    ├── 依赖安装指南.md
    ├── GIF生成问题诊断报告.md
    └── 快速修复指南.txt
```

## ✨ Key Features

### 🎯 表情包剪切
- **多种上传方式**
  - 拖拽上传（Drag & Drop）
  - 点击选择文件
  - Ctrl+V 粘贴剪贴板图片
- **灵活配置**
  - 自定义行列数：1-20 × 1-20
  - 四向边距裁剪：上/下/左/右独立调整（0-200px）
  - 实时预览网格效果（Canvas 绘制）
- **高清输出**
  - PNG 格式（quality: 100, compressionLevel: 9）
  - 无损压缩，保证最高画质
- **批量下载**
  - 单张下载：点击单个表情下载按钮
  - 批量打包：一键生成 ZIP 压缩包

### 🎬 GIF 动图生成
- **多图合成**
  - 支持上传 2-20 张图片
  - 支持 JPG, PNG, GIF, WebP 格式
- **可视化编辑**
  - 拖拽排序调整帧顺序
  - 单张删除不满意的帧
  - 实时预览图片列表
- **参数配置**
  - 帧延迟：50-500ms（控制播放速度）
  - 尺寸模式：固定尺寸 / 自动适应
  - 固定尺寸：100-800px 正方形
  - 自动适应：保持原图宽高比，最大尺寸 200-1200px
  - 循环模式：无限循环 / 指定次数
  - 裁剪选项：无裁剪 / 1:1 正方形 / 4:3 / 16:9
- **智能处理**
  - 自动计算最佳尺寸（auto 模式）
  - 透明背景支持（contain 模式）
  - 统一帧尺寸（确保 GIF 兼容性）

### 🛡️ 系统特性
- **自动清理**: 每 10 分钟清理 1 小时前的临时文件
- **安全限制**: 单文件最大 10MB，防止服务器过载
- **响应式设计**: 移动端友好，适配各种屏幕尺寸
- **错误处理**: 详细的错误日志与用户提示

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v14.0.0 或更高版本
- **npm**: v6.0.0 或更高版本
- **操作系统**: Windows / Linux / macOS

### Installation

#### 方法 1: 精确版本安装（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd cutImg

# 使用 package-lock.json 安装精确版本
npm ci
```

#### 方法 2: 常规安装

```bash
npm install
```

#### 方法 3: 自动化脚本安装

**Linux / macOS:**
```bash
bash install-deps.sh
```

**Windows:**
```cmd
install-deps.bat
```

#### 故障排查

如遇到 Sharp 模块安装失败（尤其是 Linux 服务器）：

```bash
# 1. 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 2. 重新构建 native 模块
npm rebuild

# 3. 验证 Sharp 模块
node -e "require('sharp')" && echo "✅ Sharp 模块正常"

# 4. 查看已安装依赖
npm list --depth=0
```

**网络问题解决：**
```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com
```

### Usage

#### 启动开发服务器

```bash
npm start
# 或
npm run dev
```

服务将在 **http://localhost:7788** 启动

#### 使用 Web 界面

1. **表情包剪切**
   ```
   1. 打开浏览器访问 http://localhost:7788
   2. 切换到"表情剪切"标签页
   3. 上传表情版图（拖拽/点击/Ctrl+V）
   4. 设置行列数（如 6×4 = 24 张）
   5. 可选：调整边距裁剪（去除留白）
   6. 点击"确认剪切"
   7. 下载单张或批量打包 ZIP
   ```

2. **GIF 动图生成**
   ```
   1. 切换到"GIF生成"标签页
   2. 上传 2-20 张图片
   3. 拖拽调整图片顺序
   4. 设置参数：
      - 帧延迟（默认 500ms）
      - 尺寸模式（推荐"自动适应"）
      - 最大尺寸（默认 800px）
   5. 点击"生成 GIF"
   6. 预览并下载 GIF 文件
   ```

## 🔧 Development

### Available Scripts

```bash
# 启动服务器（开发 & 生产通用）
npm start

# 启动开发服务器（同 start，预留扩展）
npm run dev
```

### Development Workflow

1. **本地开发**
   ```bash
   npm start
   # 访问 http://localhost:7788
   # 修改代码后重启服务器
   ```

2. **测试功能**
   - 表情剪切：上传测试图片，验证剪切结果
   - GIF 生成：上传多张图片，验证生成效果
   - 检查浏览器控制台日志

3. **代码规范**
   - 使用 `console.log` 添加调试日志
   - 错误处理使用 `try-catch` + `console.error`
   - API 响应统一格式：`{ success, message, data }`

### API Development

#### POST /upload
剪切表情包图片

**Request (multipart/form-data):**
```javascript
{
  image: File,              // 图片文件
  rows: 4,                  // 行数（1-20）
  cols: 6,                  // 列数（1-20）
  marginTop: 0,             // 上边距（px）
  marginBottom: 0,          // 下边距（px）
  marginLeft: 0,            // 左边距（px）
  marginRight: 0            // 右边距（px）
}
```

**Response:**
```json
{
  "success": true,
  "message": "成功剪切为 24 张表情",
  "data": {
    "sessionId": "cut_1234567890",
    "count": 24,
    "files": ["emoji_01.png", "emoji_02.png", ...]
  }
}
```

#### POST /create-gif
生成 GIF 动图

**Request (multipart/form-data):**
```javascript
{
  images: [File, File, ...],  // 至少 2 张图片
  delay: 500,                 // 帧延迟（50-500ms）
  sizeMode: "auto",           // "fixed" | "auto"
  width: 300,                 // 固定模式：宽度（100-800px）
  height: 300,                // 固定模式：高度（100-800px）
  maxSize: 800,               // 自动模式：最大尺寸（200-1200px）
  loop: 0,                    // 循环次数（0=无限循环）
  crop: "none",               // 裁剪模式："none" | "square" | "4:3" | "16:9"
  cropRatio: 100              // 裁剪比例（百分比）
}
```

**Response:**
```json
{
  "success": true,
  "message": "GIF生成成功",
  "data": {
    "fileName": "gif_1234567890.gif",
    "frameCount": 5,
    "width": 800,
    "height": 600,
    "delay": 500,
    "loop": 0
  }
}
```

## ⚙️ Configuration

### 环境变量

在 `ecosystem.config.js` 中配置：

```javascript
env: {
  NODE_ENV: "production",  // 环境模式
  PORT: 7788               // 服务端口
}
```

### 系统参数

**文件大小限制:**
```javascript
limits: { fileSize: 10 * 1024 * 1024 }  // 10MB
```

**支持的图片格式:**
```javascript
const allowedTypes = /jpeg|jpg|png|gif|webp/;
```

**自动清理策略:**
```javascript
const oneHourAgo = Date.now() - 60 * 60 * 1000;  // 1小时前
setInterval(cleanOldFiles, 10 * 60 * 1000);       // 每10分钟
```

### PM2 配置

**ecosystem.config.js:**
```javascript
{
  name: "cutImg",
  script: "./server.js",
  instances: 1,                  // 单实例（Sharp 不支持多进程）
  autorestart: true,             // 自动重启
  max_memory_restart: "1G",      // 内存限制 1GB
  error_file: "./logs/err.log",
  out_file: "./logs/out.log",
  log_date_format: "YYYY-MM-DD HH:mm:ss Z"
}
```

## 🏗️ Architecture

### 系统架构

```
┌─────────────────────────────────────────────────┐
│             浏览器客户端                         │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │  表情剪切界面    │  │  GIF生成界面      │    │
│  │  - 拖拽上传      │  │  - 多图上传       │    │
│  │  - 参数设置      │  │  - 拖拽排序       │    │
│  │  - Canvas预览    │  │  - 参数配置       │    │
│  └──────────────────┘  └──────────────────┘    │
└─────────────────┬───────────────────────────────┘
                  │ HTTP (Fetch API)
                  ▼
┌─────────────────────────────────────────────────┐
│           Express.js Web 服务器                  │
│  ┌──────────────────────────────────────────┐  │
│  │          路由层 (RESTful API)            │  │
│  │  POST /upload          上传并剪切图片    │  │
│  │  POST /create-gif      生成GIF动图       │  │
│  │  GET  /download/:id    下载单张图片      │  │
│  │  GET  /download-all    批量下载ZIP       │  │
│  │  GET  /download-gif    下载GIF文件       │  │
│  └───────────────┬──────────────────────────┘  │
│                  │                              │
│  ┌───────────────▼──────────────────────────┐  │
│  │         业务逻辑层                       │  │
│  │  cutImage()      表情剪切核心函数       │  │
│  │  - 边距裁剪      Sharp extract          │  │
│  │  - 网格分割      计算坐标 + 批量裁剪    │  │
│  │  - 高清输出      quality:100 + PNG      │  │
│  │                                          │  │
│  │  createGIF()     GIF生成核心函数        │  │
│  │  - 尺寸计算      auto/fixed 模式        │  │
│  │  - 帧处理        Sharp resize + contain │  │
│  │  - GIF编码       gif-encoder-2          │  │
│  └───────────────┬──────────────────────────┘  │
│                  │                              │
│  ┌───────────────▼──────────────────────────┐  │
│  │         文件处理层                       │  │
│  │  Multer          文件上传中间件          │  │
│  │  Sharp           高性能图片处理          │  │
│  │  GIF-Encoder-2   GIF编码器               │  │
│  │  Archiver        ZIP压缩打包             │  │
│  └───────────────┬──────────────────────────┘  │
└──────────────────┼──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│              文件系统                            │
│  uploads/         临时上传目录                   │
│  output/          剪切结果输出                   │
│    └── cut_<id>/  每个会话独立目录               │
│  logs/            PM2日志文件                    │
│                                                  │
│  自动清理机制:                                   │
│  每 10 分钟清理 1 小时前的临时文件               │
└─────────────────────────────────────────────────┘
```

### 核心流程

**表情剪切流程:**
```
上传图片 → Multer 解析 → Sharp 读取元数据
    ↓
应用边距裁剪（可选）→ Sharp extract
    ↓
计算网格坐标 → 循环提取小图 → Sharp extract + PNG输出
    ↓
生成文件列表 → 返回 JSON → 前端展示预览
    ↓
用户下载（单张/ZIP） → Stream 响应 → 浏览器接收
```

**GIF 生成流程:**
```
上传多图 → Multer 解析数组 → 检测第一张图片尺寸
    ↓
计算目标尺寸（auto 模式：保持宽高比 | fixed 模式：固定尺寸）
    ↓
循环处理每一帧:
  - Sharp resize (fit: contain)
  - 转换为 RGBA Buffer
  - 添加到 GIF Encoder
    ↓
编码完成 → 保存 GIF 文件 → 返回文件信息
    ↓
前端预览 → 用户下载
```

## 🚀 Production Deployment

### 使用 PM2 部署（推荐）

```bash
# 1. 全局安装 PM2（首次部署）
npm install -g pm2

# 2. 启动应用
pm2 start ecosystem.config.js

# 3. 查看运行状态
pm2 status

# 4. 查看日志
pm2 logs cutImg
pm2 logs cutImg --lines 100        # 查看最近100行
pm2 logs cutImg --err              # 只查看错误日志

# 5. 重启应用
pm2 restart cutImg

# 6. 停止应用
pm2 stop cutImg

# 7. 删除应用
pm2 delete cutImg
```

### 开机自启动

```bash
# 1. 保存当前 PM2 进程列表
pm2 save

# 2. 生成开机启动脚本
pm2 startup

# 3. 执行显示的命令（通常需要 sudo）
# 例如：sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# 4. 验证自启动
pm2 list
```

### 性能监控

```bash
# 实时监控
pm2 monit

# 查看进程详情
pm2 show cutImg

# 查看内存使用
pm2 list
```

### 日志管理

```bash
# 清空日志
pm2 flush

# 重载日志配置
pm2 reloadLogs
```

## 🤝 Contributing

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. **Fork 项目**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **提交 Pull Request**

### 代码规范

- 使用 2 空格缩进
- 函数添加 JSDoc 注释
- 错误处理使用 try-catch
- API 响应统一格式
- 提交信息遵循 Conventional Commits

## 📄 License

MIT License

Copyright (c) 2024 Emoji Cutter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

**Powered by Sharp.js & Express.js | Made with ❤️**

📧 Questions? Open an issue on GitHub
🐛 Found a bug? Report it in the Issues section
✨ Have an idea? Submit a Feature Request
