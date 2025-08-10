# 固件升级配置管理工具

基于React + Node.js的固件升级配置管理工具，用于简化ESP32设备固件升级配置流程。

## 功能特性

### 🚀 核心功能
- **文件上传**: 支持ESP32升级文件(.bin)和芯片主板升级文件(.zip)上传
- **OSS集成**: 集成阿里云OSS，支持前端直传，提升上传效率
- **MD5计算**: 客户端自动计算文件MD5哈希值，确保文件完整性
- **配置生成**: 自动生成华为云`device_upgrade_info`配置JSON
- **版本管理**: 支持配置版本控制和历史记录管理
- **CDN支持**: 自动转换OSS地址为CDN地址，提升下载速度

### 🎨 界面特性
- **现代化UI**: 基于Ant Design的响应式设计
- **拖拽上传**: 支持文件拖拽上传，操作便捷
- **实时反馈**: 上传进度显示、即时错误提示
- **深色模式**: 支持明暗主题切换
- **移动端适配**: 完美适配移动设备

### 🔒 安全特性
- **STS认证**: 使用STS临时凭证，避免密钥泄露
- **文件验证**: 文件类型和大小验证
- **请求限流**: API请求频率限制
- **数据加密**: 支持传输数据加密

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design 5.x
- Ali-OSS SDK
- Crypto-JS (MD5计算)
- Axios (HTTP客户端)

### 后端
- Node.js + Express
- CORS、Helmet (安全中间件)
- Express-rate-limit (限流)
- Morgan (日志)

## 项目结构

```
firmware-upgrade-tool/
├── public/                    # 静态资源
├── src/                      # 前端源码
│   ├── components/           # React组件
│   │   ├── FileUpload.tsx   # 文件上传组件
│   │   ├── ConfigGeneration.tsx # 配置生成组件
│   │   └── VersionHistory.tsx   # 版本历史组件
│   ├── services/            # 业务服务
│   │   └── OSSUploader.ts   # OSS上传服务
│   ├── App.tsx              # 主应用组件
│   ├── App.css              # 样式文件
│   └── index.tsx            # 应用入口
├── server/                   # 后端服务
│   ├── index.js             # 服务器主文件
│   └── package.json         # 后端依赖
├── package.json             # 前端依赖
├── tsconfig.json            # TypeScript配置
└── README.md                # 项目文档
```

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 2. 环境配置

在`server`目录下创建`.env`文件：

```bash
# 服务器配置
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# 阿里云OSS配置
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=singduck-oss
OSS_UPLOAD_PATH=client-res/lottie/tp-dev/
CDN_DOMAIN=https://res-cdn.api.singduck.cn

# OSS访问密钥
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
```

### 3. 启动应用

```bash
# 启动后端服务
cd server
npm run dev

# 新开终端，启动前端
npm start
```

访问 http://localhost:3000 即可使用应用。

## 使用说明

### 📤 文件上传
1. 在"文件上传"页面，分别上传ESP32文件(.bin)和芯片主板文件(.zip)
2. 支持点击选择或拖拽上传
3. 上传过程中显示实时进度
4. 上传完成后显示文件信息和MD5值

### ⚙️ 配置生成
1. 在"配置生成"页面设置固件版本号
2. 查看文件信息汇总
3. 自动生成华为云配置JSON
4. 支持复制配置、下载配置文件、保存到历史

### 📋 历史记录
1. 在"历史记录"页面查看所有保存的配置
2. 支持搜索和筛选功能
3. 可查看配置详情、下载配置、删除记录

### 🔧 配置使用
生成的配置用于华为云：
1. 复制生成的JSON配置
2. 在华为云管理控制台中设置`device_upgrade_info`
3. 将复制的JSON作为配置值

## API接口

### OSS相关
- `POST /api/oss/get-sts-token` - 获取STS临时凭证
- `POST /api/oss/upload-complete` - 上传完成回调

### 配置管理
- `POST /api/config/save` - 保存配置
- `GET /api/config/history` - 获取配置历史

### 系统
- `GET /api/health` - 健康检查

## 部署指南

### 前端部署
```bash
# 构建生产版本
npm run build

# 部署到静态服务器（如Nginx）
cp -r build/* /var/www/html/
```

### 后端部署
```bash
# 进入服务器目录
cd server

# 使用PM2部署
npm install -g pm2
pm2 start index.js --name firmware-server

# 或使用Docker部署
docker build -t firmware-server .
docker run -d -p 3001:3001 firmware-server
```

## 注意事项

### 安全配置
1. **生产环境**必须配置真实的OSS密钥
2. 建议使用STS临时凭证，避免长期密钥泄露
3. 配置适当的CORS策略
4. 启用HTTPS加密传输

### 性能优化
1. 启用CDN加速文件下载
2. 配置合适的文件缓存策略
3. 监控上传成功率和性能指标

### 故障处理
1. 检查OSS配置是否正确
2. 确认网络连接和防火墙设置
3. 查看服务器日志定位问题

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进项目。

## 联系方式

如有问题或建议，请通过Issue联系。 