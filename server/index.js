const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const compression = require('compression');
const morgan = require('morgan');
const crypto = require('crypto');
// 按环境加载 .env 文件（优先 .env.<NODE_ENV>，否则回退 .env）
(() => {
  try {
    const path = require('path');
    const fs = require('fs');
    const env = process.env.NODE_ENV || 'development';
    const envPath = path.resolve(__dirname, `.env.${env}`);
    const basePath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
    } else if (fs.existsSync(basePath)) {
      require('dotenv').config({ path: basePath });
    } else {
      require('dotenv').config();
    }
  } catch {
    require('dotenv').config();
  }
})();

// 日志工具函数
const logger = {
  info: (message, data = null) => {
    console.log(`ℹ️  [INFO] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  error: (message, error = null) => {
    console.error(`❌ [ERROR] ${message}`);
    if (error) console.error(error);
  },
  success: (message, data = null) => {
    console.log(`✅ [SUCCESS] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  debug: (message, data = null) => {
    if (process.env.DEBUG === 'true') {
      console.log(`🐛 [DEBUG] ${message}`);
      if (data) console.log(JSON.stringify(data, null, 2));
    }
  }
};

const EnvConfig = require('./env-config');
const envCfg = new EnvConfig();
const app = express();
const PORT = envCfg.port;
// 运行在代理之后（如 Railway/Heroku），需要信任代理头以正确识别客户端IP
(() => {
  const raw = envCfg.trustProxy;
  let trustValue;
  if (raw === undefined || raw === null || raw === '') {
    trustValue = 1; // 默认信任一层代理
  } else if (raw === 'true') {
    trustValue = true;
  } else if (raw === 'false') {
    trustValue = false;
  } else {
    const n = Number(raw);
    trustValue = Number.isNaN(n) ? 1 : n;
  }
  app.set('trust proxy', trustValue);
})();

// 解析允许的跨域源
function parseAllowedOrigins() {
  return envCfg.parseAllowedOrigins();
}

const allowedOrigins = parseAllowedOrigins();
logger.debug('CORS allowed origins parsed', { allowedOrigins });

// 通配支持：允许配置如 https://*.vercel.app
function isOriginAllowed(origin, whitelist) {
  if (!origin) return true;
  if (!Array.isArray(whitelist) || whitelist.length === 0) return true;
  if (whitelist.includes(origin)) return true;
  return whitelist.some((item) => {
    if (!item.includes('*')) return false;
    try {
      const escaped = item
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '[^.]+');
      const re = new RegExp(`^${escaped}$`);
      return re.test(origin);
    } catch {
      return false;
    }
  });
}

// 中间件配置
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
};
app.use(cors(corsOptions));
// 处理预检请求（OPTIONS）
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 简单健康检查（平台常用）
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// 异步路由包装器与错误构造器
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// 自定义请求/响应日志中间件（使用 finish 事件，避免再次写响应导致 ERR_HTTP_HEADERS_SENT）
app.use((req, res, next) => {
  const startTime = Date.now();

  console.log('\n' + '='.repeat(80));
  console.log(`📥 [${new Date().toISOString()}] 收到请求:`);
  console.log(`   方法: ${req.method}`);
  console.log(`   路径: ${req.originalUrl}`);
  console.log(`   来源: ${req.headers.origin || 'unknown'}`);
  console.log(`   IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`   User-Agent: ${req.headers['user-agent']}`);

  const filteredHeaders = { ...req.headers };
  delete filteredHeaders.authorization;
  delete filteredHeaders.cookie;
  console.log(`   请求头:`, JSON.stringify(filteredHeaders, null, 2));

  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`   查询参数:`, JSON.stringify(req.query, null, 2));
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   请求体:`, JSON.stringify(req.body, null, 2));
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`📤 [${new Date().toISOString()}] 响应完成:`);
    console.log(`   状态码: ${res.statusCode}`);
    console.log(`   耗时: ${duration}ms`);
    console.log(`   响应头:`, JSON.stringify(res.getHeaders(), null, 2));
    console.log('='.repeat(80) + '\n');
  });

  next();
});

// 限流配置（跳过健康检查）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
  skip: (req) => {
    const url = req.originalUrl || '';
    const path = req.path || '';
    return url.startsWith('/api/health') || path === '/health';
  }
});
app.use('/api/', limiter);

