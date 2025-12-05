const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * 创建测试图片
 * @param {string} outputPath - 输出路径
 * @param {number} width - 图片宽度
 * @param {number} height - 图片高度
 * @param {string} text - 图片上的文字
 */
async function createTestImage(outputPath, width = 600, height = 400, text = 'Test') {
  const svg = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#4A90E2"/>
      <text x="50%" y="50%" font-size="48" fill="white" 
            text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

/**
 * 创建 6x4 网格测试图片（模拟表情版图）
 * @param {string} outputPath - 输出路径
 * @param {number} cols - 列数
 * @param {number} rows - 行数
 * @param {number} cellSize - 每个格子的尺寸
 */
async function createGridImage(outputPath, cols = 6, rows = 4, cellSize = 100) {
  const width = cols * cellSize;
  const height = rows * cellSize;
  
  // 生成 SVG 网格
  let svg = `<svg width="${width}" height="${height}">`;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellSize;
      const y = row * cellSize;
      const num = row * cols + col + 1;
      
      svg += `
        <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" 
              fill="hsl(${(num * 15) % 360}, 70%, 60%)" stroke="white" stroke-width="2"/>
        <text x="${x + cellSize/2}" y="${y + cellSize/2}" 
              font-size="24" fill="white" text-anchor="middle" 
              dominant-baseline="middle">${num}</text>
      `;
    }
  }
  
  svg += '</svg>';

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

/**
 * 创建假的可执行文件（用于测试文件类型验证）
 * @param {string} outputPath - 输出路径
 */
function createFakeExecutable(outputPath) {
  // Windows PE 文件的魔数是 MZ (0x4D5A)
  const buffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00This is a fake executable file for testing purposes.');
  fs.writeFileSync(outputPath, buffer);
}

/**
 * 创建超大文件（用于测试文件大小限制）
 * @param {string} outputPath - 输出路径
 * @param {number} sizeInMB - 文件大小（MB）
 */
function createLargeFile(outputPath, sizeInMB = 11) {
  const buffer = Buffer.alloc(sizeInMB * 1024 * 1024, 'A');
  fs.writeFileSync(outputPath, buffer);
}

/**
 * 清理测试文件
 * @param {string} dirPath - 目录路径
 */
function cleanupTestFiles(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        cleanupTestFiles(filePath);
        fs.rmdirSync(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
  }
}

module.exports = {
  createTestImage,
  createGridImage,
  createFakeExecutable,
  createLargeFile,
  cleanupTestFiles,
};
