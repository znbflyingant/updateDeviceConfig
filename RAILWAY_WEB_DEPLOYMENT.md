# 🌐 Railway Web界面部署指南

由于CLI安装可能遇到网络问题，推荐使用Web界面部署，同样简单高效！

## 🚀 步骤1：推送代码到GitHub

```bash
# 确保代码已提交
git add .
git commit -m "准备Railway部署"

# 推送到GitHub（如果还没有远程仓库）
git remote add origin https://github.com/your-username/updatebin.git
git push -u origin main

# 如果已有远程仓库，直接推送
git push origin main
```

## 🌐 步骤2：Web界面部署

### 2.1 访问Railway
- 打开浏览器访问：https://railway.app/
- 点击右上角 "Login"
- 选择 "Login with GitHub"

### 2.2 创建新项目
1. 登录后点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 如果是第一次，需要授权Railway访问GitHub
4. 在仓库列表中找到并选择 `updatebin`

### 2.3 配置部署
Railway会自动：
- ✅ 检测到Node.js项目
- ✅ 读取我们的 `nixpacks.toml` 配置
- ✅ 自动开始构建

## ⚙️ 步骤3：配置环境变量

### 3.1 进入项目设置
1. 部署开始后，点击你的项目
2. 在项目面板中，点击你的服务（通常显示为 "updatebin"）
3. 点击 "Variables" 标签页

### 3.2 添加环境变量
点击 "New Variable" 并逐个添加：

```bash
NODE_ENV=production
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=你的阿里云AccessKey
OSS_ACCESS_KEY_SECRET=你的阿里云Secret
OSS_BUCKET=你的OSS存储桶名称
OSS_UPLOAD_PATH=firmware/
OSS_CDN_DOMAIN=https://你的CDN域名
STS_ROLE_ARN=acs:ram::你的账号ID:role/你的角色名
STS_ROLE_SESSION_NAME=firmware-upload-session
HUAWEI_APP_ID=你的华为应用ID
HUAWEI_CLIENT_ID=你的华为客户端ID
HUAWEI_CLIENT_SECRET=你的华为客户端密钥
HUAWEI_PROJECT_ID=你的华为项目ID
FRONTEND_URL=https://updatebin-mh8g3yuqu-znbflyingants-projects.vercel.app
```

## 🔗 步骤4：获取部署URL

### 4.1 查看部署状态
- 在项目面板查看构建日志
- 等待状态变为 "Active" 或 "Deployed"

### 4.2 获取服务URL
1. 点击 "Settings" 标签页
2. 找到 "Domains" 部分
3. 复制生成的URL（类似：`https://updatebin-production.railway.app`）

## 🧪 步骤5：测试部署

使用浏览器或curl测试：

```bash
# 测试健康检查（替换为你的实际URL）
curl https://your-app.railway.app/api/health
```

预期返回：
```json
{
  "code": 200,
  "message": "服务运行正常",
  "data": {
    "timestamp": "2025-01-10T...",
    "version": "1.0.0",
    "platform": "vercel",
    "environment": "serverless"
  }
}
```

## 🔄 步骤6：更新前端API配置

### 6.1 修改API配置
编辑文件：`vue-frontend/src/config/api.ts`

```typescript
// 将你的Railway URL替换到这里
production: {
  baseURL: 'https://your-railway-app.railway.app/api'
}
```

### 6.2 重新部署前端
```bash
git add .
git commit -m "更新API地址为Railway后端"
git push origin main
```

Vercel会自动检测到更改并重新部署前端。

## 📊 监控和管理

### 查看日志
1. 在Railway项目面板
2. 点击你的服务
3. 查看 "Deployments" 标签页的日志

### 重新部署
1. 在 "Deployments" 标签页
2. 点击最新部署旁的 "..." 按钮
3. 选择 "Redeploy"

### 管理环境变量
1. 在 "Variables" 标签页
2. 可以随时添加、修改或删除变量
3. 修改后会自动重新部署

## ✅ 部署成功检查清单

- [ ] GitHub代码已推送
- [ ] Railway项目创建成功
- [ ] 构建状态显示 "Active"
- [ ] 所有环境变量已配置
- [ ] 健康检查API返回200
- [ ] 前端API地址已更新
- [ ] 前端重新部署完成

## 🎯 最终架构

```
┌─────────────────────┐     ┌──────────────────────┐
│     前端 (Vercel)    │────▶│    后端 (Railway)     │
│                     │     │                      │
│ updatebin-xxx.      │     │ your-app.railway.    │
│ vercel.app          │     │ app                  │
│                     │     │                      │
│ • Vue.js前端        │     │ • Express服务器      │
│ • 静态文件          │     │ • 完整API功能        │
│ • 全球CDN           │     │ • 文件上传处理       │
└─────────────────────┘     └──────────────────────┘
```

## 💡 小贴士

1. **免费额度**：Railway每月提供$5免费额度，对你的项目足够使用
2. **自动休眠**：无流量时服务会自动休眠，有请求时自动唤醒
3. **域名绑定**：可以在Settings中绑定自定义域名
4. **数据库**：如需要，Railway还可以一键添加PostgreSQL、MySQL等数据库

这种方式避免了CLI安装问题，而且界面操作更直观！
