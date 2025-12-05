# Emoji Cutter - 表情包剪切工具

A web-based image processing tool for automatically splitting emoji sheets and creating GIF animations.

## Overview

Emoji Cutter is a Node.js web application that provides two core functionalities:

1. **Emoji Sheet Cutting**: Automatically splits large emoji sheets (e.g., 6×4 grids) into individual PNG images with customizable rows, columns, and margin cropping. Supports high-quality lossless output with PNG quality 100 and compression level 9.

2. **GIF Animation Creation**: Combines multiple images into animated GIFs with configurable frame delay, size modes (fixed/auto), crop options (none/square/4:3/16:9), and loop settings. Uses intelligent size calculation to maintain aspect ratios.

3. **Image Sharing**: Generate unique short URLs to share cutting results with others, with persistent storage in `shares.json`.

The project uses Express.js for the backend API, Sharp for high-performance native image processing, and vanilla HTML5/CSS3/JavaScript for the frontend. No build tools required. Automatic cleanup of temporary files (older than 1 hour) runs every 10 minutes to prevent disk space issues.

## Technology Stack

### Runtime & Framework

- **Node.js**: v14.0.0+ (JavaScript runtime)
- **Express.js**: ^4.18.2 (Web framework, RESTful API server)

### Core Dependencies

- **Sharp**: ^0.33.1 (High-performance image processing with native C++ bindings)
- **gif-encoder-2**: ^1.0.5 (GIF encoding library for animation creation)
- **Multer**: ^1.4.5-lts.1 (Multipart/form-data file upload middleware)
- **Archiver**: ^6.0.1 (ZIP compression for batch downloads)

### Frontend

- **Vanilla JavaScript**: ES6+ with Fetch API
- **HTML5 Canvas API**: Real-time preview and image manipulation
- **CSS3**: Responsive design with flexbox/grid
- **Drag & Drop API**: File upload interaction

### Development Tools

- **PM2**: Process manager for production deployment (optional)
- **npm/pnpm**: Package manager

## Project Structure

```
cutImg/
├── 📄 package.json              # Dependencies & scripts configuration
│   ├── Dependencies: express, sharp, multer, archiver, gif-encoder-2
│   ├── Scripts: start, dev (both run server.js)
│   └── License: MIT
│
├── 🚀 server.js                 # Main Express server (710 lines)
│   ├── PORT: 7788
│   ├── Directories: uploads/, output/, public/
│   │
│   ├── Core Functions:
│   │   ├── readShares()           # Read shares.json data
│   │   ├── saveShares(shares)     # Persist sharing data
│   │   ├── generateShareId()      # Generate 8-char hex share ID
│   │   ├── cleanOldFiles()        # Auto cleanup (runs every 10min)
│   │   ├── cutImage()             # Emoji cutting core algorithm
│   │   │   ├── Parameters: inputPath, outputFolder, rows, cols, cropMargins
│   │   │   ├── Process: Extract metadata → Apply margin crop → Grid split
│   │   │   ├── Output: PNG files (quality:100, compressionLevel:9)
│   │   │   └── Returns: { success, count, files, outputFolder }
│   │   └── (GIF creation logic inline in POST /create-gif route)
│   │
│   ├── API Routes:
│   │   ├── POST   /upload                    # Upload & cut emoji sheet
│   │   ├── POST   /create-gif                # Generate GIF animation
│   │   ├── GET    /download/:sessionId/:fileName  # Download single image
│   │   ├── GET    /download-all/:sessionId   # Download all images as ZIP
│   │   ├── GET    /download-gif/:filename    # Download generated GIF
│   │   ├── GET    /preview/:sessionId        # Get cutting preview info
│   │   ├── POST   /api/share/:sessionId      # Generate share link
│   │   ├── GET    /api/share/:shareId/data   # Get share data by ID
│   │   └── GET    /share/:shareId            # View share page
│   │
│   └── Middleware:
│       ├── express.static(public/) → Serve frontend
│       ├── multer storage config   → File upload handling
│       └── File filters: jpeg|jpg|png|gif|webp, max 10MB
│
├── ⚙️ ecosystem.config.js       # PM2 process manager config
│   ├── App name: cutImg
│   ├── Instances: 1 (Sharp doesn't support cluster mode)
│   ├── Memory limit: 1GB auto-restart
│   └── Logs: ./logs/out.log, ./logs/err.log
│
├── 🌐 public/                   # Frontend static files
│   ├── index.html               # Main web interface
│   │   ├── Tab 1: Emoji cutting (drag/paste upload, grid settings)
│   │   ├── Tab 2: GIF creation (multi-upload, drag-sort, params)
│   │   └── Features: Canvas preview, real-time validation
│   └── share.html               # Share page for viewing shared results
│
├── 📂 uploads/                  # Temporary upload directory (auto-created)
├── 📂 output/                   # Processing output directory (auto-created)
│   ├── cut_<timestamp>/         # Emoji cutting results (session folders)
│   │   ├── emoji_01.png
│   │   ├── emoji_02.png
│   │   └── ...
│   └── gif_<timestamp>.gif      # Generated GIF files
│
├── 📄 shares.json               # Share ID mapping storage
│   └── Format: { "shareId": { "sessionId": "cut_xxx", "createdAt": "ISO date" } }
│
├── 📂 logs/                     # PM2 logs (auto-created)
│   ├── out.log                  # stdout logs
│   └── err.log                  # stderr logs
│
├── 📖 README.md                 # User-facing documentation (Chinese)
├── 📖 SNOW.md                   # Technical documentation (Chinese, 578 lines)
├── 📖 AGENTS.md                 # This file - AI agent reference
│
└── 📜 Installation Scripts
    ├── install-deps.sh          # Linux/Mac dependency installer
    └── install-deps.bat         # Windows dependency installer
```

