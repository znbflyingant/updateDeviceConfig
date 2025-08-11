## 在阿里云 SAE 部署本项目后端（推荐配合 OSS+CDN 托管前端，同域按路径路由 /api）

本指南帮助你将 `server/` 目录里的 Node.js 后端部署到阿里云 SAE，并与前端（OSS+CDN）通过同一域名实现前后端一体化（`/` → 前端，`/api/*` → 后端）。

### 前置条件
- 已有阿里云账号与基础资源权限（OSS、CDN、SAE）。
- 已准备好前端构建产物（可选）：`vue-frontend/dist/`。
- 本项目后端已满足：监听 `process.env.PORT`（代码已支持），健康检查接口 `/api/health`（已提供）。

### 1. 前端发布到 OSS，并接入 CDN（同域部署建议）
1) 构建前端

```bash
cd vue-frontend
npm ci
npm run build
```

2) 使用 `ossutil` 上传构建产物到你的 Bucket 根目录或某个前缀

```bash
ossutil64 cp -r -f ./dist oss://<your-bucket>/ \
  --meta Cache-Control:no-cache
```

3) 开启 OSS 静态网站托管（建议 Index: `index.html`，Error: `index.html` 以适配 SPA）

4) 在 CDN 添加你的域名（例如 `app.example.com`），源站选择该 OSS Bucket；开启 HTTPS。

参考：阿里云文档“在 OSS 上托管静态网站”“CDN 添加回源/高级回源设置/HTTPS”。

### 2. 打包后端代码供 SAE 部署
SAE（代码包部署方式）要求上传的 ZIP 根目录包含 `package.json`。建议只打包 `server/` 目录的内容。

```bash
cd server
zip -r ../server-artifact.zip . \
  -x "node_modules/*" "*.log" \
  -x ".git/*" ".DS_Store" "dist/*"
```

注意：`server/package.json` 已包含启动脚本：
```json
{
  "scripts": { "start": "node index.js" }
}
```

### 3. 在 SAE 控制台创建应用并部署
1) 新建应用：
- 计算模式：Web 应用（无状态）
- 运行时：Node.js（选择与你本地接近的版本）
- 规格：按需选择（可以从最小规格开始）

2) 部署方式：选择“代码包”，上传 `server-artifact.zip`。

3) 启动与端口：
- 启动命令：`npm ci && npm start`（或在“安装依赖”开启情况下仅 `npm start`）
- 容器端口：使用环境变量 `PORT`，本服务已支持 `process.env.PORT || 3001`

4) 健康检查：
- 类型：HTTP
- 路径：`/api/health`
- 期望：HTTP 200

5) 环境变量（根据 `server/.env.example` 配置）
- `FRONTEND_URL=https://app.example.com`（与你的 CDN 域一致）
- `OSS_REGION=oss-cn-<region>`
- `OSS_BUCKET=<your-bucket>`
- `OSS_ACCESS_KEY_ID=<ak>`
- `OSS_ACCESS_KEY_SECRET=<sk>`
- `OSS_UPLOAD_PATH=firmware/`（可自定义）
- `OSS_CDN_DOMAIN=https://app.example.com`（用于拼接文件外链）
- `STS_ROLE_ARN=acs:ram::<account-id>:role/<role-name>`（用于生成 STS，按需）
- `STS_ROLE_SESSION_NAME=firmware-upload-session`（可选）
- `OSS_TIMEOUT_MS=300000`（可选）

6) 访问方式：
- 打开“互联网访问”，自动为应用分配公网地址（或绑定自有域名）。

7) 发布：执行部署，待实例健康后即可访问 `http(s)://<sae-domain>/api/health`。

### 4. 在 CDN 配置“按路径回源”实现同域 `/api` 反向代理到 SAE
在 CDN 域名（例 `app.example.com`）的“高级回源设置”中：
1) 添加第二个源站：类型选“IP/域名”，填 SAE 公网域名或自有绑定域名。
2) 添加路径回源规则：`/api/*` → 后端源站（上一步添加的 SAE）。
3) 回源 Host：建议设为后端期望的 Host（通常是 SAE 的域名）。
4) 其他：设置回源协议（HTTPS 推荐）、超时、重试等参数。

完成后，访问：
- `https://app.example.com/` → 前端（来自 OSS+CDN）
- `https://app.example.com/api/health` → 后端（来自 SAE）

### 5. 服务器端配置要点回顾
- CORS：`server/index.js` 中已按 `FRONTEND_URL` 白名单开放。若前后端同域，CORS 可保持最小化配置。
- 端口：使用 `process.env.PORT`，勿硬编码。
- 健康检查：`/api/health` 已提供。
- 错误处理：确保统一错误处理中间件位于所有路由之后。

### 6. 常见问题
- 访问 404：检查 CDN“路径回源”与 OSS 静态网站托管的 SPA 回退（`index.html`）。
- CORS 报错：确保同域或 `FRONTEND_URL` 正确，且 CDN 缓存未命中旧响应头。
- OSS 外链域名：后端用 `OSS_CDN_DOMAIN` 组装文件 URL，确保与 CDN 域一致。
- STS 报错：需要配置 `STS_ROLE_ARN`，或在未接入真正 STS 前暂时关闭依赖（根据你的业务改造）。

### 7. 可选：自动化部署建议
- 使用 GitHub Actions 构建前端并上传到 OSS（可用 `ossutil` 或阿里云相关 Action）。
- 服务端使用 SAE 控制台“一键部署”或结合 OpenAPI/CLI 实现流水线（需配置 AK/SK 与 RAM 权限）。


