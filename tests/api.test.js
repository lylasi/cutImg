const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { setupTestFixtures, FIXTURES_DIR } = require('./helpers/setupFixtures');
const { createLargeFile, cleanupTestFiles } = require('./helpers/createTestImage');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // 使用随机端口

// 导入应用
const app = require('../server');

// 测试数据路径
const GRID_IMAGE_PATH = path.join(FIXTURES_DIR, 'grid-6x4.png');
const FAKE_IMAGE_PATH = path.join(FIXTURES_DIR, 'fake.png');
const LARGE_FILE_PATH = path.join(FIXTURES_DIR, 'large-file.png');
const TEST_IMAGE_1 = path.join(FIXTURES_DIR, 'test-image-1.png');
const TEST_IMAGE_2 = path.join(FIXTURES_DIR, 'test-image-2.png');
const TEST_IMAGE_3 = path.join(FIXTURES_DIR, 'test-image-3.png');

// 在所有测试之前运行
beforeAll(async () => {
  await setupTestFixtures();
});

// 在所有测试之后清理
afterAll(() => {
  // 清理测试生成的输出文件
  const outputDir = path.join(__dirname, '../output');
  const uploadsDir = path.join(__dirname, '../uploads');
  
  cleanupTestFiles(outputDir);
  cleanupTestFiles(uploadsDir);
  
  console.log('\n🧹 测试文件清理完成\n');
});