## Key Features

### 🎯 Emoji Sheet Cutting

- **Flexible Grid Configuration**: Supports 1-20 rows × 1-20 columns (default: 4×6)
- **Margin Cropping**: Independent top/bottom/left/right margin adjustment (0-200px)
- **High-Quality Output**: PNG format with quality:100 + compressionLevel:9 (lossless)
- **Multiple Upload Methods**: Click/drag-drop/Ctrl+V paste
- **Real-time Preview**: Canvas-based grid overlay before cutting
- **Batch Download**: Single file download or ZIP archive

### 🎬 GIF Animation Creation

- **Multi-Image Support**: 2-20 images per GIF
- **Size Modes**:
  - Fixed: 100-800px square (default: 256×256)
  - Auto: Maintains first image aspect ratio, max size 200-1200px (default: 800px)
- **Frame Delay**: 50-500ms (controls playback speed)
- **Crop Options**: none | square (1:1) | 4:3 | 16:9 | percent (custom ratio)
- **Smart Processing**: Uses Sharp `fit: "contain"` to preserve aspect ratios with transparent background
- **Loop Control**: Infinite loop (default) or custom repeat count
- **Drag-Sort Interface**: Reorder frames visually before generation

### 🔗 Image Sharing

- **Unique Short URLs**: 8-character hex IDs (e.g., `/share/a1b2c3d4`)
- **Persistent Storage**: shares.json mapping (shareId → sessionId)
- **One-Time Generation**: Each session gets one share link (prevents duplicates)
- **Metadata Tracking**: Creation timestamp, file count, session info

### 🛡️ System Features

- **Auto Cleanup**: Every 10 minutes, removes files older than 1 hour
- **File Size Limit**: 10MB per upload
- **Format Support**: JPG, PNG, GIF, WebP
- **Error Handling**: Comprehensive try-catch with detailed console logging
- **Responsive Design**: Mobile-friendly UI

## Getting Started

### Prerequisites

```bash
Node.js >= v14.0.0
npm >= v6.0.0
```

**Platform Support**: Windows, Linux, macOS

