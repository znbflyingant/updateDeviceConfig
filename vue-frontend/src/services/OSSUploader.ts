import axios from 'axios'
import CryptoJS from 'crypto-js'
import type { UploadProgress, StsToken, ApiResponse } from '../types'

class OSSUploader {
  private baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

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

    const uploadUrl = `${this.baseURL}/api/oss/upload-batch`;

    const resp = await axios.post<ApiResponse>(uploadUrl, form, {
      // 注意：不要手动设置 Content-Type，浏览器会自动附带 boundary
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          const percentage = Math.round((evt.loaded / evt.total) * 100)
          onProgress({ percentage, status: 'uploading', message: `正在上传... ${percentage}%` })
        }
      }
    })
    if (!resp.data.success || !resp.data.data) throw new Error(resp.data.message || '上传失败')
    let result = resp.data?.data?.result as string;
    return result;
  }
}

export default new OSSUploader() 