# 🔧 环境配置指南

本项目已完全迁移到环境变量配置，确保安全性和部署灵活性。

## 📋 环境变量清单

### 🖥️ 服务器配置
```bash
NODE_ENV=production          # 运行环境 (development/production)
PORT=3001                   # 服务器端口 (Railway会自动设置)
DEBUG=false                 # 调试模式
FRONTEND_URL=https://your-vercel-app.vercel.app  # 前端URL
```

### ☁️ 阿里云OSS配置
```bash
OSS_REGION=oss-cn-shenzhen                    # OSS区域
OSS_ACCESS_KEY_ID=your_access_key_id          # Access Key ID
OSS_ACCESS_KEY_SECRET=your_access_key_secret  # Access Key Secret
OSS_BUCKET=your_bucket_name                   # 存储桶名称
OSS_UPLOAD_PATH=firmware/                     # 上传路径
OSS_CDN_DOMAIN=https://your-cdn-domain.com    # CDN域名(可选)
```

### 🔑 阿里云STS配置
```bash
STS_ROLE_ARN=acs:ram::your_account_id:role/your_role_name  # STS角色ARN
STS_ROLE_SESSION_NAME=firmware-upload-session             # STS会话名称
```

### 📱 华为云配置
```bash
HUAWEI_CLIENT_ID=1747018385402680448                                          # 客户端ID
HUAWEI_CLIENT_SECRET=8F6CC3726CBF4B57CAF36AF74986077141A268F227B50A155EE6AF9C0E96C556  # 客户端密钥
HUAWEI_PRODUCT_ID=461323198429896966                                         # 产品ID
HUAWEI_APP_ID=114137851                                                      # 应用ID
HUAWEI_BASE_URL=https://connect-api.cloud.huawei.com                        # API基础URL
```

## 🛠️ 配置方法

### 本地开发

1. **复制环境变量示例**：
   ```bash
   cp server/env.example server/.env
   ```

2. **编辑配置文件**：
   ```bash
   nano server/.env
   # 或使用你喜欢的编辑器
   ```

3. **验证配置**：
   ```bash
   cd server
   npm run validate-env
   ```

### Railway部署

1. **在Railway Dashboard中配置**：
   - 进入项目 → Variables 标签页
   - 逐个添加环境变量

2. **使用配置文件**：
   - 参考 `railway-env-vars.txt`
   - 复制变量名和值到Railway

3. **一键设置脚本**（如果有Railway CLI）：
   ```bash
   # 从文件批量设置（需要Railway CLI）
   railway variables set --from-file railway-env-vars.txt
   ```

### Vercel API Routes

如果使用Vercel Serverless Functions，在Vercel Dashboard中：
- 项目设置 → Environment Variables
- 添加相同的环境变量

## 🔍 验证工具

### 环境变量验证脚本
```bash
# 验证所有环境变量
npm run validate-env

# 或直接运行
node server/validate-env.js
```

### 部署前检查
```bash
# 运行部署前检查清单
./pre-deploy-check.sh
```

## 🚨 安全注意事项

### ✅ 已保护的配置
- ✅ 华为云客户端密钥已迁移到环境变量
- ✅ OSS访问密钥使用环境变量
- ✅ 所有敏感配置已从代码中移除
- ✅ .gitignore已更新，防止敏感文件提交

### 🔒 安全最佳实践
1. **永远不要**在代码中硬编码密钥
2. **定期轮换**访问密钥和令牌
3. **使用最小权限**原则配置IAM角色
4. **监控**异常访问和使用情况

## 🔧 故障排除

### 常见问题

1. **环境变量未生效**
   ```bash
   # 检查 .env 文件位置
   ls -la server/.env
   
   # 验证变量加载
   node -e "require('dotenv').config({path: 'server/.env'}); console.log(process.env.HUAWEI_CLIENT_ID)"
   ```

2. **Railway部署失败**
   ```bash
   # 检查Railway日志
   railway logs
   
   # 验证环境变量
   railway variables
   ```

3. **华为云API调用失败**
   - 检查客户端ID和密钥是否正确
   - 确认产品ID和应用ID匹配
   - 验证网络连接和防火墙设置

### 调试模式

启用详细日志：
```bash
DEBUG=true
NODE_ENV=development
```

## 📊 配置验证状态

运行验证脚本后，你会看到：

```
🔍 环境变量验证开始...

📋 SERVER 配置:
  ✅ PORT: 3001 - 服务器端口
  ✅ NODE_ENV: production - 运行环境
  ✅ FRONTEND_URL: https://... - 前端URL

📋 OSS 配置:
  ✅ OSS_REGION: oss-cn-shenzhen - 阿里云OSS区域
  ✅ OSS_ACCESS_KEY_ID: LTAI5... - 阿里云Access Key ID
  ✅ OSS_ACCESS_KEY_SECRET: ******** - 阿里云Access Key Secret
  ✅ OSS_BUCKET: my-bucket - OSS存储桶名称

📋 HUAWEI 配置:
  ✅ HUAWEI_CLIENT_ID: 174701... - 华为云客户端ID
  ✅ HUAWEI_CLIENT_SECRET: ******** - 华为云客户端密钥
  ✅ HUAWEI_PRODUCT_ID: 461323... - 华为云产品ID
  ✅ HUAWEI_APP_ID: 114137851 - 华为云应用ID

✅ 环境变量验证通过！
```

## 🎯 部署清单

- [ ] 所有环境变量已配置
- [ ] 验证脚本通过
- [ ] .env 文件未提交到Git
- [ ] Railway/Vercel环境变量已设置
- [ ] API端点测试通过
- [ ] 华为云API连接正常
- [ ] OSS文件上传功能正常

现在你的项目已经完全使用环境变量配置，既安全又便于部署！🚀
