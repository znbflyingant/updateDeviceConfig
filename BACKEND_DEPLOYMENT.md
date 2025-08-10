# 后端服务部署指南

你的项目现在有两种后端选择：

## 🔄 架构选择

### 当前状态
- ✅ **Vercel部署** - 前端 + API Routes (Serverless Functions)
- 📦 **传统后端** - Express服务器在 `server/` 目录

### 推荐架构

**选项1: 纯Serverless（推荐新项目）**
- 前端：Vercel
- 后端：Vercel API Routes
- 优势：免运维、自动扩展、成本低

**选项2: 混合架构（推荐现有项目）**
- 前端：Vercel
- 后端：独立部署Express服务器
- 优势：功能完整、易于迁移

## 🚀 后端部署方案

### 1. Railway 部署 ⭐⭐⭐⭐⭐

**优势**：
- 零配置部署
- 自动检测Node.js
- 免费额度充足
- GitHub集成

**步骤**：
```bash
# 1. 推送代码到GitHub
git add .
git commit -m "添加后端部署配置"
git push origin main

# 2. 访问 https://railway.app/
# 3. 连接GitHub仓库
# 4. 选择 updatebin 项目
# 5. Railway自动部署
```

**环境变量配置**：
```bash
NODE_ENV=production
PORT=3001
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_UPLOAD_PATH=firmware/
OSS_CDN_DOMAIN=https://your-cdn-domain.com
STS_ROLE_ARN=acs:ram::your_account_id:role/your_role_name
STS_ROLE_SESSION_NAME=firmware-upload-session
HUAWEI_APP_ID=your_huawei_app_id
HUAWEI_CLIENT_ID=your_huawei_client_id
HUAWEI_CLIENT_SECRET=your_huawei_client_secret
HUAWEI_PROJECT_ID=your_huawei_project_id
FRONTEND_URL=https://updatebin-mh8g3yuqu-znbflyingants-projects.vercel.app
```

### 2. Render 部署 ⭐⭐⭐⭐

**优势**：
- 免费SSL
- 自动部署
- 简单配置

**步骤**：
```bash
# 1. 访问 https://render.com/
# 2. 创建新的Web Service
# 3. 连接GitHub仓库
# 4. 配置：
#    - Build Command: cd server && npm install
#    - Start Command: cd server && npm start
#    - Environment: Node
```

### 3. Heroku 部署 ⭐⭐⭐

**注意**：Heroku已取消免费计划

```bash
# 安装Heroku CLI
npm install -g heroku

# 登录并创建应用
heroku login
heroku create your-backend-app

# 设置环境变量
heroku config:set NODE_ENV=production
heroku config:set OSS_REGION=oss-cn-shenzhen
# ... 其他环境变量

# 部署
git push heroku main
```

### 4. Docker 部署 ⭐⭐⭐⭐

**本地测试**：
```bash
# 构建并运行
docker-compose up --build

# 后台运行
docker-compose up -d
```

**云服务器部署**：
```bash
# 1. 上传代码到服务器
scp -r . user@your-server:/path/to/app

# 2. 在服务器上
cd /path/to/app
docker-compose up -d

# 3. 配置反向代理 (Nginx)
# server {
#     listen 80;
#     server_name your-domain.com;
#     location / {
#         proxy_pass http://localhost:3001;
#     }
# }
```

### 5. 阿里云/腾讯云 ECS

**步骤**：
```bash
# 1. 购买ECS实例
# 2. 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装PM2
npm install -g pm2

# 4. 部署应用
cd server
npm install --production
pm2 start index.js --name "updatebin-backend"
pm2 save
pm2 startup

# 5. 配置Nginx反向代理
sudo apt install nginx
# 配置 /etc/nginx/sites-available/updatebin
```

## 🔧 部署后配置

### 1. 更新前端API地址

如果使用独立后端，需要更新前端的API配置：

```typescript
// vue-frontend/src/services/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.com/api'
  : 'http://localhost:3001/api';
```

### 2. CORS配置

确保后端允许前端域名访问：

```javascript
// server/index.js
app.use(cors({
  origin: [
    'https://updatebin-mh8g3yuqu-znbflyingants-projects.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

### 3. 健康检查

所有平台都支持健康检查端点：`/api/health`

## 📊 部署平台对比

| 平台 | 免费额度 | 易用性 | 性能 | 推荐度 |
|------|----------|--------|------|--------|
| Railway | ✅ 充足 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Render | ✅ 有限 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Heroku | ❌ 付费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 阿里云ECS | ❌ 付费 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🎯 推荐方案

**对于你的项目，我推荐：**

1. **Railway部署Express后端** - 简单、免费、稳定
2. **保持Vercel前端** - 已经部署成功
3. **后续可以逐步迁移到纯Serverless** - 根据需要

这样你就有了一个完整的前后端分离架构！
