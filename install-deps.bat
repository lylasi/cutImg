@echo off
chcp 65001 >nul
echo ====================================
echo 表情包剪切工具 - 依赖安装脚本 (Windows)
echo ====================================
echo.

REM 检查 Node.js
echo 📦 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装！
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js 已安装
    node --version
)

echo.
REM 检查 npm
echo 📦 检查 npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装！
    pause
    exit /b 1
) else (
    echo ✅ npm 已安装
    npm --version
)

echo.
REM 检查 package.json
echo 📁 检查项目文件...
if not exist package.json (
    echo ❌ package.json 不存在！
    echo 请确保在项目根目录运行此脚本
    pause
    exit /b 1
) else (
    echo ✅ package.json 存在
)

echo.
REM 询问是否清理
set /p CLEAN="是否清理旧的 node_modules 重新安装？ (y/n): "
if /i "%CLEAN%"=="y" (
    echo 🗑️  清理 node_modules...
    if exist node_modules rmdir /s /q node_modules
    if exist package-lock.json del /f /q package-lock.json
    echo ✅ 清理完成
)

echo.
REM 选择镜像源
echo 🌐 选择 npm 镜像源：
echo   1) npm 官方源
echo   2) 淘宝镜像（推荐）
set /p MIRROR="请选择 (1/2): "

if "%MIRROR%"=="2" (
    set REGISTRY=https://registry.npmmirror.com
    echo 📡 使用淘宝镜像
) else (
    set REGISTRY=https://registry.npmjs.org
    echo 📡 使用 npm 官方源
)

echo.
echo 📦 开始安装依赖...
echo ====================================
npm install --registry=%REGISTRY%

if %errorlevel% neq 0 (
    echo.
    echo ❌ 依赖安装失败！
    echo.
    echo 尝试以下方法：
    echo 1. 清除缓存: npm cache clean --force
    echo 2. 重新安装: npm install
    echo 3. 使用淘宝镜像: npm install --registry=https://registry.npmmirror.com
    pause
    exit /b 1
) else (
    echo.
    echo ✅ 依赖安装成功！
)

echo.
echo 🔍 验证关键依赖...
echo ====================================

node -e "require('express'); console.log('✅ express')"
node -e "require('multer'); console.log('✅ multer')"
node -e "require('sharp'); console.log('✅ sharp')"
node -e "require('archiver'); console.log('✅ archiver')"

if %errorlevel% neq 0 (
    echo ❌ 部分依赖验证失败！
    pause
    exit /b 1
)

echo.
echo 📁 创建必要目录...
if not exist uploads mkdir uploads
if not exist output mkdir output
if not exist public mkdir public
if not exist logs mkdir logs
echo ✅ 目录创建完成

echo.
echo ====================================
echo 🎉 所有依赖安装成功！
echo ====================================
echo.
echo ✨ 下一步：
echo   1. 启动服务: npm start
echo   2. 或使用 PM2: pm2 start ecosystem.config.js
echo   3. 访问: http://localhost:7788
echo.

set /p START="是否现在启动服务？ (y/n): "
if /i "%START%"=="y" (
    echo 🚀 启动服务...
    npm start
) else (
    echo.
    echo 💡 稍后可运行以下命令启动服务：
    echo    npm start
    echo.
    pause
)
