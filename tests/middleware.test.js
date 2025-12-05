const path = require('path');
const fs = require('fs');
const { validateImageFile } = require('../src/middleware/fileValidator');
const { errorHandler } = require('../src/middleware/errorHandler');
const { createTestImage, createFakeExecutable } = require('./helpers/createTestImage');

// 模拟 Express 请求和响应对象
function mockRequest(fileData) {
  return {
    file: fileData.single ? fileData.single : undefined,
    files: fileData.multiple ? fileData.multiple : undefined,
  };
}

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return jest.fn();
}

describe('🔧 中间件单元测试', () => {
  
  // ============================================================
  // 文件验证中间件测试
  // ============================================================
  describe('validateImageFile 中间件', () => {
    const TEMP_DIR = path.join(__dirname, 'temp');
    let validImagePath;
    let invalidImagePath;

    beforeAll(async () => {
      // 创建临时目录
      if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
      }

      // 创建测试文件
      validImagePath = path.join(TEMP_DIR, 'valid.png');
      invalidImagePath = path.join(TEMP_DIR, 'invalid.png');

      await createTestImage(validImagePath, 100, 100, 'Valid');
      createFakeExecutable(invalidImagePath);
    });

    afterAll(() => {
      // 清理临时文件
      if (fs.existsSync(validImagePath)) fs.unlinkSync(validImagePath);
      if (fs.existsSync(invalidImagePath)) fs.unlinkSync(invalidImagePath);
      if (fs.existsSync(TEMP_DIR)) fs.rmdirSync(TEMP_DIR);
    });

    test('应该通过有效的图片文件（单文件）', async () => {
      const req = mockRequest({
        single: {
          path: validImagePath,
          originalname: 'valid.png',
        },
      });
      const res = mockResponse();
      const next = mockNext();

      await validateImageFile(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('应该拒绝伪造的图片文件（单文件）', async () => {
      const req = mockRequest({
        single: {
          path: invalidImagePath,
          originalname: 'fake.png',
        },
      });
      const res = mockResponse();
      const next = mockNext();

      await validateImageFile(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('不是有效的图片文件'),
        })
      );

      // 验证文件已被删除
      expect(fs.existsSync(invalidImagePath)).toBe(false);

      // 重新创建文件供后续测试使用
      createFakeExecutable(invalidImagePath);
    });

    test('应该通过多个有效的图片文件', async () => {
      const req = mockRequest({
        multiple: [
          { path: validImagePath, originalname: 'valid1.png' },
          { path: validImagePath, originalname: 'valid2.png' },
        ],
      });
      const res = mockResponse();
      const next = mockNext();

      await validateImageFile(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('应该处理没有文件的情况', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext();

      await validateImageFile(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 错误处理中间件测试
  // ============================================================
  describe('errorHandler 中间件', () => {
    test('应该处理 Multer LIMIT_FILE_SIZE 错误', () => {
      const err = {
        code: 'LIMIT_FILE_SIZE',
      };
      const req = {};
      const res = mockResponse();
      const next = mockNext();

      // 临时设置配置
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('文件大小超过限制'),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    test('应该处理 Multer LIMIT_FILE_COUNT 错误', () => {
      const err = {
        code: 'LIMIT_FILE_COUNT',
      };
      const req = {};
      const res = mockResponse();
      const next = mockNext();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: '上传文件数量超过限制',
        })
      );
    });

    test('应该处理 Multer LIMIT_UNEXPECTED_FILE 错误', () => {
      const err = {
        code: 'LIMIT_UNEXPECTED_FILE',
      };
      const req = {};
      const res = mockResponse();
      const next = mockNext();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: '意外的文件字段',
        })
      );
    });

    test('应该处理通用错误', () => {
      const err = new Error('测试错误');
      err.statusCode = 500;
      const req = {};
      const res = mockResponse();
      const next = mockNext();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: '测试错误',
        })
      );
    });

    test('在开发环境应该包含堆栈信息', () => {
      const err = new Error('测试错误');
      err.stack = 'Error stack trace';
      const req = {};
      const res = mockResponse();
      const next = mockNext();

      // 设置为开发环境
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: 'Error stack trace',
        })
      );

      // 恢复原始环境
      process.env.NODE_ENV = originalEnv;
    });

    test('在生产环境不应该包含堆栈信息', () => {
      const err = new Error('测试错误');
      err.stack = 'Error stack trace';
      const req = {};
      const res = mockResponse();
      const next = mockNext();

      // 设置为生产环境
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.anything(),
        })
      );

      // 恢复原始环境
      process.env.NODE_ENV = originalEnv;
    });
  });
});
