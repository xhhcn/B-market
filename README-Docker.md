# B-Market Docker 部署指南

## 🚀 一键部署说明

本项目已经完美支持Docker单容器部署，包含前端、后端和nginx反向代理，所有服务通过 **8006端口** 统一访问。

## ✨ 特性

- ✅ **单Docker容器** - 无需复杂的多容器配置
- ✅ **SSR支持** - 服务器端渲染确保动态功能正常工作
- ✅ **反向代理** - nginx自动处理前端和API路由
- ✅ **环境适配** - 自动检测开发/生产环境
- ✅ **数据持久化** - 数据库自动初始化和持久化
- ✅ **健康检查** - 内置服务健康监控

## 🐳 部署步骤

### 方法1：使用Docker Compose（推荐）

```bash
# 启动服务
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 方法2：直接使用Docker

```bash
# 构建镜像
docker build -t b-market:latest .

# 运行容器
docker run -d --name b-market-app -p 8006:8006 b-market:latest

# 查看日志
docker logs b-market-app
```

## 🌐 访问地址

部署成功后，通过以下地址访问：

- **主页**: http://your-server-ip:8006/
- **管理后台**: http://your-server-ip:8006/admin
- **登录页面**: http://your-server-ip:8006/login
- **API接口**: http://your-server-ip:8006/api/
- **健康检查**: http://your-server-ip:8006/health

## 🔧 环境配置

### 可选环境变量

如需自定义API地址，可以设置以下环境变量：

```bash
# 在docker-compose.yml中添加
environment:
  - PUBLIC_API_BASE_URL=http://your-custom-api:3001/api
```

### 数据持久化

默认配置已包含数据持久化：

```yaml
volumes:
  - ./data:/app/api/data  # 数据库文件持久化
```

## 📊 服务架构

```
┌─────────────────────────────────────┐
│            Nginx (Port 8006)        │
│                                     │
│  ┌─────────────┐  ┌─────────────────┐│
│  │  Frontend   │  │   API Server    ││
│  │ (Astro SSR) │  │ (Node.js:3001)  ││
│  │   Port 4321 │  │                 ││
│  └─────────────┘  └─────────────────┘│
└─────────────────────────────────────┘
```

## 🛠️ 故障排除

### 检查服务状态
```bash
# 查看容器状态
docker compose ps

# 查看详细日志
docker compose logs b-market

# 进入容器调试
docker exec -it b-market-app /bin/sh
```

### 常见问题

1. **端口冲突**: 确保8006端口未被占用
2. **权限问题**: 确保Docker有足够权限创建文件
3. **服务启动失败**: 查看日志确定具体错误原因

### 重新部署
```bash
# 完全重新部署
docker compose down
docker compose up -d --build
```

## 📝 技术细节

- **前端**: Astro + React (SSR模式)
- **后端**: Node.js + Express + SQLite
- **反向代理**: Nginx
- **进程管理**: Supervisor
- **容器**: Debian-based Node.js

## 🔐 默认配置

- **管理员密码**: 请通过管理界面设置
- **数据库**: 自动初始化SQLite数据库
- **日志**: 自动轮转和清理

## 📞 支持

如遇问题，请检查：
1. Docker和Docker Compose版本
2. 端口占用情况
3. 系统资源使用情况
4. 容器日志输出

---

**项目作者**: @xhh1128  
**部署时间**: 2025-07-02  
**Docker版本要求**: Docker 20.10+ | Docker Compose 2.0+ 