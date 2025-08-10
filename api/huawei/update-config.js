// 华为云远程配置更新API
const HuaweiRemoteConfigAPI = require('../../server/huawei-remote-config-api.js');

function loadHuaweiConfig() {
  return require('../../server/config.js');
}

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    });
  }

  try {
    const { key = 'device_upgrade_info', content } = req.body || {};
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: 'content 不能为空' 
      });
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
    
    return res.status(200).json({ 
      success: true, 
      data: { latest: latestValue } 
    });

  } catch (error) {
    console.error('更新华为配置失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || '更新失败' 
    });
  }
}
