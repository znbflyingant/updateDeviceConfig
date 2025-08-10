/**
 * 华为云远程配置 API 配置示例
 * 复制此文件为 config.js 并填入您的实际配置信息
 */

// 加载环境变量
require('dotenv').config();

const config = {
    // 在 AppGallery Connect 控制台 > 用户与权限 > Connect API 中创建的 API 客户端信息
    clientId: process.env.HUAWEI_CLIENT_ID,           // 客户端ID
    clientSecret: process.env.HUAWEI_CLIENT_SECRET,   // 客户端密钥
    
    // 项目信息，可在 AppGallery Connect 控制台项目设置中找到
    productId: process.env.HUAWEI_PRODUCT_ID,         // 产品ID
    appId: process.env.HUAWEI_APP_ID,                 // 应用ID
    
    // API 基础URL，通常不需要修改
    baseUrl: process.env.HUAWEI_BASE_URL || 'https://connect-api.cloud.huawei.com'
};

// 验证必要的环境变量
const requiredEnvVars = ['HUAWEI_CLIENT_ID', 'HUAWEI_CLIENT_SECRET', 'HUAWEI_PRODUCT_ID', 'HUAWEI_APP_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ 缺少必要的华为云环境变量:', missingVars.join(', '));
    console.error('请在 .env 文件或部署平台中配置这些变量');
    // 在开发环境中抛出错误，生产环境中给出警告
    if (process.env.NODE_ENV !== 'production') {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}

// 浏览器环境
if (typeof window !== 'undefined') {
    window.HuaweiConfig = config;
} 