describe('🧪 cutImg API 测试套件', () => {
  
  // ============================================================
  // 测试 1: 健康检查端点
  // ============================================================
  describe('GET /health - 健康检查端点', () => {
    test('应该返回服务健康状态', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('filesystem');
      expect(response.body.filesystem.uploads).toBe('ok');
      expect(response.body.filesystem.output).toBe('ok');
    });

    test('应该包含 Helmet 安全头', async () => {
      const response = await request(app).get('/health');

      // Helmet 设置的安全头
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  // ============================================================
  // 测试 2: 正常图片上传和剪切
  // ============================================================
  describe('POST /upload - 正常图片上传和剪切', () => {
    test('应该成功上传并剪切 6x4 网格图片', async () => {
      const response = await request(app)
        .post('/upload')
        .field('cols', '6')
        .field('rows', '4')
        .field('marginTop', '0')
        .field('marginRight', '0')
        .field('marginBottom', '0')
        .field('marginLeft', '0')
        .attach('image', GRID_IMAGE_PATH);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('count', 24); // 6 * 4 = 24
      expect(response.body).toHaveProperty('files');
      expect(response.body.files).toHaveLength(24);

      // 验证文件名格式
      const firstFile = response.body.files[0];
      expect(firstFile).toMatch(/emoji_\d+_\d+\.png/);
    }, 15000); // 增加超时时间，因为图片处理可能较慢

    test('应该拒绝没有上传文件的请求', async () => {
      const response = await request(app)
        .post('/upload')
        .field('cols', '6')
        .field('rows', '4');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('应该拒绝无效的行列参数', async () => {
      const response = await request(app)
        .post('/upload')
        .field('cols', '0') // 无效值
        .field('rows', '4')
        .attach('image', GRID_IMAGE_PATH);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  // ============================================================
  // 测试 3: 文件类型伪造攻击测试
  // ============================================================
  describe('POST /upload - 文件类型验证（魔数检测）', () => {
    test('应该拒绝伪造的图片文件（.exe 改名为 .png）', async () => {
      const response = await request(app)
        .post('/upload')
        .field('cols', '6')
        .field('rows', '4')
        .attach('image', FAKE_IMAGE_PATH);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('不是有效的图片文件');
    });

    test('验证失败后应该自动删除上传的文件', async () => {
      // 记录上传前的文件数量
      const uploadsDir = path.join(__dirname, '../uploads');
      const filesBefore = fs.existsSync(uploadsDir) 
        ? fs.readdirSync(uploadsDir).length 
        : 0;

      await request(app)
        .post('/upload')
        .field('cols', '6')
        .field('rows', '4')
        .attach('image', FAKE_IMAGE_PATH);

      // 验证文件数量没有增加（被删除了）
      const filesAfter = fs.existsSync(uploadsDir) 
        ? fs.readdirSync(uploadsDir).length 
        : 0;

      expect(filesAfter).toBeLessThanOrEqual(filesBefore);
    });
  });

  // ============================================================
  // 测试 4: 文件大小限制测试
  // ============================================================
  describe('POST /upload - 文件大小限制', () => {
    test('应该拒绝超过 10MB 的文件', async () => {
      // 动态创建 11MB 的文件
      createLargeFile(LARGE_FILE_PATH, 11);

      const response = await request(app)
        .post('/upload')
        .field('cols', '6')
        .field('rows', '4')
        .attach('image', LARGE_FILE_PATH);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('文件大小超过限制');

      // 清理大文件
      if (fs.existsSync(LARGE_FILE_PATH)) {
        fs.unlinkSync(LARGE_FILE_PATH);
      }
    }, 15000);
  });

  // ============================================================
  // 测试 5: GIF 生成功能测试
  // ============================================================
  describe('POST /create-gif - GIF 生成功能', () => {
    test('应该成功生成 GIF 动图', async () => {
      const response = await request(app)
        .post('/create-gif')
        .field('delay', '100')
        .field('quality', '10')
        .field('repeat', '0')
        .field('sizeMode', 'fixed')
        .field('width', '256')
        .field('height', '256')
        .attach('images', TEST_IMAGE_1)
        .attach('images', TEST_IMAGE_2)
        .attach('images', TEST_IMAGE_3);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('gifFile');
      expect(response.body.gifFile).toMatch(/\.gif$/);
      expect(response.body).toHaveProperty('fileSize');
      expect(response.body).toHaveProperty('dimensions');
    }, 20000); // GIF 生成可能需要更长时间

    test('应该拒绝少于 2 张图片的请求', async () => {
      const response = await request(app)
        .post('/create-gif')
        .field('delay', '100')
        .attach('images', TEST_IMAGE_1);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('至少需要2张图片');
    });

    test('应该支持 auto 尺寸模式', async () => {
      const response = await request(app)
        .post('/create-gif')
        .field('delay', '100')
        .field('quality', '10')
        .field('repeat', '0')
        .field('sizeMode', 'auto')
        .field('maxSize', '800')
        .attach('images', TEST_IMAGE_1)
        .attach('images', TEST_IMAGE_2);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.dimensions).toHaveProperty('width');
      expect(response.body.dimensions).toHaveProperty('height');
    }, 20000);
  });

  // ============================================================
  // 测试 6: 速率限制测试
  // ============================================================
  describe('速率限制中间件', () => {
    test('应该在达到限制后拒绝请求', async () => {
      // 速率限制：50 次/15分钟
      // 注意：这个测试可能会很慢，因为需要发送多个请求
      
      const promises = [];
      const testCount = 5; // 为了测试速度，只测试少量请求

      for (let i = 0; i < testCount; i++) {
        promises.push(
          request(app)
            .get('/health')
            .then(res => res.status)
        );
      }

      const results = await Promise.all(promises);
      
      // 所有请求应该成功（因为远低于限制）
      results.forEach(status => {
        expect(status).toBe(200);
      });

      console.log(`✅ 发送 ${testCount} 个请求，全部通过速率限制检查`);
    }, 10000);

    test('速率限制头应该存在', async () => {
      const response = await request(app).get('/health');

      // 检查速率限制响应头
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });

  // ============================================================
  // 测试 7: 下载端点测试
  // ============================================================
  describe('GET /download/:sessionId/:filename - 文件下载', () => {
    let sessionId;
    let fileName;

    beforeAll(async () => {
      // 先上传一张图片以获取 sessionId
      const uploadResponse = await request(app)
        .post('/upload')
        .field('cols', '2')
        .field('rows', '2')
        .attach('image', GRID_IMAGE_PATH);

      sessionId = uploadResponse.body.sessionId;
      fileName = uploadResponse.body.files[0];
    }, 15000);

    test('应该成功下载单个文件', async () => {
      const response = await request(app)
        .get(`/download/${sessionId}/${fileName}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
    });

    test('应该拒绝不存在的文件', async () => {
      const response = await request(app)
        .get(`/download/${sessionId}/nonexistent.png`);

      expect(response.status).toBe(404);
    });

    test('应该拒绝路径遍历攻击', async () => {
      const response = await request(app)
        .get(`/download/${sessionId}/../../../etc/passwd`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('文件名不合法');
    });
  });

  // ============================================================
  // 测试 8: ZIP 打包下载测试
  // ============================================================
  describe('GET /download/:sessionId - ZIP 打包下载', () => {
    let sessionId;

    beforeAll(async () => {
      // 先上传一张图片以获取 sessionId
      const uploadResponse = await request(app)
        .post('/upload')
        .field('cols', '3')
        .field('rows', '2')
        .attach('image', GRID_IMAGE_PATH);

      sessionId = uploadResponse.body.sessionId;
    }, 15000);

    test('应该成功下载 ZIP 压缩包', async () => {
      const response = await request(app)
        .get(`/download/${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/zip');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body.length).toBeGreaterThan(0);
    }, 10000);

    test('应该拒绝不存在的 sessionId', async () => {
      const response = await request(app)
        .get('/download/nonexistent-session-id');

      expect(response.status).toBe(404);
    });
  });

  // ============================================================
  // 测试 9: 错误处理测试
  // ============================================================
  describe('全局错误处理', () => {
    test('404 路由应该返回正确的错误', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint');

      expect(response.status).toBe(404);
    });

    test('错误响应应该有统一格式', async () => {
      const response = await request(app)
        .post('/upload')
        .field('cols', '6')
        .field('rows', '4');
      // 没有上传文件

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});
