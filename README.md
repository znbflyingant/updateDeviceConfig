### 在 Ubuntu 上安装本项目所需的开发/运行环境（简明版）

适用于 Ubuntu 20.04/22.04。包含：系统依赖、Nginx、nvm+Node(LTS)、npm 国内镜像、PM2（生产可选）、目录与环境变量准备、快速验证与简版部署要点。

#### 架构一图
```mermaid
graph LR
  A[浏览器/前端] -- HTTPS/HTTP --> B[Nginx]
  B -- 静态资源 --> C[/var/www/updatebin (前端 dist)]
  B -- /api 反代 --> D[Node.js 后端 server/index.js :3001]
  D -- 访问 --> E[阿里云 OSS]
  D -- 访问 --> F[华为云 Remote Config]
```

---

### 1) 必备软件清单
- 系统工具：git、curl、ca-certificates、build-essential、jq、rsync
- Web 服务器：Nginx
- Node 版本管理：nvm（推荐安装 Node LTS v18/20）
- Node 包管理：npm（配置国内镜像可选）
- 进程守护（生产可选）：PM2

一键安装（以 Ubuntu 为例）：
```bash
sudo apt update && sudo apt install -y git curl ca-certificates build-essential nginx jq rsync

# 安装 nvm + Node LTS（国内镜像）
export NVM_DIR="$HOME/.nvm"
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source "$NVM_DIR/nvm.sh"
nvm install --lts
node -v && npm -v

# 可选：设置 npm 国内镜像
npm config set registry https://registry.npmmirror.com

# 生产可选：安装 PM2
npm i -g pm2
```

---

### 2) 目录与代码准备
```bash
sudo mkdir -p /opt && sudo chown -R $USER:$USER /opt
cd /opt
git clone <你的仓库地址> updatebin
cd updatebin
```

---

### 3) 后端环境变量（server/.env）
在 `server/` 下创建 `.env`，示例：
```ini
NODE_ENV=production
PORT=3001
TRUST_PROXY=1
ALLOWED_ORIGINS=https://yourdomain.com

# OSS（如需真实上传，需填写真实值；仅开发可先放占位）
OSS_REGION=oss-cn-shenzhen
OSS_BUCKET=your-bucket
OSS_ACCESS_KEY_ID=your-ak
OSS_ACCESS_KEY_SECRET=your-sk
OSS_UPLOAD_PATH=firmware/
OSS_CDN_DOMAIN=https://your-cdn.com

# 可选 STS（若要下发临时凭证）
# STS_ROLE_ARN=acs:ram::<account-id>:role/<role>
# STS_ROLE_SESSION_NAME=firmware-upload-session

# 超时与分片（可选）
OSS_TIMEOUT_MS=300000
OSS_PART_SIZE_MB=8
OSS_PARALLEL=4

# 华为云（仅在使用 /api/huawei/update-config 时需要）
# HUAWEI_CLIENT_ID=...
# HUAWEI_CLIENT_SECRET=...
# HUAWEI_PRODUCT_ID=...
# HUAWEI_APP_ID=...
```

安装依赖并启动（开发/生产）：
```bash
cd /opt/updatebin/server
npm ci || npm i
npm run validate-env   # 可选：检查变量

# 开发
npm run dev            # 本地 3001

# 生产（建议用 PM2）
pm2 start npm --name updatebin-server -- start
pm2 save && pm2 startup   # 开机自启（按提示执行）
```

健康检查：
```bash
curl -s http://127.0.0.1:3001/api/health | jq .
```

---

### 4) 前端（vue-frontend）准备
- 本地开发：Vite 默认端口 3000，`vite.config.ts` 已将 `/api` 代理到 `http://localhost:3001`。
- 生产构建需指定后端 API 根（会自动在其后拼接 `/api`）：
```bash
cd /opt/updatebin/vue-frontend
echo "VITE_API_BASE_URL=https://yourdomain.com" > .env.production
npm ci || npm i
npm run build
```

将 `dist` 同步到 Nginx 根：
```bash
sudo mkdir -p /var/www/updatebin
sudo rsync -a --delete dist/ /var/www/updatebin/
```

---

### 5) Nginx 最小站点示例（Ubuntu）
```nginx
server {
  listen 80;
  server_name yourdomain.com;
  client_max_body_size 200m;

  root /var/www/updatebin;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3001/;
    proxy_read_timeout 300s;
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
  }
}
```

启用并重载：
```bash
echo "将上述 server 块保存为 /etc/nginx/sites-available/updatebin"
sudo ln -sf /etc/nginx/sites-available/updatebin /etc/nginx/sites-enabled/updatebin
sudo nginx -t && sudo systemctl reload nginx
```

（HTTPS：使用 `certbot` 或 `acme.sh` 申请证书后切换到 443）

---

### 6) 快速验证清单（部署后）
- 后端健康：`curl -s http://127.0.0.1:3001/api/health`
- 前端首页：浏览器访问 `http://yourdomain.com`
- 前端 → 后端：在页面执行一次调用，确认 `/api/*` 通畅
- 上传大文件不报 413：如报错提升 Nginx `client_max_body_size`
- 日志排查：`pm2 logs updatebin-server --lines 100`

---

### 7) 常见问题
- 依赖安装慢：已将 npm 源设置为 `https://registry.npmmirror.com`
- CORS：生产推荐同域；如跨域，在 `server/.env` 配置 `ALLOWED_ORIGINS`
- STS 报错：未配置 `STS_ROLE_ARN` 时请改用后端中转上传 `/api/oss/upload-batch`


