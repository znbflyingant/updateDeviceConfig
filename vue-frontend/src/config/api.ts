// API配置文件
export const API_CONFIG = {
  // 开发环境使用本地后端
  development: {
    baseURL: 'http://localhost:3001/api'
  },
  
  // 生产环境使用Railway后端
  production: {
    baseURL: 'https://your-railway-app.railway.app/api'  // 替换为你的Railway URL
  }
};

// 获取当前环境的API基础URL
export const getApiBaseURL = () => {
  const env = process.env.NODE_ENV || 'development';
  return API_CONFIG[env as keyof typeof API_CONFIG]?.baseURL || API_CONFIG.development.baseURL;
};

export default {
  API_CONFIG,
  getApiBaseURL
};
