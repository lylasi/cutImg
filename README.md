# 🎨 表情包剪切工具 (Emoji Cutter)

一个简单易用的 Web 应用，用于将表情版图自动分割成单张表情包图片。

## ✨ 功能特性

### 📤 表情包剪切

- 📤 **拖拽上传** - 支持点击上传或拖拽文件
- ✂️ **自动剪切** - 智能分割表情版图为单张图片
- ⚙️ **自定义设置** - 可自定义行列数（1-20×1-20）
- 🔍 **边距裁剪** - 支持上下左右四个方向的边距调整
- 🖼️ **实时预览** - 剪切完成后实时预览所有表情，点击可放大查看
- 💾 **多种下载方式**
  - 单张下载：点击单个表情的下载按钮
  - 批量下载：一键打包所有表情为 ZIP 压缩包
- ✨ **高清无损** - PNG 格式输出，质量 100%，无损压缩

### 🎬 GIF 动图生成

- 🖼️ **多图合成** - 支持上传多张图片生成 GIF 动图
- 🎨 **拖拽排序** - 直观的图片顺序调整，支持拖拽重新排列
- ⚙️ **参数自定义**
  - 帧延迟：50-500ms，控制播放速度
  - 输出尺寸：128×128、256×256、512×512 或自定义
  - 循环模式：无限循环播放
- 👀 **实时预览** - 生成后即可预览 GIF 效果
- 💾 **快速下载** - 一键下载生成的 GIF 文件

### 🛠️ 通用功能

- 🎯 **支持多种格式** - JPG、PNG、GIF、WebP
- 🧹 **自动清理** - 自动清理 1 小时前的临时文件
- 📱 **响应式设计** - 适配各种屏幕尺寸

## 🚀 快速开始

### 安装依赖

#### 推荐方式（使用精确版本）

```bash
npm ci
```

#### 常规安装

```bash
npm install
```

#### 故障排查

如果遇到依赖安装问题（特别是在 Linux 服务器上），请尝试以下步骤：

1. **清理并重新安装**

```bash
# 删除旧的依赖和锁文件
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 重新构建native模块（如sharp）
npm rebuild
```

2. **验证关键依赖**

```bash
# 检查sharp模块是否正确安装
node -e "require('sharp')" && echo "✅ sharp模块正常"

# 查看已安装的依赖
npm list --depth=0
```

3. **平台特定问题**
   - **Linux 服务器**: Sharp 模块包含 native binding，可能需要重新编译
   - **权限问题**: 使用`sudo npm install --unsafe-perm`（不推荐）或修复 npm 权限
   - **网络问题**: 配置 npm 镜像源 `npm config set registry https://registry.npmmirror.com`

#### 自动安装脚本

项目提供了自动化安装脚本：

- **Linux/Mac**: `bash install-dependencies.sh`
- **Windows**: `install-dependencies.bat`

### 启动服务

```bash
npm start
```

服务将在 `http://localhost:7788` 启动

### 使用步骤

#### 表情包剪切

1. 打开浏览器访问 `http://localhost:7788`
2. 在**表情包剪切**卡片中上传你的表情版图（支持拖拽或 Ctrl+V 粘贴）
3. 根据需要调整设置：
   - 行列数：1-20×1-20（默认 6×4）
   - 边距裁剪：上下左右四个方向的边距（可选）
4. 等待自动剪切完成
5. 预览并下载：
   - 点击图片可放大预览
   - 点击单个表情的"下载"按钮 → 下载单张
   - 点击"打包下载全部(ZIP)" → 批量下载

#### GIF 动图生成

1. 在**GIF 动图生成**卡片中上传多张图片（支持拖拽）
2. 拖拽调整图片顺序（可选）
3. 设置参数：
   - 帧延迟：控制播放速度（默认 100ms）
   - 输出尺寸：选择 GIF 尺寸（默认 256×256）
4. 点击"生成 GIF"按钮
5. 等待生成完成，预览并下载 GIF 文件

## 📁 项目结构

```
cutImg/
├── package.json          # 项目配置
├── server.js             # Express服务器
├── ecosystem.config.js   # PM2配置文件
├── README.md             # 项目说明
├── public/               # 前端静态文件
│   └── index.html        # Web界面
├── uploads/              # 上传文件临时目录（自动创建）
├── output/               # 剪切结果输出目录（自动创建）
├── gifs/                 # GIF生成结果目录（自动创建）
└── logs/                 # PM2日志目录（自动创建）
```

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **图片处理**:
  - Sharp (^0.33.0) - 高清图片裁剪和缩放
  - gifencoder (^2.0.0) - GIF 动图生成
- **文件上传**: Multer
- **压缩打包**: Archiver
- **文件管理**: fs-extra
- **前端**: 原生 HTML5 + CSS3 + JavaScript (Canvas API)

## 📝 API 接口

### 表情包剪切相关

#### POST /upload

上传并剪切图片

**参数**:

- `image`: 图片文件 (multipart/form-data)
- `rows`: 行数 (可选，默认 4，范围 1-20)
- `cols`: 列数 (可选，默认 6，范围 1-20)
- `cropTop`: 上边距裁剪像素 (可选，默认 0)
- `cropBottom`: 下边距裁剪像素 (可选，默认 0)
- `cropLeft`: 左边距裁剪像素 (可选，默认 0)
- `cropRight`: 右边距裁剪像素 (可选，默认 0)

**响应**:

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

#### GET /download/:sessionId/:fileName

下载单张图片

#### GET /download-all/:sessionId

下载所有图片（ZIP 压缩包）

#### GET /preview/:sessionId

获取剪切结果预览信息

### GIF 动图生成相关

#### POST /api/create-gif

生成 GIF 动图

**参数**:

- `images`: 图片文件数组 (multipart/form-data，至少 2 张)
- `delay`: 帧延迟（毫秒，可选，默认 100，范围 50-500）
- `width`: 输出宽度（像素，可选，默认 256，范围 64-1024）
- `height`: 输出高度（像素，可选，默认 256，范围 64-1024）

**响应**:

```json
{
  "success": true,
  "message": "GIF生成成功",
  "data": {
    "filename": "gif_1234567890.gif",
    "url": "/download-gif/gif_1234567890.gif",
    "frames": 5
  }
}
```

#### GET /download-gif/:filename

下载生成的 GIF 文件

## 🎯 使用示例

### 默认 6×4 表情版图

上传一张 6 列 4 行的表情版图，自动剪切成 24 张单独的表情图片。

### 自定义尺寸

如果你的表情版图是 8×3，只需在设置中修改：

- 列数：8
- 行数：3

工具将自动剪切成 24 张表情。

## ⚠️ 注意事项

- 上传图片大小限制：10MB
- 临时文件会在 1 小时后自动清理
- 建议使用现代浏览器（Chrome、Firefox、Edge、Safari）
- GIF 生成至少需要 2 张图片
- 生成的 GIF 为无限循环模式
- 服务器运行在端口：7788

## 🚀 生产环境部署

### 使用 PM2 管理（推荐）

```bash
# 安装PM2（如未安装）
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs cutImg

# 重启应用
pm2 restart cutImg

# 停止应用
pm2 stop cutImg
```

### PM2 开机自启

```bash
# 保存当前PM2进程列表
pm2 save

# 生成开机启动脚本
pm2 startup
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Powered by Sharp.js & Express.js | Made with ❤️**
