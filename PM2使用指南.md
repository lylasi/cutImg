# PM2 使用指南 - cutImg 项目

## 📦 已完成的配置

✅ PM2 已安装（版本 6.0.14）
✅ 已创建 `ecosystem.config.js` 配置文件
✅ 项目已使用 PM2 启动并运行在端口 7788

---

## 🚀 快速启动命令

### 基础启动方式

```bash
# 方式1：直接启动（最简单）
pm2 start server.js --name cutImg

# 方式2：使用配置文件启动（推荐）✨
pm2 start ecosystem.config.js
```

### 当前项目启动状态

```
✅ 服务名称: cutImg
✅ 运行端口: 7788
✅ 访问地址: http://localhost:7788
✅ 运行模式: cluster (可扩展)
✅ 自动重启: 启用
✅ 日志位置: ./logs/
```

---

## 📋 常用PM2命令

### 1️⃣ 启动与停止

```bash
# 启动服务
pm2 start ecosystem.config.js

# 停止服务
pm2 stop cutImg

# 重启服务
pm2 restart cutImg

# 删除服务（从PM2列表中移除）
pm2 delete cutImg

# 重载服务（零停机时间）
pm2 reload cutImg
```

### 2️⃣ 查看状态

```bash
# 查看所有服务状态
pm2 status
# 或
pm2 list
# 或
pm2 ls

# 查看详细信息
pm2 show cutImg

# 实时监控（类似 top 命令）
pm2 monit
```

### 3️⃣ 日志查看

```bash
# 查看实时日志（所有服务）
pm2 logs

# 查看指定服务的日志
pm2 logs cutImg

# 查看最近20行日志（不持续）
pm2 logs cutImg --lines 20 --nostream

# 清空日志
pm2 flush

# 只看错误日志
pm2 logs cutImg --err

# 只看输出日志
pm2 logs cutImg --out
```

### 4️⃣ 性能监控

```bash
# Web界面监控
pm2 monitor

# 查看内存使用
pm2 list

# 查看CPU和内存实时数据
pm2 monit
```

### 5️⃣ 进程管理

```bash
# 停止所有服务
pm2 stop all

# 重启所有服务
pm2 restart all

# 删除所有服务
pm2 delete all

# 保存当前进程列表
pm2 save

# 恢复之前保存的进程列表
pm2 resurrect
```

### 6️⃣ 开机自启动

```bash
# 生成启动脚本（Windows）
pm2 startup

# 保存当前进程列表到启动脚本
pm2 save

# 取消开机自启动
pm2 unstartup
```

---

## ⚙️ ecosystem.config.js 配置文件说明

```javascript
module.exports = {
  apps: [
    {
      name: "cutImg",                    // 应用名称
      script: "./server.js",             // 启动脚本
      instances: 1,                      // 实例数量（1=单实例，0/-1=CPU核心数）
      autorestart: true,                 // 自动重启
      watch: false,                      // 文件监听（开发环境可设为true）
      max_memory_restart: "1G",          // 内存超过1GB自动重启
      env: {
        NODE_ENV: "production",          // 环境变量
        PORT: 7788,                      // 端口号
      },
      error_file: "./logs/err.log",      // 错误日志路径
      out_file: "./logs/out.log",        // 输出日志路径
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",  // 日志时间格式
      merge_logs: true,                  // 合并日志
    },
  ],
};
```

### 高级配置选项

```javascript
{
  // 多实例负载均衡
  instances: 4,                  // 启动4个实例
  exec_mode: "cluster",          // 集群模式

  // 开发环境配置
  watch: true,                   // 监听文件变化
  ignore_watch: [                // 忽略监听的目录
    "node_modules",
    "logs",
    "uploads",
    "output"
  ],

  // 定时重启
  cron_restart: "0 0 * * *",    // 每天凌晨重启

  // 环境变量
  env_development: {
    NODE_ENV: "development",
    PORT: 3000
  },
  env_production: {
    NODE_ENV: "production",
    PORT: 7788
  }
}
```

