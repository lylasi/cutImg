#!/bin/bash

# 表情包剪切工具 - 依赖自动安装脚本
# 适用于 Linux 服务器环境

echo "🎨 表情包剪切工具 - 依赖安装脚本"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo "📦 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js 已安装: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js 未安装！${NC}"
    echo "请先安装 Node.js (版本 >= 14.0.0)"
    echo "访问: https://nodejs.org/"
    exit 1
fi

# 检查 npm
echo ""
echo "📦 检查 npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm 已安装: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm 未安装！${NC}"
    exit 1
fi

# 检查 package.json
echo ""
echo "📁 检查项目文件..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json 不存在！${NC}"
    echo "请确保在项目根目录运行此脚本"
    exit 1
else
    echo -e "${GREEN}✅ package.json 存在${NC}"
fi

# 检查编译工具（对于 Sharp）
echo ""
echo "🔧 检查编译工具..."
if command -v gcc &> /dev/null; then
    GCC_VERSION=$(gcc --version | head -n1)
    echo -e "${GREEN}✅ GCC 已安装: $GCC_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  GCC 未安装（Sharp 可能无法编译）${NC}"
    echo "建议安装编译工具："
    echo "  Ubuntu/Debian: sudo apt-get install build-essential"
    echo "  CentOS/RHEL:   sudo yum install gcc-c++ make"
    echo ""
    read -p "是否继续安装？ (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查 Python（Sharp 编译需要）
echo ""
echo "🐍 检查 Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python3 已安装: $PYTHON_VERSION${NC}"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    echo -e "${GREEN}✅ Python 已安装: $PYTHON_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Python 未安装（Sharp 可能无法编译）${NC}"
fi

# 清理旧的 node_modules（可选）
echo ""
read -p "是否清理旧的 node_modules 重新安装？ (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  清理 node_modules..."
    rm -rf node_modules package-lock.json
    echo -e "${GREEN}✅ 清理完成${NC}"
fi

# 选择 npm 镜像源
echo ""
echo "🌐 选择 npm 镜像源："
echo "  1) npm 官方源（国外服务器推荐）"
echo "  2) 淘宝镜像（国内服务器推荐）"
read -p "请选择 (1/2): " -n 1 -r
echo

if [[ $REPLY == "2" ]]; then
    REGISTRY="https://registry.npmmirror.com"
    echo "📡 使用淘宝镜像"
else
    REGISTRY="https://registry.npmjs.org"
    echo "📡 使用 npm 官方源"
fi

# 安装依赖
echo ""
echo "📦 开始安装依赖..."
echo "========================================"

if npm install --registry=$REGISTRY; then
    echo ""
    echo -e "${GREEN}✅ 依赖安装成功！${NC}"
else
    echo ""
    echo -e "${RED}❌ 依赖安装失败！${NC}"
    echo ""
    echo "尝试以下方法："
    echo "1. 清除 npm 缓存: npm cache clean --force"
    echo "2. 重新安装: npm install"
    echo "3. 使用淘宝镜像: npm install --registry=https://registry.npmmirror.com"
    exit 1
fi

# 验证关键依赖
echo ""
echo "🔍 验证关键依赖..."
echo "========================================"

DEPS=("express" "multer" "sharp" "archiver")
ALL_OK=true

for dep in "${DEPS[@]}"; do
    if node -e "require('$dep')" 2>/dev/null; then
        echo -e "${GREEN}✅ $dep${NC}"
    else
        echo -e "${RED}❌ $dep${NC}"
        ALL_OK=false
    fi
done

# 创建必要目录
echo ""
echo "📁 创建必要目录..."
mkdir -p uploads output public logs
chmod 755 uploads output public logs
echo -e "${GREEN}✅ 目录创建完成${NC}"

# 最终检查
echo ""
echo "========================================"
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}🎉 所有依赖安装成功！${NC}"
    echo ""
    echo "✨ 下一步："
    echo "  1. 启动服务: npm start"
    echo "  2. 或使用 PM2: pm2 start server.js --name cutImg"
    echo "  3. 访问: http://localhost:7788"
    echo ""
    
    # 询问是否启动
    read -p "是否现在启动服务？ (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 启动服务..."
        npm start
    fi
else
    echo -e "${RED}❌ 部分依赖安装失败！${NC}"
    echo ""
    echo "请检查错误信息并尝试："
    echo "  npm install --verbose"
    exit 1
fi
