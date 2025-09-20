// 固件文件类型
export interface FirmwareFile {
  id: string
  name: string
  type: 'esp' | 'mainboard'
  size: number
  md5: string
  uploadTime: string
  url?: string
  version?: string
}

// 配置参数接口
export interface ConfigParams {
  deviceModel: string
  firmwareVersion: string
  espFile: FirmwareFile | null
  mainboardFile: FirmwareFile | null
  description?: string
  releaseNotes?: string
}

// 生成的配置接口
export interface GeneratedConfig {
  id: string
  deviceModel: string
  version: string
  createTime: string
  config: any
  files: FirmwareFile[]
  description?: string
}

// 上传进度接口
export interface UploadProgress {
  percentage: number
  status: 'uploading' | 'success' | 'error'
  message?: string
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// STS令牌接口
export interface StsToken {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  expiration: string
} 

export interface FrontendBuildInfo {
  appName: string
  version: string
  commit: string
  time: string
}