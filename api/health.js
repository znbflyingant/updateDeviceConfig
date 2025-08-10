// 健康检查API
module.exports = function handler(req, res) {
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

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      code: 405, 
      message: '方法不允许' 
    });
  }

  const healthData = {
    code: 200,
    message: '服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      platform: 'vercel',
      environment: 'serverless'
    }
  };

  res.status(200).json(healthData);
}
