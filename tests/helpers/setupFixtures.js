const path = require('path');
const fs = require('fs');
const {
  createTestImage,
  createGridImage,
  createFakeExecutable,
  createLargeFile,
} = require('./createTestImage');

const FIXTURES_DIR = path.join(__dirname, '../fixtures');

/**
 * 在所有测试运行之前执行一次
 * 创建所有必要的测试文件
 */
async function setupTestFixtures() {
  console.log('\n🔧 正在创建测试文件...\n');

  // 确保 fixtures 目录存在
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  try {
    // 1. 创建 6x4 网格图片（用于剪切测试）
    const gridPath = path.join(FIXTURES_DIR, 'grid-6x4.png');
    if (!fs.existsSync(gridPath)) {
      await createGridImage(gridPath, 6, 4, 100);
      console.log('✅ 创建 6x4 网格图片');
    }

    // 2. 创建普通测试图片（用于 GIF 测试）
    const testImages = [
      { name: 'test-image-1.png', text: 'Frame 1' },
      { name: 'test-image-2.png', text: 'Frame 2' },
      { name: 'test-image-3.png', text: 'Frame 3' },
    ];

    for (const img of testImages) {
      const imgPath = path.join(FIXTURES_DIR, img.name);
      if (!fs.existsSync(imgPath)) {
        await createTestImage(imgPath, 256, 256, img.text);
        console.log(`✅ 创建测试图片: ${img.name}`);
      }
    }

    // 3. 创建假的可执行文件（用于文件类型伪造测试）
    const fakePath = path.join(FIXTURES_DIR, 'fake.png');
    if (!fs.existsSync(fakePath)) {
      createFakeExecutable(fakePath);
      console.log('✅ 创建伪造文件: fake.png (实际是 .exe)');
    }

    // 4. 创建超大文件（用于文件大小限制测试）
    // 注意：不立即创建，因为文件很大（11MB），在需要时创建
    console.log('✅ 超大文件将在测试时动态创建');

    console.log('\n✅ 所有测试文件准备完成！\n');
  } catch (error) {
    console.error('❌ 创建测试文件失败:', error);
    throw error;
  }
}

module.exports = { setupTestFixtures, FIXTURES_DIR };
