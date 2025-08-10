import { defineStore } from 'pinia'
import type { FirmwareFile, GeneratedConfig, ConfigParams } from '../types'

export const useFirmwareStore = defineStore('firmware', {
  state: () => ({
    // 文件列表
    files: [] as FirmwareFile[],
    
    // 配置历史
    configs: [] as GeneratedConfig[],
    
    // 当前配置参数
    currentParams: {
      deviceModel: '',
      firmwareVersion: '',
      espFile: null,
      mainboardFile: null,
      description: '',
      releaseNotes: ''
    } as ConfigParams,
    
    // 加载状态
    loading: false,
    
    // 上传状态
    uploading: false
  }),

  getters: {
    // ESP文件列表
    espFiles: (state) => state.files.filter(file => file.type === 'esp'),
    
    // 主板文件列表
    mainboardFiles: (state) => state.files.filter(file => file.type === 'mainboard'),
    
    // 是否可以生成配置
    canGenerateConfig: (state) => {
      return !!(state.currentParams.deviceModel && 
                state.currentParams.firmwareVersion &&
                state.currentParams.espFile &&
                state.currentParams.mainboardFile)
    }
  },

  actions: {
    // 添加文件
    addFile(file: FirmwareFile) {
      const existingIndex = this.files.findIndex(f => f.id === file.id)
      if (existingIndex >= 0) {
        this.files[existingIndex] = file
      } else {
        this.files.push(file)
      }
    },

    // 删除文件
    removeFile(fileId: string) {
      this.files = this.files.filter(f => f.id !== fileId)
      
      // 如果当前选中的文件被删除，清空选择
      if (this.currentParams.espFile?.id === fileId) {
        this.currentParams.espFile = null
      }
      if (this.currentParams.mainboardFile?.id === fileId) {
        this.currentParams.mainboardFile = null
      }
    },

    // 更新配置参数
    updateParams(params: Partial<ConfigParams>) {
      this.currentParams = { ...this.currentParams, ...params }
    },

    // 添加配置
    addConfig(config: GeneratedConfig) {
      this.configs.unshift(config)
    },

    // 删除配置
    removeConfig(configId: string) {
      this.configs = this.configs.filter(c => c.id !== configId)
    },

    // 设置加载状态
    setLoading(loading: boolean) {
      this.loading = loading
    },

    // 设置上传状态
    setUploading(uploading: boolean) {
      this.uploading = uploading
    },

    // 重置当前参数
    resetCurrentParams() {
      this.currentParams = {
        deviceModel: '',
        firmwareVersion: '',
        espFile: null,
        mainboardFile: null,
        description: '',
        releaseNotes: ''
      }
    }
  }
}) 