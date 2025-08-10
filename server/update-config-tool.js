#!/usr/bin/env node

/**
 * 华为云远程配置更新工具
 * 用法: node update-config-tool.js <key> <content>
 * 示例: node update-config-tool.js device_upgrade_info '{"version":77,"updateLog":"V77 更新"}'
 */

const HuaweiRemoteConfigAPI = require('./huawei-remote-config-api.js');

const key = "device_upgrade_info";

// 加载配置
let config;
try {
    config = require('./config.js');
} catch (error) {
    console.error('❌ 请先创建并配置 config.js 文件');
    process.exit(1);
}

/**
 * 执行更新
 */
async function updateConfig(content) {
    const api = new HuaweiRemoteConfigAPI(config);
    
    try {
        console.log(`🔄 正在更新配置: ${key}`);
        console.log(`📝 新内容: ${content}`);
      
        // 获取访问令牌
        console.log('\n🔑 获取访问令牌...');
        await api.getAccessToken();
        
        // 执行更新
        console.log('🚀 执行更新...',content);
        let result = await api.updateParameterByKey(key, content);
        
        // updateParameterByKey 方法已经自动包含了最新数据的查询和显示
        console.log('\n✅ 更新完成！',result);
        
    } catch (error) {
        console.error('\n❌ 更新失败:', error.message);
        process.exit(1);
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateConfig
    };
}

 
