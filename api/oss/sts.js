// STS令牌获取API
const { OSS_CONFIG, getStsToken, validateFileType } = require('../../server/oss-config.js');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: '方法不允许' 
    });
  }

  try {
    const { fileType = 'bin', fileName = 'firmware.bin' } = req.query;
    
    // 验证文件类型
    if (!validateFileType(fileName)) {
      return res.status(400).json({
        success: false,
        message: '不支持的文件类型，只支持 .bin 和 .zip 文件'
      });
    }

    // 生成STS token
    const stsToken = await getStsToken(fileType, fileName);
    
    const responseData = {
      success: true,
      message: '获取STS凭证成功',
      data: stsToken
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('获取STS凭证失败:', error);
    
    const errorResponse = {
      success: false,
      message: error.message || '服务器内部错误'
    };
    
    res.status(500).json(errorResponse);
  }
}