---

## 🔄 实用场景

### 场景1：更新代码后重启

```bash
# 拉取最新代码
git pull

# 零停机重启
pm2 reload cutImg

# 或强制重启
pm2 restart cutImg
```

### 场景2：查看服务是否正常

```bash
# 查看状态
pm2 status

# 查看最近日志
pm2 logs cutImg --lines 50 --nostream

# 实时监控
pm2 monit
```

### 场景3：性能优化（多核CPU）

```bash
# 停止当前服务
pm2 stop cutImg

# 修改 ecosystem.config.js
# instances: 0  (自动使用所有CPU核心)

# 重新启动
pm2 start ecosystem.config.js
```

### 场景4：服务器重启后恢复

```bash
# 首次设置开机自启
pm2 startup
pm2 save

# 服务器重启后自动恢复所有服务
# （无需手动操作）
```

---

## 📊 状态说明

### 进程状态

| 状态 | 说明 |
|------|------|
| **online** | 🟢 正常运行 |
| **stopping** | 🟡 正在停止 |
| **stopped** | 🔴 已停止 |
| **launching** | 🔵 正在启动 |
| **errored** | ❌ 运行错误 |
| **one-launch-status** | 🟣 一次性启动 |

---

## 🛠️ 故障排查

### 问题1：服务启动失败

```bash
# 查看错误日志
pm2 logs cutImg --err --lines 50

# 删除服务重新启动
pm2 delete cutImg
pm2 start ecosystem.config.js
```

### 问题2：内存占用过高

```bash
# 查看内存使用
pm2 list

# 重启服务释放内存
pm2 restart cutImg

# 或调整配置文件中的 max_memory_restart
```

### 问题3：端口冲突

```bash
# Windows查看端口占用
netstat -ano | findstr :7788

# 杀死占用进程
taskkill /F /PID <进程ID>

# 重新启动PM2服务
pm2 restart cutImg
```

---

## 📁 文件结构

```
cutImg/
├── server.js                 # 主程序
├── ecosystem.config.js       # PM2配置文件 ✨
├── package.json
├── public/
│   └── index.html
├── logs/                     # PM2日志目录 ✨
│   ├── out.log              # 标准输出
│   └── err.log              # 错误日志
├── uploads/                  # 临时上传
└── output/                   # 剪切输出
```

---

## 🎯 推荐工作流

### 日常开发

```bash
# 1. 启动服务（开发模式）
pm2 start server.js --name cutImg-dev --watch

# 2. 查看日志
pm2 logs cutImg-dev

# 3. 修改代码后自动重启
# （因为启用了 --watch）
```

### 生产部署

```bash
# 1. 使用配置文件启动
pm2 start ecosystem.config.js

# 2. 保存进程列表
pm2 save

# 3. 设置开机自启
pm2 startup
```

---

## 🌐 Web监控（可选）

PM2 Plus提供Web界面监控（收费/免费版）：

```bash
# 注册并连接到PM2 Plus
pm2 link <secret_key> <public_key>

# 或使用免费的本地监控
pm2 monit
```

---

## 💡 最佳实践

1. ✅ **使用配置文件** - `ecosystem.config.js` 便于团队协作
2. ✅ **定期查看日志** - `pm2 logs` 及时发现问题
3. ✅ **设置内存限制** - `max_memory_restart` 防止内存泄漏
4. ✅ **开机自启动** - `pm2 startup && pm2 save` 保证服务可用性
5. ✅ **多实例部署** - 充分利用多核CPU
6. ✅ **日志轮转** - 定期清理旧日志 `pm2 install pm2-logrotate`

---

## 📞 获取帮助

```bash
# 查看PM2帮助
pm2 --help

# 查看特定命令帮助
pm2 start --help

# 官方文档
# https://pm2.keymetrics.io/docs/usage/quick-start/
```

---

**✨ 现在您的项目已经使用PM2管理，享受更稳定的服务！**
