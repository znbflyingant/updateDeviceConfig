/**
 * 华为云 AppGallery Connect 远程配置 REST API 客户端
 * 支持获取访问令牌、查询配置、修改配置、版本管理等功能
 */

class HuaweiRemoteConfigAPI {
    constructor(config) {
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.productId = config.productId;
        this.appId = config.appId;
        this.baseUrl = config.baseUrl;
        this.accessToken = null;
    }

    /**
     * 获取访问令牌
     */
    async getAccessToken() {
        const url = `${this.baseUrl}/api/oauth2/v1/token`;
        
        const requestBody = {
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.access_token) {
                throw new Error('API 响应中缺少 access_token 字段');
            }
            
            this.accessToken = data.access_token;
            
            console.log(`✅ 访问令牌获取成功: ${data.access_token}`);
            return data.access_token;
        } catch (error) {
            console.error('❌ 获取访问令牌失败:', error.message);
            throw error;
        }
    }

    /**
     * 确保有有效的访问令牌
     */
    async ensureAccessToken() {
        if (!this.accessToken) {
            await this.getAccessToken();
        }
    }

    /**
     * 查询配置信息
     */
    async queryConfiguration() {
        await this.ensureAccessToken();
        
        const url = `${this.baseUrl}/api/remote-config/v1/config`;

        // 打印查询请求数据
        console.log('\n📤 查询配置请求数据:');
        console.log('URL:', url);
        console.log('Method: GET');
        console.log('Headers:', {
            'Authorization': `Bearer ${this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'null'}`,
            'Content-Type': 'application/json',
            'productId': this.productId,
            'client_id': this.clientId,
            'appId': this.appId
        });
        console.log('Body: (GET请求无Body)');
        console.log('─'.repeat(50));

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'productId': this.productId,
                    'client_id': this.clientId,
                    'appId': this.appId
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            // 打印响应数据
            console.log('\n📥 查询配置响应数据:');
            console.log('Status:', response.status, response.statusText);
            console.log('Response Body:');
            console.log(JSON.stringify(data, null, 2));
            console.log('─'.repeat(50));
            
            console.log('✅ 配置查询成功');
            return data;
        } catch (error) {
            console.error('❌ 查询配置失败:', error.message);
            throw error;
        }
    }

    /**
     * 将查询得到的配置项转换为更新所需的数据结构
     * 查询返回字段: name, desc, defaultValue.value, filterValues
     * 更新需要字段: key, description, defaultValue{value,useSdkValue}, conditionalValues
     */
    transformQueryItemToUpdateItem(queryItem) {
        return {
            // 同时包含 key 和 name，兼容服务端校验
            key: queryItem.name,
            name: queryItem.name,
            defaultValue: {
                value: queryItem?.defaultValue?.value ?? (typeof queryItem.defaultValue === 'string' ? queryItem.defaultValue : ''),
                useSdkValue: queryItem?.defaultValue?.useSdkValue || false,
            },
            description: queryItem.desc || queryItem.description || '',
            conditionalValues: (queryItem.filterValues || []).map(fv => ({
                condition: fv.condition || {},
                value: fv?.value?.value ?? fv?.value,
            })),
        };
    }

    /**
     * 构建“完整配置”更新数组（把查询得到的全部 configItems 转换为可更新格式）
     */
    buildFullUpdateItemsFromCurrentConfig(currentConfig) {
        const sourceItems = currentConfig?.configItems || [];
        return sourceItems.map(item => this.transformQueryItemToUpdateItem(item));
    }

    /**
     * 创建或修改配置参数（完整配置更新）
     * @param {Array} configItems - 配置项数组
     * @param {Array} filters - 过滤条件数组
     * @param {number} version - 配置版本号（从查询接口获取）
     */
        async updateConfiguration(configItems, filters = [], version = 0) {
        await this.ensureAccessToken();
        
        const url = `${this.baseUrl}/api/remote-config/v1/config`;

        const requestBody = {
            "configItems": configItems,
            "filters": filters,
            "version": version,  // 使用传入的版本号
        };

        // 打印请求体数据
        console.log('\n📤 发送请求体数据:');
        console.log('URL:', url);
        console.log('Method: PUT');
        console.log('Headers:', {
            'Authorization': `Bearer ${this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'null'}`,
            'Content-Type': 'application/json',
            'client_id': this.clientId,
            'productId': this.productId,
            'appId': this.appId
        });
        console.log('Body:');
        console.log(JSON.stringify(requestBody, null, 2));
        console.log('─'.repeat(50));
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'client_id': this.clientId,
                    'productId': this.productId,
                    'appId': this.appId
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (data?.ret && data.ret.code !== 0) {
                console.log('\n⚠️ 更新返回非零code:', data.ret.code, data.ret.msg || '');
                throw new Error(`更新失败: code=${data.ret.code}, msg=${data.ret.msg || 'Unknown error'}`);
            }
            
            // 打印更新响应数据
            console.log('\n📥 更新配置响应数据:');
            console.log('Status:', response.status, response.statusText);
            console.log('Response Body:');
            console.log(JSON.stringify(data, null, 2));
            console.log('─'.repeat(50));
            
            console.log('✅ 配置更新成功');
            return data;
        } catch (error) {
            console.error('❌ 更新配置失败:', error.message);
            throw error;
        }
    }

    /**
     * 更新配置参数（智能更新）
     * 根据传入的key和内容，自动查询并更新对应的配置
     * @param {string} key - 参数键（对应返回结果中的name字段）
     * @param {any} content - 要更新的内容（会自动处理JSON序列化）
     * @param {string} description - 参数描述（可选，不传则保持原描述）
     */
    async updateParameterByKey(key, content) {
        console.log(`🔄 正在更新参数: ${key}`);
        
        try {
            // 1. 查询当前配置
            console.log('📋 查询当前配置...');
            const currentConfig = await this.queryConfiguration();
            
            // 2. 查找要更新的参数
            const configItem = currentConfig.configItems?.find(item => item.name === key);
            
            if (!configItem) {
                throw new Error(`参数 '${key}' 不存在，请先创建该参数`);
            }
            
            console.log(`✅ 找到参数: ${key}`);
            console.log(`   当前值: ${configItem.defaultValue?.value || configItem.defaultValue}`);
            
            // 3. 准备新的值（如未提供对应字段，则沿用旧值；若为JSON则与旧值浅合并）
            const existingRaw = configItem?.defaultValue?.value || configItem?.defaultValue || '';
            let contentStr = content;
            if (typeof contentStr !== 'string') {
                try { contentStr = JSON.stringify(contentStr); } catch (e) { contentStr = ''; }
            }
            let finalValue = existingRaw;
            try {
                const oldObj = JSON.parse(existingRaw);
                const newObj = contentStr ? JSON.parse(contentStr) : null;
                if (oldObj && typeof oldObj === 'object' && newObj && typeof newObj === 'object') {
                    // 浅合并：新值覆盖同名字段，未提供的字段保留旧值
                    const merged = { ...oldObj, ...newObj };
                    finalValue = JSON.stringify(merged);
                } else if (contentStr && contentStr.length > 0) {
                    finalValue = contentStr; // 新值为非JSON字符串，直接覆盖
                }
            } catch (e) {
                // 解析失败：如新值为空或无效，则使用旧值；否则直接写入新字符串
                if (contentStr && contentStr.length > 0) {
                    finalValue = contentStr;
                }
            }
            
            // 4. 基于“完整配置”提交：把所有原始配置转换并覆盖匹配项
            const fullItems = this.buildFullUpdateItemsFromCurrentConfig(currentConfig);
            const targetIndex = fullItems.findIndex(i => i.key === key);
            if (targetIndex === -1) {
                throw new Error(`参数 '${key}' 不存在，请先创建该参数`);
            }
            fullItems[targetIndex] = {
                ...fullItems[targetIndex],
                defaultValue: {
                    value: finalValue,
                    useSdkValue: fullItems[targetIndex]?.defaultValue?.useSdkValue || false,
                },
            };
            
            console.log(`🔧 新值(将提交): ${finalValue}`);
            console.log(`📦 本次将提交完整配置项总数: ${fullItems.length}`);
            let version = currentConfig.versionInfo?.version || 0;
            let nextVersion = version + 1;
            // 5. 执行更新（提交完整配置）
            const updateRes = await this.updateConfiguration(fullItems, currentConfig.filters || [], version);
            
            console.log(`✅ 参数 '${key}' 更新成功`);
            
            // 6. 查询并显示最新的配置数据
            console.log('\n📋 查询最新配置数据...');
            const latestConfig = await this.queryConfiguration();
            const updatedParam = latestConfig.configItems?.find(item => item.name === key);
            
            if (updatedParam) {
                console.log('\n🔍 最新配置详情:');
                console.log(`   参数名: ${updatedParam.name}`);
                console.log(`   描述: ${updatedParam.defaultValue?.description}`);
                
                const latestValue = updatedParam.defaultValue?.value;
                try {
                    // 尝试解析JSON并格式化显示
                    const parsedValue = JSON.parse(latestValue);
                    console.log(`   配置内容:`);
                    console.log(JSON.stringify(parsedValue, null, 4).split('\n').map(line => `     ${line}`).join('\n'));
                } catch (e) {
                    // 如果不是JSON，直接显示
                    console.log(`   配置内容: ${latestValue}`);
                }
                
                // 显示版本信息
                if (latestConfig.versionInfo) {
                    console.log(`\n📊 版本信息:`);
                    console.log(`   版本号: ${latestConfig.versionInfo.version}`);
                    console.log(`   更新时间: ${new Date(latestConfig.versionInfo.updateTime).toLocaleString('zh-CN')}`);
                }
                
                // 显示条件配置（如果有）
                if (updatedParam.filterValues && updatedParam.filterValues.length > 0) {
                    console.log(`\n🎯 条件配置:`);
                    updatedParam.filterValues.forEach((filter, index) => {
                        console.log(`   条件${index + 1}: ${JSON.stringify(filter.condition)} => ${filter.value?.value || filter.value}`);
                    });
                }
            }
            
            return updateRes;
            
        } catch (error) {
            console.error(`❌ 更新参数 '${key}' 失败:`, error.message);
            throw error;
        }
    }
}

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HuaweiRemoteConfigAPI;
}

// 浏览器环境下的全局导出
if (typeof window !== 'undefined') {
    window.HuaweiRemoteConfigAPI = HuaweiRemoteConfigAPI;
} 