# Vercel 部署指南

本项目已配置为可在 Vercel 平台上自动部署的全栈应用。

## 🚀 快速部署

### 1. 前置条件
- GitHub 账号
- Vercel 账号（可用 GitHub 登录）
- 阿里云 OSS 配置
- 华为云配置（可选）

### 2. 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/updatebin)

### 3. 手动部署步骤

#### 步骤 1: 推送代码到 GitHub
```bash
git add .
git commit -m "配置 Vercel 部署"
git remote add origin https://github.com/your-username/updatebin.git
git push -u origin main
```

#### 步骤 2: 连接 Vercel
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测配置并开始部署

#### 步骤 3: 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

```bash
# OSS 配置
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_UPLOAD_PATH=firmware/
OSS_CDN_DOMAIN=https://your-cdn-domain.com

# STS 配置
STS_ROLE_ARN=acs:ram::your_account_id:role/your_role_name
STS_ROLE_SESSION_NAME=firmware-upload-session

# 华为云配置
HUAWEI_APP_ID=your_huawei_app_id
HUAWEI_CLIENT_ID=your_huawei_client_id
HUAWEI_CLIENT_SECRET=your_huawei_client_secret
HUAWEI_PROJECT_ID=your_huawei_project_id

# 前端 URL（部署后更新）
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## 📁 项目结构

```
updatebin/
├── api/                    # Vercel Serverless Functions
│   ├── health.js          # 健康检查
│   ├── config/            # 配置相关 API
│   ├── huawei/            # 华为云 API
│   └── oss/               # OSS 相关 API
├── vue-frontend/          # Vue.js 前端
├── server/                # 原始 Express 服务器（本地开发用）
├── vercel.json           # Vercel 配置
└── package.json          # 项目依赖
```

## 🔧 本地开发

### 安装 Vercel CLI
```bash
npm i -g vercel
```

### 本地开发环境
```bash
# 安装依赖
npm install
cd vue-frontend && npm install

# 启动本地开发服务器
vercel dev
```

### 传统开发模式
```bash
# 启动后端
cd server && npm start

# 启动前端（新终端）
cd vue-frontend && npm run dev
```

## 🌐 API 端点

部署后，你的 API 端点将是：

- 健康检查: `GET /api/health`
- STS 令牌: `GET /api/oss/sts`
- 批量上传: `POST /api/oss/upload-batch`
- 华为云配置: `POST /api/huawei/update-config`
- 配置验证: `POST /api/config/validate`

## 🔒 安全配置

### CORS 设置
API 已配置为接受来自任何域的请求。在生产环境中，建议限制为特定域名：

```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
```

### 环境变量
确保所有敏感信息都通过 Vercel 环境变量配置，不要在代码中硬编码。

## 📊 监控和日志

- Vercel 提供内置的函数日志
- 可在 Vercel Dashboard 查看部署状态和错误日志
- 建议集成第三方监控服务（如 Sentry）

## 🚨 故障排除

### 常见问题

1. **构建失败**
   - 检查 `vue-frontend/package.json` 中的依赖
   - 确保 TypeScript 编译无错误

2. **API 函数超时**
   - Vercel 免费版函数执行时间限制为 10 秒
   - 付费版可延长至 60 秒

3. **文件上传失败**
   - 检查 OSS 配置是否正确
   - 验证 STS 角色权限

4. **环境变量问题**
   - 确保在 Vercel 项目设置中正确配置
   - 重新部署以应用新的环境变量

### 调试技巧

```bash
# 查看函数日志
vercel logs

# 本地调试
vercel dev --debug
```

## 🔄 持续部署

每次推送到 `main` 分支都会自动触发部署。你也可以：

1. 设置预览部署（Pull Request）
2. 配置自定义域名
3. 设置部署钩子

## 📈 性能优化

1. **前端优化**
   - 启用 Gzip 压缩
   - 代码分割已配置
   - 静态资源 CDN 加速

2. **API 优化**
   - 函数冷启动优化
   - 适当的缓存策略
   - 数据库连接池（如需要）

## 💰 成本考虑

Vercel 免费版限制：
- 100GB 带宽/月
- 100 次函数调用/天
- 10 秒函数执行时间

根据使用量考虑升级到 Pro 版本。
