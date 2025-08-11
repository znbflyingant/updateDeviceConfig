const crypto = require('crypto');
require('dotenv').config();

// OSS配置（提供合理的默认值，便于本地快速联调）
const OSS_CONFIG = {
  region: process.env.OSS_REGION || 'oss-cn-shenzhen',
  bucket: process.env.OSS_BUCKET,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  uploadPath: process.env.OSS_UPLOAD_PATH || 'firmware/',
  cdnDomain: process.env.OSS_CDN_DOMAIN,
  // STS相关配置
  stsRoleArn: process.env.STS_ROLE_ARN,
  stsRoleSessionName: process.env.STS_ROLE_SESSION_NAME || 'firmware-upload-session',
  // 客户端超时（毫秒），默认5分钟
  timeout: Number(process.env.OSS_TIMEOUT_MS || 300000),
};

// 验证必要的OSS环境变量
const requiredOssVars = ['OSS_BUCKET', 'OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET'];
const missingOssVars = requiredOssVars.filter(varName => !process.env[varName]);

if (missingOssVars.length > 0) {
    console.error('❌ 缺少必要的OSS环境变量:', missingOssVars.join(', '));
    console.error('请在 .env 文件或部署平台中配置这些变量');
    if (process.env.NODE_ENV !== 'production') {
        throw new Error(`Missing required OSS environment variables: ${missingOssVars.join(', ')}`);
    }
}

// 生成安全的文件名
function generateSafeFileName(originalName, fileType) {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString('hex');
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const nameWithoutExt = safeName.replace(/\.[^/.]+$/, '');
  const extension = fileType || originalName.split('.').pop();
  return `${nameWithoutExt}_${timestamp}_${randomStr}.${extension}`;
}



// 构建文件URL
function buildFileUrl(fileName, useCdn = true) {
  const baseUrl = useCdn ? OSS_CONFIG.cdnDomain : `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.region}.aliyuncs.com`;
  return `${baseUrl}/${OSS_CONFIG.uploadPath}${fileName}`;
}

// 验证文件类型
function validateFileType(fileName) {
  const allowedTypes = ['bin', 'zip'];
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(fileExtension);
}

// 验证文件大小（默认100MB）
function validateFileSize(fileSize, maxSize = 100 * 1024 * 1024) {
  return fileSize <= maxSize;
}

// 生成STS临时凭证（模拟实现，实际应该调用阿里云STS服务）
async function getStsToken(fileType = 'bin', fileName = 'firmware.bin') {
  // 注意：这是一个简化实现，生产环境应该使用阿里云STS SDK
  if (!OSS_CONFIG.stsRoleArn) {
    throw new Error('STS_ROLE_ARN environment variable is required for STS token generation');
  }
  
  // 这里应该调用阿里云STS服务获取临时凭证
  // 目前返回模拟数据，实际部署时需要实现真正的STS逻辑
  return {
    accessKeyId: OSS_CONFIG.accessKeyId,
    accessKeySecret: OSS_CONFIG.accessKeySecret,
    securityToken: null, // 在真实STS实现中这里会有token
    expiration: new Date(Date.now() + 3600000).toISOString(), // 1小时后过期
    region: OSS_CONFIG.region,
    bucket: OSS_CONFIG.bucket,
    uploadPath: OSS_CONFIG.uploadPath
  };
}

module.exports = {
  OSS_CONFIG,
  generateSafeFileName,
  buildFileUrl,
  validateFileType,
  validateFileSize,
  getStsToken
}; 