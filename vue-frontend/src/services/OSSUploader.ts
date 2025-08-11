import axios from 'axios'
import CryptoJS from 'crypto-js'
import type { UploadProgress, StsToken, ApiResponse } from '../types'

class OSSUploader {
  private rawBase = (import.meta.env as any).VITE_API_BASE_URL

  // 规范化 API 基础地址：
  // - 支持传入根地址（如 http://localhost:3001）
  // - 也支持直接传入包含 /api 的地址（如 https://api.example.com/api）
  private getApiBase(): string {
    const base = this.rawBase.replace(/\/$/, '')
    const endsWithApi = /\/api$/i.test(base)
    return endsWithApi ? base : `${base}/api`
  }

  // 计算文件MD5（返回大写十六进制）
  async calculateMD5(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
          const md5 = CryptoJS.MD5(wordArray).toString().toUpperCase()
          resolve(md5)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // 上传文件到后端中转（推荐）
  async uploadViaServer(
    file: Array<File | Blob>,
    filename: string | string[],
    objectKey?: string | string[],
    onProgress?: (progress: UploadProgress) => void,
    version?: number,
    updateLog?: string,
    md5s?: string[]
  ): Promise<string> {
    const form = new FormData()
    const filesArray = file as Array<File | Blob>;
    const namesArray = Array.isArray(filename) ? filename : [filename]
    const keysArray = Array.isArray(objectKey) ? objectKey : (objectKey ? [objectKey] : [])

    filesArray.forEach((f, idx) => {
      const name = namesArray[idx] || `file_${idx}`
      form.append('files', f instanceof File ? f : new File([f], name))
    })
    if (keysArray.length) form.append('keys', JSON.stringify(keysArray))
    if (version) form.append('version', String(version))
    if (updateLog) form.append('updateLog', updateLog)
    if (md5s && md5s.length) form.append('md5s', JSON.stringify(md5s))

    const uploadUrl = `${this.getApiBase()}/oss/upload-batch`;

    const resp = await axios.post<ApiResponse>(uploadUrl, form, {
      // 注意：不要手动设置 Content-Type，浏览器会自动附带 boundary
      onUploadProgress: (evt) => {
        // if (onProgress && evt.total) {
        //   const percentage = Math.round((evt.loaded / evt.total) * 100)
        //   onProgress({ percentage, status: 'uploading', message: `正在上传... ${percentage}%` })
        // }
      }
    })
    if (!resp.data.success || !resp.data.data) throw new Error(resp.data.message || '上传失败')
    const toUpdateContent = (resp.data as any)?.data?.toUpdateContent as string
    if (!toUpdateContent) throw new Error('服务未返回 toUpdateContent')
    return toUpdateContent
  }
}

export default new OSSUploader() 