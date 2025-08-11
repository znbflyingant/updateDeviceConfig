#!/usr/bin/env node

/**
 * 环境变量验证脚本
 * 用于检查所有必要的环境变量是否已正确配置
 */

require('dotenv').config();

// 尝试加载chalk，如果不存在则使用基础输出
let chalk;
try {
  chalk = require('chalk');
} catch (error) {
  // 如果chalk不可用，创建一个简单的替代
  chalk = {
    blue: (text) => text,
    yellow: (text) => text,
    red: (text) => text,
    green: (text) => text,
    gray: (text) => text
  };
}

// 定义所有必要的环境变量
const ENV_VARS = {
  // 服务器配置
  server: {
    PORT: { required: false, default: '3001', description: '服务器端口' },
    NODE_ENV: { required: false, default: 'development', description: '运行环境' },
    FRONTEND_URL: { required: false, default: 'http://localhost:3000', description: '前端URL' },
    DEBUG: { required: false, default: 'false', description: '调试模式（true/false）' },
    ALLOWED_ORIGINS: { required: false, description: 'CORS 允许的跨域来源（逗号分隔）' }
  },
  
  // OSS配置
  oss: {
    OSS_REGION: { required: true, description: '阿里云OSS区域' },
    OSS_ACCESS_KEY_ID: { required: true, description: '阿里云Access Key ID' },
    OSS_ACCESS_KEY_SECRET: { required: true, description: '阿里云Access Key Secret' },
    OSS_BUCKET: { required: true, description: 'OSS存储桶名称' },
    OSS_UPLOAD_PATH: { required: false, default: 'firmware/', description: 'OSS上传路径' },
    OSS_CDN_DOMAIN: { required: false, description: 'CDN域名' }
  },
  
  // STS配置
  sts: {
    STS_ROLE_ARN: { required: false, description: 'STS角色ARN' },
    STS_ROLE_SESSION_NAME: { required: false, default: 'firmware-upload-session', description: 'STS会话名称' }
  },
  
  // 华为云配置
  huawei: {
    HUAWEI_CLIENT_ID: { required: true, description: '华为云客户端ID' },
    HUAWEI_CLIENT_SECRET: { required: true, description: '华为云客户端密钥' },
    HUAWEI_PRODUCT_ID: { required: true, description: '华为云产品ID' },
    HUAWEI_APP_ID: { required: true, description: '华为云应用ID' },
    HUAWEI_BASE_URL: { required: false, default: 'https://connect-api.cloud.huawei.com', description: '华为云API基础URL' }
  }
};

function validateEnvironment() {
  console.log(chalk.blue('🔍 环境变量验证开始...\n'));
  
  let hasErrors = false;
  let warnings = [];
  
  // 遍历所有环境变量分类
  Object.keys(ENV_VARS).forEach(category => {
    console.log(chalk.yellow(`📋 ${category.toUpperCase()} 配置:`));
    
    Object.keys(ENV_VARS[category]).forEach(varName => {
      const config = ENV_VARS[category][varName];
      const value = process.env[varName];
      
      if (config.required && !value) {
        console.log(chalk.red(`  ❌ ${varName}: 缺少必要变量 - ${config.description}`));
        hasErrors = true;
      } else if (!value && config.default) {
        console.log(chalk.yellow(`  ⚠️  ${varName}: 使用默认值 "${config.default}" - ${config.description}`));
        warnings.push(varName);
      } else if (value) {
        // 对敏感信息进行脱敏显示
        const displayValue = varName.includes('SECRET') || varName.includes('KEY') 
          ? `${value.substring(0, 8)}...` 
          : value;
        console.log(chalk.green(`  ✅ ${varName}: ${displayValue} - ${config.description}`));

        // 对 ALLOWED_ORIGINS 进行解析展示，便于核对
        if (varName === 'ALLOWED_ORIGINS') {
          const list = value.split(',').map(s => s.trim()).filter(Boolean);
          console.log(chalk.gray(`     → Parsed origins: ${list.length ? list.join(' | ') : '(empty)'}`));
        }
      } else {
        console.log(chalk.gray(`  ⭕ ${varName}: 未设置 - ${config.description}`));
      }
    });
    
    console.log('');
  });
  
  // 显示验证结果
  if (hasErrors) {
    console.log(chalk.red('❌ 环境变量验证失败！缺少必要变量。'));
    console.log(chalk.blue('💡 提示：'));
    console.log('  1. 复制 server/env.example 为 server/.env');
    console.log('  2. 填入你的实际配置值');
    console.log('  3. 或在部署平台中配置环境变量\n');
    // 在生产环境不阻断启动，仅给出警告，避免阻塞部署健康检查
    if (process.env.NODE_ENV === 'production') {
      console.log(chalk.yellow('⚠️  生产环境检测到缺少必要变量，将继续启动（仅警告，不中断）。'));
    } else {
      process.exit(1);
    }
  } else {
    console.log(chalk.green('✅ 环境变量验证通过！'));
    if (warnings.length > 0) {
      console.log(chalk.yellow(`⚠️  有 ${warnings.length} 个变量使用默认值，建议在生产环境中明确配置。`));
    }
    console.log('');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  // 尝试安装chalk，如果没有的话使用基础输出
  try {
    validateEnvironment();
  } catch (error) {
    // 如果chalk不可用，使用基础console输出
    console.log('Environment validation (basic mode):');
    
    let hasErrors = false;
    Object.keys(ENV_VARS).forEach(category => {
      Object.keys(ENV_VARS[category]).forEach(varName => {
        const config = ENV_VARS[category][varName];
        const value = process.env[varName];
        
        if (config.required && !value) {
          console.log(`ERROR: Missing required variable ${varName}`);
          hasErrors = true;
        }
      });
    });
    
    if (hasErrors) {
      console.log('Environment validation failed!');
      if (process.env.NODE_ENV === 'production') {
        console.log('Production mode: continuing without exit.');
      } else {
        process.exit(1);
      }
    } else {
      console.log('Environment validation passed!');
    }
  }
}

module.exports = { validateEnvironment, ENV_VARS };
