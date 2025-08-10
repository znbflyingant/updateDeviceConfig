# 🚂 Railway部署详细指南

## 📋 部署前检查清单

- ✅ 代码已提交到Git
- ✅ GitHub仓库已创建
- ✅ Railway配置文件已准备
- ✅ 环境变量清单已准备

## 🚀 第一步：推送代码到GitHub

如果还没有推送到GitHub：

```bash
# 1. 在GitHub创建新仓库 updatebin
# 2. 添加远程仓库
git remote add origin https://github.com/your-username/updatebin.git

# 3. 推送代码
git push -u origin main
```

## 🌐 第二步：在Railway部署

### 方法1：Web界面部署（推荐）

1. **访问Railway**：
   - 打开 https://railway.app/
   - 点击 "Start a New Project"

2. **连接GitHub**：
   - 选择 "Deploy from GitHub repo"
   - 授权Railway访问你的GitHub
   - 选择 `updatebin` 仓库

3. **自动部署**：
   - Railway会自动检测Node.js项目
   - 使用我们的 `nixpacks.toml` 配置
   - 开始构建和部署

### 方法2：CLI部署

```bash
# 1. 安装Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 部署
railway up
```

## ⚙️ 第三步：配置环境变量

在Railway项目面板：

1. 点击你的服务
2. 进入 "Variables" 标签页
3. 添加以下环境变量：

```bash
NODE_ENV=production
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

## 🔗 第四步：获取服务URL

部署成功后：

1. 在Railway面板中找到你的服务
2. 点击 "Settings" → "Domains"
3. 复制生成的URL（类似：`https://your-app.railway.app`）

## 🧪 第五步：测试部署

使用以下命令测试API：

```bash
# 测试健康检查
curl https://your-app.railway.app/api/health

# 应该返回：
# {
#   "code": 200,
#   "message": "服务运行正常",
#   "data": { ... }
# }
```

## 🔄 第六步：更新前端配置

1. **更新API配置**：
   编辑 `vue-frontend/src/config/api.ts`：
   ```typescript
   production: {
     baseURL: 'https://your-railway-app.railway.app/api'
   }
   ```

2. **重新部署前端**：
   ```bash
   # 提交更改
   git add .
   git commit -m "更新API地址为Railway后端"
   git push origin main
   
   # Vercel会自动重新部署
   ```

## 📊 部署监控

### 查看日志
```bash
railway logs --tail
```

### 查看状态
```bash
railway status
```

### 查看域名
```bash
railway domain
```

## 🔧 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 检查构建日志
   railway logs --deployment
   ```

2. **环境变量问题**
   ```bash
   # 列出所有变量
   railway variables
   ```

3. **端口问题**
   - 确保代码使用 `process.env.PORT`
   - Railway会自动分配端口

4. **依赖问题**
   - 确保 `server/package.json` 中的依赖完整
   - 检查Node.js版本兼容性

### 重新部署

如果需要重新部署：

```bash
# 方法1：推送新代码
git push origin main

# 方法2：手动触发
railway redeploy
```

## 🎯 部署成功检查清单

- ✅ Railway显示服务状态为 "Active"
- ✅ 健康检查端点返回200状态
- ✅ 环境变量已正确配置
- ✅ 前端API地址已更新
- ✅ 所有API端点正常工作

## 💰 成本说明

Railway免费计划包括：
- 512MB RAM
- 1GB磁盘空间
- $5/月免费额度
- 自动休眠（无活动时）

对于你的项目来说，免费计划完全够用！

## 🔗 有用链接

- [Railway Dashboard](https://railway.app/dashboard)
- [Railway文档](https://docs.railway.app/)
- [Railway CLI文档](https://docs.railway.app/develop/cli)
- [Nixpacks文档](https://nixpacks.com/docs)
