# 德州扑克应用部署指南

## 阿里云服务器部署

### 1. 准备服务器

确保你的阿里云服务器已安装以下软件：
- Node.js (v18 或更高)
- npm 或 yarn
- Git (可选，用于从仓库拉取代码)
- PM2 (进程管理工具，推荐)

### 2. 连接到服务器

使用 SSH 连接到你的阿里云服务器：

```bash
ssh root@8.218.69.254
# 输入密码: zhuyunke1993
```

### 3. 安装 Node.js 和 npm (如果还没安装)

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js (使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证安装
node -v
npm -v
```

### 4. 安装 PM2 (进程管理)

```bash
npm install -g pm2
```

### 5. 上传代码到服务器

有两种方式上传代码：

#### 方式 A: 使用 Git (推荐)

如果代码在 Git 仓库中：

```bash
cd /root
git clone <你的仓库地址> poker-app
cd poker-app
```

#### 方式 B: 使用 scp 直接上传

在本地机器上（Windows 使用 Git Bash）：

```bash
# 在本地项目根目录执行
cd /path/to/your/local/poker-app
scp -r . root@8.218.69.254:/root/poker-app
```

### 6. 安装依赖和构建项目

```bash
cd /root/poker-app

# 安装根目录依赖
npm install

# 安装前端和后端依赖
npm run install:all

# 构建前端
cd client
npm run build
cd ..

# 构建后端
cd server
npm run build
cd ..
```

### 7. 配置防火墙

确保阿里云安全组开放了 3000 端口：

1. 登录阿里云控制台
2. 进入 EC2 实例 → 安全组
3. 添加入站规则：
   - 协议：TCP
   - 端口范围：3000
   - 来源：0.0.0.0/0

### 8. 使用 PM2 启动应用

```bash
cd /root/poker-app/server

# 使用 PM2 启动后端
pm2 start dist/app.js --name poker-server

# 查看状态
pm2 status

# 查看日志
pm2 logs poker-server

# 设置开机自启
pm2 startup
pm2 save
```

### 9. 配置 Nginx (可选，用于反向代理和静态文件服务)

如果想使用 Nginx 作为反向代理：

```bash
# 安装 Nginx
apt install -y nginx

# 创建配置文件
nano /etc/nginx/sites-available/poker-app
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name 8.218.69.254;

    # 前端静态文件
    location / {
        root /root/poker-app/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # WebSocket 和 API 代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
# 创建符号链接
ln -s /etc/nginx/sites-available/poker-app /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

---

## 使用 Docker 部署 (推荐)

### 1. 在服务器上安装 Docker

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装 Docker Compose
apt install -y docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 2. 上传代码并启动

```bash
cd /root
# 使用 Git 克隆或 scp 上传代码到 poker-app 目录
cd poker-app

# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 访问应用

部署成功后，通过以下地址访问：

- 前端应用：http://8.218.69.254:3000
- WebSocket：ws://8.218.69.254:3000

---

## 常用 PM2 命令

```bash
# 查看所有进程
pm2 status

# 查看日志
pm2 logs poker-server

# 重启应用
pm2 restart poker-server

# 停止应用
pm2 stop poker-server

# 删除应用
pm2 delete poker-server

# 清空日志
pm2 flush
```

---

## 故障排查

1. **端口被占用**
   ```bash
   netstat -tlnp | grep 3000
   # 或者
   lsof -i :3000
   ```

2. **防火墙问题**
   ```bash
   # 检查 UFW 防火墙（Ubuntu）
   ufw status
   
   # 如果启用，开放 3000 端口
   ufw allow 3000
   ```

3. **查看应用日志**
   ```bash
   pm2 logs poker-server
   ```
