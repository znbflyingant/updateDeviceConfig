class EnvConfig {
  constructor(env = process.env) {
    this.env = env
  }

  get nodeEnv() { return this.env.NODE_ENV || 'development' }
  get port() { return Number(this.env.PORT || 8080) }
  get trustProxy() { return this.env.TRUST_PROXY }
  get allowedOriginsRaw() { return this.env.ALLOWED_ORIGINS || this.env.FRONTEND_URL || '' }
  get apiBaseUrl() { return this.env.HUAWEI_BASE_URL || 'https://connect-api.cloud.huawei.com' }

  // Huawei RC
  get huaweiClientId() { return this.env.HUAWEI_CLIENT_ID }
  get huaweiClientSecret() { return this.env.HUAWEI_CLIENT_SECRET }
  get huaweiProductId() { return this.env.HUAWEI_IOS_PRODUCT_ID || this.env.HUAWEI_PRODUCT_ID }
  get huaweiAppId() { return this.env.HUAWEI_IOS_APP_ID || this.env.HUAWEI_APP_ID }
  get huaweiRcKey() { return this.env.HUAWEI_RC_KEY }

  parseAllowedOrigins() {
    return this.allowedOriginsRaw.split(',').map(s => s.trim()).filter(Boolean)
  }
}

module.exports = EnvConfig


