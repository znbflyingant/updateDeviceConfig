### 环境变量示例（复制到部署平台环境变量或本地 .env）

```
# Server runtime
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.example.com

# OSS
OSS_REGION=oss-cn-shenzhen
OSS_BUCKET=your-bucket-name
OSS_ACCESS_KEY_ID=your-ak
OSS_ACCESS_KEY_SECRET=your-sk
OSS_UPLOAD_PATH=firmware/
OSS_CDN_DOMAIN=https://app.example.com

# STS (optional, needed if you truly issue temporary credentials)
STS_ROLE_ARN=acs:ram::<account-id>:role/<role-name>
STS_ROLE_SESSION_NAME=firmware-upload-session

# Timeouts (optional)
OSS_TIMEOUT_MS=300000
OSS_PART_SIZE_MB=8
OSS_PARALLEL=4
HTTP_KEEP_ALIVE_MS=120000
HTTP_HEADERS_TIMEOUT_MS=130000
HTTP_REQUEST_TIMEOUT_MS=0
```