// 引入OSS配置模块
const { OSS_CONFIG, getStsToken, validateFileType, validateFileSize, buildFileUrl } = require('./oss-config');
const multer = require('multer');
const OSS = require('ali-oss');
const { Readable } = require('stream');
const HuaweiRemoteConfigAPI = require('./huawei-remote-config-api.js');
// 不在上传接口内直接更新华为云配置，前端单独调用 /api/huawei/update-config

// 内存存储接收浏览器上传的文件
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

function createOssClient() {
  const options = {
    region: OSS_CONFIG.region,
    accessKeyId: OSS_CONFIG.accessKeyId,
    accessKeySecret: OSS_CONFIG.accessKeySecret,
    bucket: OSS_CONFIG.bucket,
    authorizationV4: true,
    secure: true,
    endpoint: `https://${OSS_CONFIG.region}.aliyuncs.com`,
    timeout: OSS_CONFIG.timeout || 300000,
  };
  // if (OSS_CONFIG.endpoint) {
  //   options.endpoint = OSS_CONFIG.endpoint; // 例如 https://oss-cn-shenzhen.aliyuncs.com
  // }
  return new OSS(options);
}

// OSS配置已移至 oss-config.js 模块

// API路由

// 获取STS临时凭证
app.get('/api/oss/sts', async (req, res) => {
  logger.info('开始处理 STS 令牌请求', {
    查询参数: req.query,
    来源IP: req.ip,
    用户代理: req.headers['user-agent']
  });

  try {
    const { fileType = 'bin', fileName = 'firmware.bin' } = req.query;
    
    logger.debug('解析参数', { fileType, fileName });

    // 验证文件类型
    if (!validateFileType(fileName)) {
      logger.error('文件类型验证失败', { fileName, fileType });
      return res.status(400).json({
        success: false,
        message: '不支持的文件类型，只支持 .bin 和 .zip 文件'
      });
    }

    logger.info('文件类型验证通过，开始生成 STS 令牌');
    
    // 生成STS token
    const stsToken = await getStsToken(fileType, fileName);
    
    logger.success('STS 令牌生成成功', {
      accessKeyId: stsToken.accessKeyId,
      过期时间: stsToken.expiration,
      安全令牌长度: stsToken.securityToken?.length || 0
    });

    const responseData = {
      success: true,
      message: '获取STS凭证成功',
      data: stsToken
    };

    res.json(responseData);

  } catch (error) {
    logger.error('获取STS凭证失败', {
      错误消息: error.message,
      错误堆栈: error.stack,
      请求参数: req.query
    });
    
    const errorResponse = {
      success: false,
      message: error.message || '服务器内部错误'
    };
    
    res.status(500).json(errorResponse);
  }
});
// 自定义请求头
const headers = {
  // 指定Object的存储类型。
  'x-oss-storage-class': 'Standard',
};

// 批量中转上传到 OSS（files[]） - 方案B：去掉 asyncHandler，自行兜底，避免重复响应
function handleUploadArray(fieldName) {
  return (req, res, next) => {
    upload.array(fieldName)(req, res, (err) => {
      if (err) {
        if (res.headersSent) return;
        return res.status(400).json({ success: false, message: err.message || '上传失败' });
      }
      next();
    });
  };
}

