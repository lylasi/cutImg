# 🎨 表情包剪切工具 (Emoji Cutter)

一个简单易用的 Web 应用，用于将表情版图自动分割成单张表情包图片。

## ✨ 功能特性

- 📤 **拖拽上传** - 支持点击上传或拖拽文件
- ✂️ **自动剪切** - 智能分割表情版图为单张图片
- ⚙️ **自定义设置** - 可自定义行列数（默认 6×4）
- 🖼️ **实时预览** - 剪切完成后实时预览所有表情
- 💾 **多种下载方式**
  - 单张下载：点击单个表情的下载按钮
  - 批量下载：一键打包所有表情为 ZIP 压缩包
- 🎯 **支持多种格式** - JPG、PNG、GIF、WebP
- 🧹 **自动清理** - 自动清理 1 小时前的临时文件

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

1. 打开浏览器访问 `http://localhost:7788`
2. 上传你的表情版图（支持拖拽）
3. 根据需要调整行列数设置（默认 6 列 4 行）
4. 等待自动剪切完成
5. 预览并下载：
   - 点击单个表情的"下载"按钮 → 下载单张
   - 点击"打包下载全部(ZIP)" → 批量下载

## 📁 项目结构

```
cutImg/
├── package.json          # 项目配置
├── server.js             # Express服务器
├── README.md             # 项目说明
├── public/               # 前端静态文件
│   └── index.html        # Web界面
├── uploads/              # 上传文件临时目录（自动创建）
└── output/               # 剪切结果输出目录（自动创建）
```

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **图片处理**: Sharp (高性能图像处理库)
- **文件上传**: Multer
- **压缩打包**: Archiver
- **前端**: 原生 HTML + CSS + JavaScript

## 📝 API 接口

### POST /upload

上传并剪切图片

**参数**:

- `image`: 图片文件 (multipart/form-data)
- `rows`: 行数 (可选，默认 4)
- `cols`: 列数 (可选，默认 6)

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

### GET /download/:sessionId/:fileName

下载单张图片

### GET /download-all/:sessionId

下载所有图片（ZIP 压缩包）

### GET /preview/:sessionId

获取剪切结果预览信息

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

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Powered by Sharp.js & Express.js | Made with ❤️**
