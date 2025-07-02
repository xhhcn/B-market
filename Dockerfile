# 使用多阶段构建
FROM node:20-slim AS builder

# 设置工作目录
WORKDIR /app

# 复制前端源代码和package文件
COPY package*.json ./
COPY tsconfig.json ./
COPY astro.config.mjs ./

# 安装前端依赖
RUN npm ci

# 复制前端源代码
COPY src/ ./src/
COPY public/ ./public/

# 构建前端
RUN npm run build

# 生产阶段
FROM node:20-slim AS production

# 安装必要的工具和依赖
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    build-essential \
    python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 创建工作目录
WORKDIR /app

# 复制API代码和依赖
COPY api/package*.json ./api/
WORKDIR /app/api
RUN npm ci --only=production

# 复制API源代码
COPY api/ ./

# 回到主目录
WORKDIR /app

# 复制前端package文件并安装生产依赖
COPY package*.json ./
COPY tsconfig.json ./
COPY astro.config.mjs ./
RUN npm ci --only=production

# 从builder阶段复制构建好的前端文件
COPY --from=builder /app/dist ./dist

# 创建nginx配置目录
RUN mkdir -p /etc/nginx/conf.d

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建supervisor配置目录
RUN mkdir -p /etc/supervisor/conf.d

# 创建supervisor配置文件
RUN echo '[supervisord]' > /etc/supervisor/conf.d/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'user=root' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:api]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=node /app/api/servers.js' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app/api' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'redirect_stderr=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/var/log/api.log' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:astro]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=node /app/dist/server/entry.mjs' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'environment=HOST="0.0.0.0",PORT="4321"' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'redirect_stderr=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/var/log/astro.log' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:nginx]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=nginx -g "daemon off;"' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'redirect_stderr=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/var/log/nginx.log' >> /etc/supervisor/conf.d/supervisord.conf

# 创建日志目录
RUN mkdir -p /var/log && \
    touch /var/log/api.log /var/log/astro.log /var/log/nginx.log

# 创建nginx运行目录
RUN mkdir -p /run/nginx

# 暴露8006端口
EXPOSE 8006

# 启动supervisor管理所有服务
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"] 