app.post('/api/oss/upload-batch', handleUploadArray('files'), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ success: false, message: '缺少文件' });

    let keys;
    let md5s;
    try {
      keys = JSON.parse(req.body.keys || '[]');
    } catch {
      return res.status(400).json({ success: false, message: 'keys 解析失败，必须为 JSON 数组' });
    }
    try {
      md5s = JSON.parse(req.body.md5s || '[]');
    } catch {
      return res.status(400).json({ success: false, message: 'md5s 解析失败，必须为 JSON 数组' });
    }

    if (!Array.isArray(keys) || keys.length !== files.length) {
      return res.status(400).json({ success: false, message: 'keys 数量与文件数量不一致' });
    }
    if (!Array.isArray(md5s) || md5s.length !== files.length) {
      return res.status(400).json({ success: false, message: 'md5s 数量与文件数量不一致' });
    }

    const { version, updateLog } = req.body;

    const client = createOssClient();
    // 为大文件上传设置更长的 HTTP keep-alive/请求超时（仅对 Node 端上传有效）
    try {
      const http = require('http');
      const https = require('https');
      const keepAliveMs = Number(process.env.HTTP_KEEP_ALIVE_MS || 120000);
      const headersTimeoutMs = Number(process.env.HTTP_HEADERS_TIMEOUT_MS || 130000);
      const requestTimeoutMs = Number(process.env.HTTP_REQUEST_TIMEOUT_MS || 0);
      if (http.globalAgent) {
        http.globalAgent.keepAlive = false;
        http.globalAgent.maxSockets = 100;
        http.globalAgent.maxFreeSockets = 10;
      }
      if (https.globalAgent) {
        https.globalAgent.keepAlive = false;
        https.globalAgent.maxSockets = 100;
        https.globalAgent.maxFreeSockets = 10;
      }
      if (typeof server !== 'undefined' && server.setTimeout) {
        server.headersTimeout = headersTimeoutMs;
        server.requestTimeout = requestTimeoutMs;
      }
    } catch {}
    const toUpdateContent = { version, updateLog };
    const uploads = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const md5 = md5s[i] || '';
      const originalName = f.originalname || `file_${i}`;
      const keyBody = keys[i];
      const objectKeyFull = `${keyBody}/${originalName}`;

      const useMultipart = String(process.env.OSS_MULTIPART_ENABLED || '').toLowerCase() === 'true';
      let putName;
      if (useMultipart) {
        const partSize = Number(process.env.OSS_PART_SIZE_MB || 10) * 1024 * 1024;
        const parallel = Number(process.env.OSS_PARALLEL || 1);
        const baseOptions = { partSize, parallel, headers, timeout: OSS_CONFIG.timeout || 300000 };

        async function multipartWithRetry(maxRetry) {
          let lastErr;
          for (let attempt = 1; attempt <= maxRetry; attempt++) {
            try {
              const freshClient = attempt === 1 ? client : createOssClient();
              return await freshClient.multipartUpload(objectKeyFull, f.buffer, baseOptions);
            } catch (err) {
              lastErr = err;
              if (attempt === maxRetry) break;
              const jitter = Math.floor(Math.random() * 400);
              const backoffMs = Math.min(1000 * attempt + jitter, 8000);
              logger.error(`分片上传失败，第${attempt}次，将在${backoffMs}ms后重试`, { 错误: err && err.message });
              await new Promise(r => setTimeout(r, backoffMs));
            }
          }
          throw lastErr;
        }

        try {
          const mres = await multipartWithRetry(Number(process.env.OSS_RETRY || 5));
          putName = mres.name;
        } catch (err) {
          logger.error('分片上传失败，尝试回退为 putStream', { 错误: err && err.message, 文件: originalName });
          const stream = Readable.from(f.buffer);
          const pres = await client.putStream(objectKeyFull, stream, { headers });
          putName = pres.name;
        }
      } else {
        const stream = Readable.from(f.buffer);
        const pres = await client.putStream(objectKeyFull, stream, { headers });
        putName = pres.name;
      }

      const cdnBase = (process.env.CDN_BASE_URL || '');
      const url = `${cdnBase}/${putName}`;
      uploads.push({ originalName, md5, url });
    }

    uploads.forEach((u) => {
      if (u.originalName.toLowerCase().endsWith('.bin')) {
        toUpdateContent.espUrl = u.url;
        toUpdateContent.espMd5 = u.md5;
      } else {
        toUpdateContent.clipZipUrl = u.url;
        toUpdateContent.clipZipMd5 = u.md5;
      }
      
    });

    return res.json({ success: true, data: { toUpdateContent: JSON.stringify(toUpdateContent) } });
  } catch (error) {
    logger.error('批量中转上传失败', { 错误: error.message, 堆栈: error.stack });
    if (res.headersSent) return;
    return res.status(500).json({ success: false, message: error.message || '上传失败' });
  }
});

// 更新华为云远程配置
function loadHuaweiConfig() {
  return require('./config.js');
}

