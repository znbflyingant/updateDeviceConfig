// 批量上传API
const OSS = require('ali-oss');
const { OSS_CONFIG } = require('../../server/oss-config.js');

// 由于Vercel Serverless Functions不支持multer，我们需要处理multipart/form-data
const multiparty = require('multiparty');

function createOssClient() {
  return new OSS({
    region: OSS_CONFIG.region,
    accessKeyId: OSS_CONFIG.accessKeyId,
    accessKeySecret: OSS_CONFIG.accessKeySecret,
    bucket: OSS_CONFIG.bucket,
    authorizationV4: true,
  });
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
    // 解析multipart form data
    const form = new multiparty.Form();
    
    const parseForm = () => new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const { fields, files } = await parseForm();
    
    const uploadedFiles = files.files || [];
    if (!uploadedFiles.length) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少文件' 
      });
    }

    const keys = JSON.parse(fields.keys?.[0] || '[]');
    const md5s = JSON.parse(fields.md5s?.[0] || '[]');
    const version = fields.version?.[0];
    const updateLog = fields.updateLog?.[0];

    const client = createOssClient();
    let toUpdateContent = {
      version: version,
      updateLog: updateLog
    };

    const headers = {
      'x-oss-storage-class': 'Standard',
      'x-oss-object-acl': 'private',
    };

    const uploads = await Promise.all(uploadedFiles.map(async (file, i) => {
      const md5 = md5s[i] || '';
      const originalName = file.originalFilename || `file_${i}`;
      const keyBody = keys[i];
      
      // 读取文件内容
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(file.path);
      
      const putResult = await client.put(keyBody, fileBuffer, { headers });
      const url = putResult.url;
      return { originalName, md5, url };
    }));

    uploads.forEach(u => {
      if (u.originalName.toLowerCase().endsWith('.bin')) {
        toUpdateContent.espUrl = u.url;
        toUpdateContent.espMd5 = u.md5;
      } else {
        toUpdateContent.clipZipUrl = u.url;
        toUpdateContent.clipZipMd5 = u.md5;
      }
    });

    return res.status(200).json({ 
      success: true, 
      data: { toUpdateContent: JSON.stringify(toUpdateContent) } 
    });

  } catch (error) {
    console.error('批量上传失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || '上传失败' 
    });
  }
}
