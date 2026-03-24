# 阶段 1: 构建前端
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 阶段 2: 构建后端
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# 阶段 3: 运行阶段
FROM node:20-alpine
WORKDIR /app

# 安装 PM2 用于进程管理
RUN npm install -g pm2

# 复制后端构建文件
COPY --from=server-builder /app/server/package*.json ./
COPY --from=server-builder /app/server/dist ./dist
RUN npm install --production

# 复制前端静态文件
COPY --from=client-builder /app/client/dist ./public

# 暴露端口
EXPOSE 3000

# 使用 PM2 启动应用
CMD ["pm2-runtime", "start", "dist/app.js", "--name", "poker-server"]