app.post('/api/huawei/update-config', async (req, res) => {
  try {
    const { key: keyFromBody, content } = req.body || {};
    const key = keyFromBody || process.env.HUAWEI_RC_KEY;
    if (!content) {
      return res.status(400).json({ success: false, message: 'content 不能为空' });
    }
    if (!key) {
      return res.status(400).json({ success: false, message: 'key 不能为空（可通过请求体或 HUAWEI_RC_KEY 提供）' });
    }
    const cfg = loadHuaweiConfig();
    const api = new HuaweiRemoteConfigAPI(cfg);
    await api.getAccessToken();
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    await api.updateParameterByKey(key, contentStr);
    // 获取最新值返回给前端
    const latestConfig = await api.queryConfiguration();
    const updatedParam = latestConfig?.configItems?.find((it) => it.name === key);
    const latestValue = updatedParam?.defaultValue?.value ?? updatedParam?.defaultValue ?? null;
    return res.json({ success: true, data: { latest: latestValue } });
  } catch (error) {
    logger.error('更新华为配置失败', { 错误: error.message, 堆栈: error.stack });
    return res.status(500).json({ success: false, message: error.message || '更新失败' });
  }
});

// 同时更新 iOS 与 Android 两套远程配置
app.post('/api/huawei/update-config-both', async (req, res) => {
  try {
    const { key: keyFromBody, content } = req.body || {};
    const key = keyFromBody || process.env.HUAWEI_RC_KEY;
    if (!content) {
      return res.status(400).json({ success: false, message: 'content 不能为空' });
    }
    if (!key) {
      return res.status(400).json({ success: false, message: 'key 不能为空（可通过请求体或 HUAWEI_RC_KEY 提供）' });
    }

    const cfgMod = require('./config.js');
    const pair = typeof cfgMod.getHuaweiConfigs === 'function'
      ? cfgMod.getHuaweiConfigs()
      : { ios: cfgMod, android: cfgMod };

    async function updateAndFetchLatest(cfg) {
      const api = new HuaweiRemoteConfigAPI(cfg);
      await api.getAccessToken();
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      await api.updateParameterByKey(key, contentStr);
      const latestConfig = await api.queryConfiguration();
      const updatedParam = latestConfig?.configItems?.find((it) => it.name === key);
      const latestValue = updatedParam?.defaultValue?.value ?? updatedParam?.defaultValue ?? null;
      return { latest: latestValue };
    }

    const [iosRes, androidRes] = await Promise.all([
      updateAndFetchLatest(pair.ios),
      updateAndFetchLatest(pair.android)
    ]);

    return res.json({ success: true, data: { ios: iosRes, android: androidRes } });
  } catch (error) {
    logger.error('更新双平台华为配置失败', { 错误: error.message, 堆栈: error.stack });
    return res.status(500).json({ success: false, message: error.message || '更新失败' });
  }
});

