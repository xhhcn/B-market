# B-Market 服务器管理平台

[![Docker Pulls](https://img.shields.io/docker/pulls/xhh1128/b-market)](https://hub.docker.com/r/xhh1128/b-market)
[![Docker Image Size](https://img.shields.io/docker/image-size/xhh1128/b-market/latest)](https://hub.docker.com/r/xhh1128/b-market)

简约的服务器信息管理平台，支持服务器信息管理、剩余价值计算、汇率转换等功能。

## ✨ 特性

- 🚀 **一键部署** - 单容器包含所有服务
- 💡 **SSR支持** - 服务器端渲染，SEO友好
- 🌐 **反向代理** - Nginx自动处理路由
- 💰 **价值计算** - 智能剩余价值计算器
- 🔄 **实时汇率** - 支持40+种货币转换
- 📱 **响应式** - 完美适配移动端

## 🚀 快速开始

### 一键运行

```bash
docker run -d \
  --name b-market \
  -p 8006:8006 \
  -v ./data:/app/api/data \
  xhh1128/b-market:latest
```

### 使用Docker Compose (推荐)

```yaml
version: '3.8'
services:
  b-market:
    image: xhh1128/b-market:latest
    container_name: b-market-app
    ports:
      - "8006:8006"
    volumes:
      - ./data:/app/api/data
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

启动命令：
```bash
docker compose up -d
```

## 🌐 访问地址

部署成功后通过以下地址访问：

- **主页**: http://your-server-ip:8006/
- **管理后台**: http://your-server-ip:8006/admin
- **API接口**: http://your-server-ip:8006/api/

## 🔧 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PUBLIC_API_BASE_URL` | 自定义API地址 | 自动检测 |

## 📊 功能介绍

### 服务器管理
- ✅ 服务器信息录入与编辑
- ✅ 多种状态管理（出售、保留、已售等）
- ✅ 支持标签和相关链接
- ✅ 批量操作和搜索过滤

### 智能计算
- 💰 剩余价值自动计算
- 🔄 实时汇率转换（40+种货币）
- 📈 增值分析和趋势
- ⏰ 到期提醒功能

### 现代化界面
- 🎨 美观的卡片式布局
- 📱 完全响应式设计
- 🌙 优雅的动画效果
- ⚡ 快速搜索和过滤

## 🛠️ 技术栈

- **前端**: Astro + React (SSR)
- **后端**: Node.js + Express
- **数据库**: SQLite
- **反向代理**: Nginx
- **容器**: Docker

## 📱 截图

### 主页界面
![主页](https://via.placeholder.com/600x400/f8fafc/374151?text=B-Market+主页)

### 管理后台
![管理后台](https://via.placeholder.com/600x400/f8fafc/374151?text=管理后台)

### 价值计算器
![计算器](https://via.placeholder.com/600x400/f8fafc/374151?text=剩余价值计算器)

## 🔒 安全说明

- 管理后台需要密码验证
- 数据库文件建议挂载到宿主机
- 建议使用反向代理添加SSL证书

## 📈 资源需求

- **CPU**: 1核心
- **内存**: 512MB
- **存储**: 100MB (不含数据)
- **端口**: 8006

## 🆕 更新日志

### v1.0.0 (2025-07-02)
- ✅ 初始版本发布
- ✅ 完整的Docker化部署
- ✅ SSR支持和反向代理
- ✅ 智能价值计算功能

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 作者

**@xhh1128**

- 🔗 [GitHub](https://github.com/xhh1128)
- 📧 联系方式：通过GitHub Issue

---

⭐ 如果这个项目对您有帮助，请给个Star！ 