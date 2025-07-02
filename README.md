# B-Market 服务器交易记录平台

[![Docker Pulls](https://img.shields.io/docker/pulls/xhh1128/b-market?style=for-the-badge&logo=docker)](https://hub.docker.com/r/xhh1128/b-market)
[![Docker Image Size](https://img.shields.io/docker/image-size/xhh1128/b-market/latest?style=for-the-badge&logo=docker)](https://hub.docker.com/r/xhh1128/b-market)
[![GitHub](https://img.shields.io/github/license/xhhcn/B-market?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/xhhcn/B-market?style=for-the-badge)](https://github.com/xhhcn/B-market/stargazers)

🚀 一个基于 Astro 框架构建的现代化服务器交易记录管理平台，专注于记录和管理服务器购买、续费等交易信息，采用简约扁平化设计风格。

## ✨ 核心功能

- 📊 **交易记录展示** - 清晰展示服务器交易信息和状态
- 🏷️ **智能标签系统** - 快速识别服务器配置和特点
- ⏰ **到期提醒** - 智能显示剩余天数和续费状态
- 💰 **价值跟踪** - 实时显示续费价格和剩余价值计算
- 🔗 **快捷链接** - 一键访问服务商管理控制台
- 📱 **响应式设计** - 完美适配各种设备
- 🎨 **现代界面** - 简约扁平化UI设计

## 🛠️ 技术栈

- **前端**: Astro + React (SSR)
- **后端**: Node.js + Express + SQLite
- **反向代理**: Nginx
- **容器**: Docker

## 🐳 Docker 一键部署

### 使用 Docker Compose（推荐）

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
# 下载并启动服务
docker compose up -d

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 使用 Docker 命令

```bash
# 直接运行容器
docker run -d \
  --name b-market \
  -p 8006:8006 \
  -v ./data:/app/api/data \
  --restart unless-stopped \
  xhh1128/b-market:latest
```

## 🌐 访问地址

部署成功后，通过以下地址访问：

- **主页**: `http://your-server-ip:8006/`
- **管理后台**: `http://your-server-ip:8006/admin`
- **健康检查**: `http://your-server-ip:8006/health`

## 🔧 配置说明

### 环境变量（可选）
- `NODE_ENV`: 运行环境，默认 `production`
- `PUBLIC_API_BASE_URL`: 自定义API服务地址

### 数据持久化
- 数据存储在容器内 `/app/api/data` 目录
- 建议挂载到宿主机 `./data` 目录进行数据持久化
- 数据库将在首次启动时自动初始化

### 端口配置
- 容器内部端口: `8006`
- 可通过 `-p` 参数修改宿主机端口映射

## 📊 功能特性

### 交易记录管理
- ✅ 服务器信息录入与编辑
- ✅ 多种状态管理（活跃、过期、已售等）
- ✅ 支持配置标签和相关链接
- ✅ 剩余价值自动计算
- ✅ 到期提醒功能

### 现代化界面
- 🎨 美观的卡片式布局
- 📱 完全响应式设计
- 🌙 优雅的动画效果
- ⚡ 快速搜索和过滤

## 🔒 安全说明

- 管理后台需要密码验证访问
- 建议使用反向代理添加SSL证书
- 数据库文件建议挂载到宿主机进行备份

## 📈 系统要求

- **CPU**: 1核心
- **内存**: 512MB RAM
- **存储**: 100MB（不含数据）
- **端口**: 8006

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🆘 获取支持

如有问题或建议：

- 提交 [Issue](https://github.com/xhhcn/B-market/issues)
- 访问 [Docker Hub](https://hub.docker.com/r/xhh1128/b-market)
- 项目主页：https://github.com/xhhcn/B-market

## 👨‍💻 作者

**@xhh1128**

---

**B-Market** - 让服务器交易记录管理更简单 🎯