// 上传完成回调
app.post('/api/oss/upload-complete', (req, res) => {
  try {
    const { fileName, fileSize, md5, ossUrl, fileType } = req.body;

    // 验证参数
    if (!fileName || !fileSize || !md5 || !ossUrl || !fileType) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
    }

    // 转换为CDN地址
    const cdnUrl = ossUrl.replace(
      /https:\/\/[^\/]+\.oss[^\/]*\.aliyuncs\.com/,
      OSS_CONFIG.cdnDomain
    );

    // 生成文件ID
    const fileId = crypto.randomBytes(16).toString('hex');

    // 记录上传信息（实际生产环境应该保存到数据库）
    const uploadRecord = {
      fileId,
      fileName,
      fileSize,
      md5,
      ossUrl,
      cdnUrl,
      fileType,
      uploadTime: new Date().toISOString()
    };

    console.log('文件上传完成:', uploadRecord);

    res.json({
      code: 200,
      message: '上传完成回调成功',
      data: {
        cdnUrl,
        fileId
      }
    });

  } catch (error) {
    console.error('上传完成回调失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 配置管理接口

// 验证配置
app.post('/api/config/validate', (req, res) => {
  logger.info('开始配置验证', {
    请求体: req.body,
    来源IP: req.ip,
    内容类型: req.headers['content-type']
  });

  try {
    const { name, version, description, files } = req.body;
    
    logger.debug('解析配置参数', { name, version, description, files });

    // 基本验证
    const errors = [];
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('配置名称不能为空');
    }
    
    if (!version || typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
      errors.push('版本格式应为 x.y.z');
    }
    
    if (description && typeof description !== 'string') {
      errors.push('描述必须为字符串类型');
    }
    
    if (files && !Array.isArray(files)) {
      errors.push('文件列表必须为数组类型');
    }

    if (errors.length > 0) {
      logger.error('配置验证失败', {
        错误列表: errors,
        输入数据: { name, version, description, files }
      });

      const errorResponse = {
        code: 400,
        message: '配置验证失败',
        errors
      };

      return res.status(400).json(errorResponse);
    }

    logger.success('配置验证通过', {
      配置名称: name,
      配置版本: version,
      文件数量: files?.length || 0
    });

    const successResponse = {
      code: 200,
      message: '配置验证通过',
      data: {
        valid: true,
        config: { name, version, description, files }
      }
    };

    res.json(successResponse);

  } catch (error) {
    logger.error('配置验证异常', {
      错误消息: error.message,
      错误堆栈: error.stack,
      请求体: req.body
    });

    const errorResponse = {
      code: 500,
      message: '服务器内部错误'
    };

    res.status(500).json(errorResponse);
  }
});

// 保存配置
app.post('/api/config/save', (req, res) => {
  try {
    const { version, config, espFile, zipFile } = req.body;

    // 验证参数
    if (!version || !config || !espFile || !zipFile) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
    }

    // 生成配置ID
    const configId = crypto.randomBytes(16).toString('hex');

    const configRecord = {
      id: configId,
      version,
      config,
      espFile,
      zipFile,
      createTime: new Date().toISOString()
    };

    console.log('保存配置:', configRecord);

    res.json({
      code: 200,
      message: '配置保存成功',
      data: {
        configId
      }
    });

  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取配置历史
app.get('/api/config/history', (req, res) => {
  try {
    // 模拟配置历史数据
    const mockHistory = [
      {
        id: 'config1',
        version: 5,
        config: {
          clipZipMd5: "26D5504ACFC745D5829DCAF95C368A39",
          clipZipUrl: "https://res-cdn.api.singduck.cn/client-res/lottie/tp-dev/Upgrade3.zip?version=5",
          espMd5: "8280E448B7F2B263634EB2FDD9C470C4",
          espUrl: "https://res-cdn.api.singduck.cn/client-res/lottie/tp-dev/QIG1_ESP32_for_APP_250519A.bin?version=5",
          version: 5
        },
        createTime: new Date().toISOString()
      }
    ];

    res.json({
      code: 200,
      message: '获取配置历史成功',
      data: mockHistory
    });

  } catch (error) {
    console.error('获取配置历史失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 根路径处理
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '固件升级配置管理工具后端服务',
    data: {
      name: 'Firmware Upgrade Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        sts: '/api/oss/sts',
        upload: '/api/oss/upload-complete',
        config: {
          validate: '/api/config/validate',
          save: '/api/config/save',
          history: '/api/config/history'
        }
      }
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  logger.info('健康检查请求', {
    来源IP: req.ip,
    用户代理: req.headers['user-agent'],
    请求时间: new Date().toISOString()
  });

  const healthData = {
    code: 200,
    message: '服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    }
  };

  logger.success('健康检查完成', {
    服务状态: '正常',
    运行时间: `${Math.floor(process.uptime())}秒`,
    内存使用: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`
  });

  res.json(healthData);
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  res.status(status).json({
    code: status,
    message: error.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\n' + '🚀'.repeat(50));
  
  logger.success('固件升级配置管理工具后端服务启动成功', {
    服务器地址: `http://localhost:${PORT}`,
    运行环境: process.env.NODE_ENV || 'development',
    启动时间: new Date().toLocaleString(),
    进程ID: process.pid,
    Node版本: process.version,
    调试模式: process.env.DEBUG === 'true' ? '已启用' : '未启用'
  });
  
  logger.info('可用的API端点:', {
    健康检查: `GET /api/health`,
    STS令牌: `GET /api/oss/sts`,
    配置验证: `POST /api/config/validate`,
    配置保存: `/api/config/save`,
    配置历史: `GET /api/config/history`,
    上传完成: `POST /api/oss/upload-complete`
  });
  
  logger.info('OSS配置信息:', {
    Region: OSS_CONFIG.region,
    Bucket: OSS_CONFIG.bucket,
    UploadPath: OSS_CONFIG.uploadPath,
    CDNDomain: OSS_CONFIG.cdnDomain
  });
  
  console.log('\n💡 提示:');
  console.log('   📝 设置 DEBUG=true 启用详细调试日志');
  console.log('   🔧 按 Ctrl+C 停止服务器');
  console.log('   🌐 访问 http://localhost:3000 测试前端');
  console.log('🚀'.repeat(50) + '\n');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在优雅关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在优雅关闭服务器...');
  process.exit(0);
});