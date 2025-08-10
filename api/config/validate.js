// 配置验证API
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

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      code: 405, 
      message: '方法不允许' 
    });
  }

  try {
    const { name, version, description, files } = req.body;
    
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
      return res.status(400).json({
        code: 400,
        message: '配置验证失败',
        errors
      });
    }

    const successResponse = {
      code: 200,
      message: '配置验证通过',
      data: {
        valid: true,
        config: { name, version, description, files }
      }
    };

    res.status(200).json(successResponse);

  } catch (error) {
    console.error('配置验证异常:', error);

    const errorResponse = {
      code: 500,
      message: '服务器内部错误'
    };

    res.status(500).json(errorResponse);
  }
}