### Installation

#### Method 1: Exact Version Install (Recommended)

```bash
git clone <repository-url>
cd cutImg
npm ci  # Uses package-lock.json for exact versions
```

#### Method 2: Standard Install

```bash
npm install
```

#### Method 3: Automated Scripts

**Linux/macOS:**

```bash
bash install-deps.sh
```

**Windows:**

```cmd
install-deps.bat
```

#### Troubleshooting Sharp Module

If Sharp installation fails (common on Linux servers with native bindings):

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild native modules
npm rebuild

# Verify Sharp
node -e "require('sharp')" && echo "✅ Sharp OK"

# Check installed packages
npm list --depth=0
```

**Network Issues:**

```bash
# Use Chinese mirror (faster in China)
npm config set registry https://registry.npmmirror.com
```

### Usage

#### Start Development Server

```bash
npm start
# or
npm run dev
```

Server starts at: **http://localhost:7788**

#### Using the Web Interface

**Emoji Cutting Workflow:**

1. Open http://localhost:7788
2. Navigate to "表情剪切" (Emoji Cutting) tab
3. Upload image: drag/click/Ctrl+V
4. Configure:
   - Rows & Columns (e.g., 6×4 = 24 emojis)
   - Margin cropping (optional, removes white borders)
5. Click "确认剪切" (Confirm Cut)
6. Download single images or batch ZIP

**GIF Creation Workflow:**

1. Navigate to "GIF 生成" (GIF Creation) tab
2. Upload 2-20 images
3. Drag to reorder frames (optional)
4. Configure:
   - Frame delay: 50-500ms (default: 500ms)
   - Size mode: Fixed (256×256) or Auto (maintains aspect ratio)
   - Crop mode: none/square/4:3/16:9
5. Click "生成 GIF" (Generate GIF)
6. Preview and download

## Development

### Available Scripts

| Command       | Description                              |
| ------------- | ---------------------------------------- |
| `npm start`   | Start production server                  |
| `npm run dev` | Start development server (same as start) |

### API Endpoints Reference

#### POST /upload

Upload and cut emoji sheet into individual images.

**Request** (multipart/form-data):

```javascript
{
  image: File,              // Image file (required)
  rows: 4,                  // Number of rows (1-20, default: 4)
  cols: 6,                  // Number of columns (1-20, default: 6)
  cropTop: 0,               // Top margin to crop (px, default: 0)
  cropBottom: 0,            // Bottom margin to crop (px, default: 0)
  cropLeft: 0,              // Left margin to crop (px, default: 0)
  cropRight: 0,             // Right margin to crop (px, default: 0)
  // Legacy params also supported: marginTop, marginBottom, marginLeft, marginRight
}
```

**Response**:

```json
{
  "success": true,
  "message": "成功剪切为 24 张表情",
  "data": {
    "sessionId": "cut_1701234567890",
    "count": 24,
    "files": ["emoji_01.png", "emoji_02.png", "..."],
    "outputFolder": "cut_1701234567890"
  }
}
```

**Error Response**:

```json
{
  "error": "请上传图片文件" | "剪切失败: <error message>"
}
```

#### POST /create-gif

Generate animated GIF from multiple images.

**Request** (multipart/form-data):

```javascript
{
  images: [File, File, ...],  // 2-20 image files (required)
  delay: 500,                 // Frame delay in ms (50-500, default: 500)
  sizeMode: "auto",           // "fixed" | "auto" (default: "auto")

  // Fixed mode parameters:
  width: 256,                 // Width in px (100-800, default: 256)
  height: 256,                // Height in px (100-800, default: 256)

  // Auto mode parameters:
  maxSize: 800,               // Max dimension in px (200-1200, default: 800)

  // Crop parameters:
  crop: "none",               // "none" | "square" | "4:3" | "16:9" | "percent"
  cropRatio: 100,             // Crop percentage (for "percent" mode, 1-100)

  // Loop parameters:
  loop: 0                     // Loop count (0 = infinite, default: 0)
}
```

**Response**:

```json
{
  "success": true,
  "message": "GIF生成成功",
  "data": {
    "fileName": "gif_1701234567890.gif",
    "frameCount": 5,
    "width": 800,
    "height": 600,
    "delay": 500,
    "loop": 0
  }
}
```

**Error Response**:

```json
{
  "error": "请至少上传一张图片" | "GIF生成失败: <error message>"
}
```

#### GET /download/:sessionId/:fileName

Download a single cut emoji image.

**Parameters**:

- `sessionId`: Session folder name (e.g., "cut_1701234567890")
- `fileName`: Image filename (e.g., "emoji_01.png")

**Response**: Binary PNG file

#### GET /download-all/:sessionId

Download all cut emojis as ZIP archive.

**Parameters**:

- `sessionId`: Session folder name

**Response**: Binary ZIP file (`emojis.zip`)

#### GET /download-gif/:filename

Download generated GIF file.

**Parameters**:

- `filename`: GIF filename (e.g., "gif_1701234567890.gif")

**Response**: Binary GIF file

#### GET /preview/:sessionId

Get preview information for a cutting session.

**Parameters**:

- `sessionId`: Session folder name

**Response**:

```json
{
  "success": true,
  "data": {
    "sessionId": "cut_1701234567890",
    "count": 24,
    "files": ["emoji_01.png", "..."]
  }
}
```

#### POST /api/share/:sessionId

Generate a unique share link for a cutting session.

**Parameters**:

- `sessionId`: Session folder name (e.g., "cut_1701234567890")

**Response**:

```json
{
  "success": true,
  "data": {
    "shareId": "a1b2c3d4",
    "shareUrl": "http://localhost:7788/share/a1b2c3d4",
    "sessionId": "cut_1701234567890"
  },
  "message": "分享链接生成成功"
}
```

**Behavior**:

- If session already has a share link, returns existing shareId
- New sessions get a unique 8-character hex ID
- Saves mapping to `shares.json`

#### GET /api/share/:shareId/data

Get shared session data by share ID.

**Parameters**:

- `shareId`: 8-character share ID (e.g., "a1b2c3d4")

**Response**:

```json
{
  "sessionId": "cut_1701234567890",
  "files": ["emoji_01.png", "..."],
  "count": 24,
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Error**: 404 if share ID not found

#### GET /share/:shareId

View shared results in web interface.

**Parameters**:

- `shareId`: 8-character share ID

**Response**: HTML page (`share.html`)

### Development Workflow

1. **Local Development**

   ```bash
   npm start
   # Server runs on http://localhost:7788
   # Edit code → Restart server to apply changes
   ```

2. **Testing Features**

   - Test emoji cutting with various grid sizes (6×4, 8×3, etc.)
   - Test GIF generation with different size modes and crop settings
   - Check browser console for detailed logs (especially GIF processing)
   - Verify automatic file cleanup after 1 hour

3. **Code Quality Standards**
   - Use `console.log()` for debug output with emoji prefixes (🎯, ✅, ❌, etc.)
   - Wrap all async operations in `try-catch` blocks
   - API responses follow: `{ success: boolean, message: string, data: object }`
   - Use JSDoc comments for functions
   - Error messages should be user-friendly in Chinese

### Core Algorithms

#### Emoji Cutting Algorithm (`cutImage()`)

```javascript
async function cutImage(inputPath, outputFolder, rows, cols, cropMargins) {
  // 1. Load image metadata
  const metadata = await sharp(inputPath).metadata();

  // 2. Apply margin cropping (optional)
  if (cropTop || cropBottom || cropLeft || cropRight) {
    // Create temporary cropped image
    tempCroppedPath = ...;
    await sharp(inputPath)
      .extract({ left: cropLeft, top: cropTop, width, height })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(tempCroppedPath);
  }

  // 3. Calculate cell dimensions
  const cellWidth = Math.floor(width / cols);
  const cellHeight = Math.floor(height / rows);

  // 4. Extract grid cells in parallel
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const left = col * cellWidth;
      const top = row * cellHeight;

      await sharp(processedImagePath)
        .extract({ left, top, width: cellWidth, height: cellHeight })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
    }
  }

  // 5. Cleanup temporary files
  // 6. Return file list
}
```

**Key Points**:

- Uses `Math.floor()` for cell dimensions (may lose edge pixels)
- Parallel processing with `Promise.all()`
- Highest quality: PNG quality 100 + compression level 9
- Temporary cropped files cleaned after processing

#### GIF Generation Algorithm (inline in POST /create-gif)

```javascript
// 1. Calculate target dimensions
if (sizeMode === "auto") {
  // Get first image dimensions
  const firstMeta = await sharp(files[0].path).metadata();
  const aspectRatio = firstMeta.width / firstMeta.height;

  // Scale to maxSize while maintaining aspect ratio
  if (width > height) {
    finalWidth = Math.min(width, maxSize);
    finalHeight = Math.round(finalWidth / aspectRatio);
  } else {
    finalHeight = Math.min(height, maxSize);
    finalWidth = Math.round(finalHeight * aspectRatio);
  }
}

// 2. Process each frame
for (const file of req.files) {
  // Apply crop if specified
  if (crop !== "none") {
    // Calculate crop dimensions based on mode
    // Center-crop the image
  }

  // Resize to target dimensions
  const buffer = await sharp(file.path)
    .resize(finalWidth, finalHeight, {
      fit: "contain", // Preserve aspect ratio, no crop
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  frames.push(buffer);
}

// 3. Encode GIF
const encoder = new GifEncoder(finalWidth, finalHeight);
encoder.setDelay(delay);
encoder.setRepeat(loop);
encoder.start();

for (const frame of frames) {
  encoder.addFrame(frame.data);
}

encoder.finish();
```

**Critical Implementation Details**:

- **MUST use `fit: "contain"`** not `inside` - ensures all frames have identical dimensions (GIF encoder requirement)
- Transparent background for letterboxing when aspect ratios differ
- `raw()` output converts to RGBA buffer for gif-encoder-2
- Auto mode maintains first image's aspect ratio for entire animation

## Configuration

### Environment Variables

Configure in `ecosystem.config.js` or system environment:

```javascript
env: {
  NODE_ENV: "production",  // "development" | "production"
  PORT: 7788               // Server port (default: 7788)
}
```

### System Limits

**File Upload:**

```javascript
limits: {
  fileSize: 10 * 1024 * 1024;
} // 10MB max
```

**Allowed Formats:**

```javascript
const allowedTypes = /jpeg|jpg|png|gif|webp/;
```

**Auto Cleanup:**

```javascript
const oneHourAgo = Date.now() - 60 * 60 * 1000; // Files older than 1 hour
setInterval(cleanOldFiles, 10 * 60 * 1000); // Check every 10 minutes
```

**Emoji Cutting Limits:**

- Rows: 1-20 (validation in frontend)
- Columns: 1-20 (validation in frontend)
- Margin crop: 0-200px per side (validation in frontend)

**GIF Creation Limits:**

- Images: 2-20 per GIF (frontend validation)
- Frame delay: 50-500ms
- Fixed mode size: 100-800px
- Auto mode max size: 200-1200px

### PM2 Configuration

**File: `ecosystem.config.js`**

```javascript
module.exports = {
  apps: [
    {
      name: "cutImg",
      script: "./server.js",
      instances: 1, // Single instance (Sharp is not cluster-safe)
      autorestart: true, // Auto-restart on crash
      watch: false, // Disable file watching in production
      max_memory_restart: "1G", // Restart if memory exceeds 1GB
      env: {
        NODE_ENV: "production",
        PORT: 7788,
      },
      error_file: "./logs/err.log", // Error log location
      out_file: "./logs/out.log", // Output log location
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true, // Combine logs from restarts
    },
  ],
};
```

**Why Single Instance?**

- Sharp uses native C++ bindings that don't work well with Node.js cluster mode
- File system operations (uploads/output) are not shared across instances
- Session management uses file-based storage, not cluster-safe

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Client                        │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │   Emoji Cutting UI   │  │   GIF Creation UI    │    │
│  │  - Drag/Drop Upload  │  │  - Multi-Upload      │    │
│  │  - Grid Settings     │  │  - Drag-Sort Frames  │    │
│  │  - Canvas Preview    │  │  - Size/Delay Config │    │
│  └──────────────────────┘  └──────────────────────┘    │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP (Fetch API)
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js Server (Port 7788)               │
│  ┌────────────────────────────────────────────────────┐ │
│  │            RESTful API Routes                      │ │
│  │  POST /upload         → Emoji cutting              │ │
│  │  POST /create-gif     → GIF generation             │ │
│  │  GET  /download/*     → File downloads             │ │
│  │  POST /api/share/*    → Share link generation      │ │
│  │  GET  /share/*        → Share page access          │ │
│  └──────────────┬─────────────────────────────────────┘ │
│                 │                                        │
│  ┌──────────────▼─────────────────────────────────────┐ │
│  │          Business Logic Layer                      │ │
│  │                                                     │ │
│  │  cutImage(path, folder, rows, cols, margins)      │ │
│  │  ├─ Sharp.extract()    → Margin cropping          │ │
│  │  ├─ Grid calculation   → Cell coordinates         │ │
│  │  └─ Parallel extract   → PNG output (q:100)       │ │
│  │                                                     │ │
│  │  GIF Generation (inline logic)                     │ │
│  │  ├─ Size calculation   → auto/fixed mode          │ │
│  │  ├─ Sharp.resize()     → fit:"contain"+RGBA       │ │
│  │  └─ GifEncoder         → Frame encoding           │ │
│  │                                                     │ │
│  │  Share Management                                  │ │
│  │  ├─ generateShareId()  → 8-char hex ID            │ │
│  │  ├─ readShares()       → Load shares.json         │ │
│  │  └─ saveShares()       → Persist mapping          │ │
│  └──────────────┬─────────────────────────────────────┘ │
│                 │                                        │
│  ┌──────────────▼─────────────────────────────────────┐ │
│  │          File Processing Layer                     │ │
│  │  Multer           → Upload handling                │ │
│  │  Sharp            → Image manipulation             │ │
│  │  GIF-Encoder-2    → GIF encoding                   │ │
│  │  Archiver         → ZIP compression                │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                  File System                             │
│  uploads/         → Temporary uploads                    │
│  output/          → Processing results                   │
│    ├── cut_*/     → Emoji cutting sessions              │
│    └── gif_*.gif  → Generated GIF files                 │
│  shares.json      → Share ID mappings                    │
│  logs/            → PM2 logs (out.log, err.log)         │
│                                                          │
│  Auto-cleanup: Every 10min, remove files >1hr old       │
└─────────────────────────────────────────────────────────┘
```

### Request Flow Examples

**Emoji Cutting Flow:**

```
User uploads image
  → POST /upload (multipart/form-data)
  → Multer saves to uploads/
  → cutImage() called
    → Sharp loads metadata
    → Apply margin crop (optional)
    → Calculate grid cells
    → Extract each cell in parallel
    → Save as PNG (quality:100, level:9)
  → Return JSON with file list
  → Frontend displays previews
  → User clicks download
    → GET /download/:sessionId/:fileName (single)
    → GET /download-all/:sessionId (ZIP)
  → Archiver streams ZIP to browser
```

**GIF Creation Flow:**

```
User uploads 2-20 images
  → POST /create-gif (multipart/form-data array)
  → Multer saves all to uploads/
  → Calculate target dimensions (auto/fixed mode)
  → For each image:
    → Load with Sharp
    → Apply crop (optional, based on mode)
    → Resize to target (fit:"contain", transparent bg)
    → Convert to RGBA buffer
  → Create GifEncoder
  → Add all frames with delay
  → Encode and save to output/gif_*.gif
  → Return JSON with file info
  → Frontend displays preview
  → User downloads GIF
```

**Sharing Flow:**

```
User clicks "Share"
  → POST /api/share/:sessionId
  → Check shares.json for existing share
  → If new: generateShareId() (8-char hex)
  → Save mapping: shareId → sessionId
  → Return share URL
  → User shares link
  → Recipient visits /share/:shareId
  → Server loads share.html
  → Frontend calls /api/share/:shareId/data
  → Display shared images
```

## Production Deployment

### Using PM2 (Recommended)

```bash
# 1. Install PM2 globally (first time only)
npm install -g pm2

# 2. Start application
pm2 start ecosystem.config.js

# 3. View status
pm2 status

# 4. View logs
pm2 logs cutImg
pm2 logs cutImg --lines 100        # Last 100 lines
pm2 logs cutImg --err              # Errors only

# 5. Restart
pm2 restart cutImg

# 6. Stop
pm2 stop cutImg

# 7. Delete from PM2
pm2 delete cutImg
```

### Enable Auto-Startup

```bash
# 1. Save current PM2 process list
pm2 save

# 2. Generate startup script
pm2 startup

# 3. Run the displayed command (usually requires sudo)
# Example output:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# 4. Verify
pm2 list
```

### Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process details
pm2 show cutImg

# Memory usage
pm2 list
```

### Log Management

```bash
# Clear logs
pm2 flush

# Reload log configuration
pm2 reloadLogs
```

### Performance Considerations

**Memory**:

- Sharp operations are memory-intensive (loads entire image into RAM)
- GIF encoding requires all frames in memory simultaneously
- Max memory restart set to 1GB to prevent leaks

**CPU**:

- Sharp uses native C++ (libvips), very fast
- Image processing is CPU-bound
- Parallel operations use `Promise.all()` for efficiency

**Disk I/O**:

- Temporary files can accumulate quickly
- Auto-cleanup runs every 10 minutes (configurable)
- Consider SSD storage for better performance

## Contributing

Contributions are welcome! Please follow these guidelines:

### Code Standards

- **Indentation**: 2 spaces (no tabs)
- **Functions**: Add JSDoc comments
- **Error Handling**: Always use try-catch for async operations
- **API Format**: `{ success: boolean, message: string, data: object }`
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` New features
  - `fix:` Bug fixes
  - `docs:` Documentation changes
  - `refactor:` Code refactoring
  - `perf:` Performance improvements

### Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Testing

Before submitting PR:

- Test emoji cutting with various grid sizes (1×1 to 20×20)
- Test GIF generation with both size modes (fixed/auto)
- Test all crop modes (none/square/4:3/16:9)
- Test file upload limits (10MB boundary)
- Verify auto-cleanup works (wait >1hr, check files deleted)
- Check browser console for errors
- Test on different browsers (Chrome, Firefox, Edge)

## License

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

**Project Metadata**:

- Repository: https://github.com/lylasi/cutImg
- Documentation: README.md (User guide, Chinese), SNOW.md (Technical docs, Chinese), AGENTS.md (This file)
- Issues: https://github.com/lylasi/cutImg/issues
- Latest Update: 2025-12-03 (Added image sharing feature with share.html and shares.json)

**Tech Stack Summary**: Node.js + Express + Sharp + gif-encoder-2 + Vanilla JS + HTML5 Canvas

**AI Agent Notes**:

- All API routes are defined in `server.js` (single file, 710 lines)
- No external database - uses file-based storage (shares.json)
- No authentication/authorization system
- Frontend is vanilla JavaScript (no build step required)
- High-quality image processing with Sharp (native C++ bindings)
- Auto-cleanup prevents disk space issues
- PM2 recommended for production (single instance only)
