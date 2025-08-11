<template>
  <div class="file-upload">
    <!-- 版本与日志输入 -->
    <div class="version-form card">
      <a-form layout="inline">
        <a-form-item label="版本号">
          <a-input v-model:value="versionInput" style="width: 160px" placeholder="如 69" />
        </a-form-item>
        <a-form-item label="更新日志">
          <a-input v-model:value="updateLog" style="width: 460px" placeholder="更新说明" />
        </a-form-item>
      </a-form>
    </div>

    <!-- ESP 升级区域（单文件） -->
    <div class="card">
      <h3>ESP 升级 bin（仅允许 1 个 .bin 文件）</h3>
      <div class="upload-area" :class="{ dragover: isDragOverEsp }"
           @click="triggerFileInput('esp')"
           @dragover.prevent="isDragOverEsp = true"
           @dragleave.prevent="isDragOverEsp = false"
           @drop.prevent="onDrop($event, 'esp')">
        <div class="upload-content">
          <CloudUploadOutlined class="upload-icon" />
          <p>点击或拖入 ESP .bin 文件</p>
          <p class="upload-hint">当前：{{ espFile ? espFile.name : '未选择' }}</p>
        </div>
      </div>
      <input ref="espInput" type="file" accept=".bin" style="display:none" @change="onPick('esp', $event)" />
    </div>

    <!-- 芯片主板升级区域（多文件） -->
    <div class="card">
      <h3>芯片主板升级 bin（可多选 .bin 文件，提交时自动打包为 zip）</h3>
      <div class="upload-area" :class="{ dragover: isDragOverMb }"
           @click="triggerFileInput('mb')"
           @dragover.prevent="isDragOverMb = true"
           @dragleave.prevent="isDragOverMb = false"
           @drop.prevent="onDrop($event, 'mb')">
        <div class="upload-content">
          <CloudUploadOutlined class="upload-icon" />
          <p>点击或拖入多个主板 .bin 文件</p>
          <p class="upload-hint">已选择 {{ mainboardFiles.length }} 个文件</p>
        </div>
      </div>
      <input ref="mbInput" type="file" accept=".bin" multiple style="display:none" @change="onPick('mb', $event)" />

      <!-- 已选文件列表 -->
      <div v-if="mainboardFiles.length" class="file-grid">
        <div v-for="f in mainboardFiles" :key="f.name" class="file-item">
          <span class="file-name">{{ f.name }}</span>
          <a-button size="small" danger @click="removeMb(f.name)">删除</a-button>
        </div>
      </div>
    </div>

    <!-- 动作按钮与进度 -->
    <div class="actions card">
      <a-space>
        <a-button type="primary" :loading="submitting" @click="handleSubmit">提交上传并生成配置</a-button>
        <a-button danger @click="resetAll" :disabled="submitting">重置</a-button>
      </a-space>
      <div v-if="progressMsg" class="progress-msg">{{ progressMsg }}</div>
    </div>

    <!-- 结果配置展示 -->
    <div v-if="outputConfig" class="card">
      <h3>生成的配置 JSON</h3>
      <pre class="result-json">{{ JSON.stringify(outputConfig, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { CloudUploadOutlined } from '@ant-design/icons-vue'
import JSZip from 'jszip'
import OSSUploader from '../services/OSSUploader'


const versionInput = ref('')
const updateLog = ref('')

const espInput = ref<HTMLInputElement>()
const mbInput = ref<HTMLInputElement>()

const isDragOverEsp = ref(false)
const isDragOverMb = ref(false)

const espFile = ref<File | null>(null)
const mainboardFiles = ref<File[]>([])

const submitting = ref(false)
const progressMsg = ref('')
const outputConfig = ref<any | null>(null)
const safeParseJSON = (val: any) => {
  if (!val) return null
  if (typeof val !== 'string') return val
  try { return JSON.parse(val) } catch { return val }
}

function buildHuaweiContent(local: any, batch: { files: Array<{ url: string; key: string }> }) {
  // 合并原则：有上传就用新地址，否则保留 local 中的字段
  const merged: any = { ...local }
  if (Array.isArray(batch?.files)) {
    for (const it of batch.files) {
      const name = (it.key || '').split('/').pop() || ''
      if (name.toLowerCase().endsWith('.zip')) {
        merged.clipZipUrl = it.url || merged.clipZipUrl
      } else if (name.toLowerCase().endsWith('.bin')) {
        merged.espUrl = it.url || merged.espUrl
      }
    }
  }
  return merged
}

const triggerFileInput = (type: 'esp' | 'mb') => {
  if (type === 'esp') espInput.value?.click();
  else mbInput.value?.click();
}

const onPick = (type: 'esp' | 'mb', e: Event) => {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return

  if (type === 'esp') {
    const f = files[0]
    if (!f.name.toLowerCase().endsWith('.bin')) return message.error('请选择 .bin 文件')
    espFile.value = f
  } else {
    const filtered = files.filter(f => f.name.toLowerCase().endsWith('.bin'))
    if (!filtered.length) return message.error('请选择 .bin 文件')
    mainboardFiles.value.push(...filtered)
  }
  input.value = ''
}

const onDrop = (ev: DragEvent, type: 'esp' | 'mb') => {
  if (type === 'esp') isDragOverEsp.value = false
  else isDragOverMb.value = false
  const files = Array.from(ev.dataTransfer?.files || [])
  onDropFiles(files, type)
}

const onDropFiles = (files: File[], type: 'esp' | 'mb') => {
  if (type === 'esp') {
    const f = files.find(f => f.name.toLowerCase().endsWith('.bin'))
    if (!f) return message.error('请拖入 .bin 文件')
    espFile.value = f
  } else {
    const filtered = files.filter(f => f.name.toLowerCase().endsWith('.bin'))
    if (!filtered.length) return message.error('请拖入 .bin 文件')
    mainboardFiles.value.push(...filtered)
  }
}

const removeMb = (name: string) => {
  mainboardFiles.value = mainboardFiles.value.filter(f => f.name !== name)
}

const resetAll = () => {
  versionInput.value = ''
  updateLog.value = ''
  espFile.value = null
  mainboardFiles.value = []
  submitting.value = false
  progressMsg.value = ''
  outputConfig.value = null
}

function assertVersion(): { versionNum: number, versionTag: string } | null {
  const raw = versionInput.value.trim()
  if (!raw) { message.error('请填写版本号'); return null }
  const versionNum = Number(raw)
  if (!Number.isInteger(versionNum) || versionNum <= 0) {
    message.error('版本号需为正整数');
    return null
  }
  return { versionNum, versionTag: `V${versionNum}` }
}

async function buildMainboardZip(versionNum: number): Promise<{ blob: Blob, zipName: string, md5: string }> {
  const zip = new JSZip()
  // 将多个bin直接放在zip根目录，不需要目录
  for (const f of mainboardFiles.value) {
    const arrayBuffer = await f.arrayBuffer()
    zip.file(f.name, arrayBuffer)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const zipName = `Upgrade${versionNum}.zip`
  // 计算MD5（大写）
  const md5 = await OSSUploader.calculateMD5(zipBlob as unknown as File)
  return { blob: zipBlob, zipName, md5 }
}

async function handleSubmit() {
  // 至少需要一个文件
  if (!espFile.value && mainboardFiles.value.length === 0) {
    return message.error('请至少选择 ESP 或 主板 的一个 .bin 文件再提交')
  }

  // 版本号与更新日志为必填
  const v = assertVersion()
  if (!v) return
  if (!updateLog.value.trim()) {
    return message.error('请填写更新日志')
  }

  submitting.value = true
  outputConfig.value = null

  try {

    // 计算 MD5
    const espMd5 = espFile.value ? await OSSUploader.calculateMD5(espFile.value) : null
    let zipInfo: { blob: Blob, zipName: string, md5: string } | null = null
    if (mainboardFiles.value.length > 0) {
      zipInfo = await buildMainboardZip(v.versionNum)
    }

    // 准备批量上传参数
    // 批量上传（始终按数组调用）
    const uploadFiles: Array<File | Blob> = []
    const uploadNames: string[] = []
    const uploadKeys: string[] = []
    const md5s: string[] = []
    const ossBucket = (import.meta.env as any).VITE_OSS_BUCKET;
    if (espFile.value) {
      uploadFiles.push(espFile.value)
      uploadNames.push(espFile.value.name)
      uploadKeys.push(ossBucket)
      md5s.push(espMd5!)
    }
    if (zipInfo) {
      uploadFiles.push(zipInfo.blob)
      uploadNames.push(zipInfo.zipName)
      uploadKeys.push(ossBucket)
      md5s.push(zipInfo.md5.toUpperCase())
    }

    progressMsg.value = '正在上传文件...'
    const result = await OSSUploader.uploadViaServer(
      uploadFiles,
      uploadNames,
      uploadKeys,
      (p) => (progressMsg.value = p.message || ''),
      v.versionNum,
      updateLog.value,
      md5s
    )
    console.log("result",result);
    // 调用后端更新华为云配置，并展示结果
    try {
      progressMsg.value = '正在更新远程配置...'
      
      const rawBase = (import.meta.env as any).VITE_API_BASE_URL;
      const base = rawBase.replace(/\/$/, '');
      const endsWithApi = /\/api$/i.test(base);
      const apiBase = endsWithApi ? base : `${base}/api`;
      const res = await fetch(`${apiBase}/huawei/update-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'device_upgrade_info', content: result })
      })
      const data = await res.json()
      if (data.success) {
        outputConfig.value = { success: true, latest: safeParseJSON(data.data?.latest), data: data.data }
        message.success('华为云配置更新成功')
      } else {
        outputConfig.value = { success: false, error: data.message, data: data.data }
        message.error('华为云配置更新失败')
      }
    } catch (e:any) {
      outputConfig.value = { success: false, error: e?.message || '更新失败', data: e.data }
      message.error('华为云配置更新失败')
    }
  } catch (e: any) {
    console.error(e)
    message.error(`上传失败: ${e?.message || e}`)
  } finally {
    submitting.value = false
    progressMsg.value = ''
  }
}
</script>

<style scoped>
.file-upload { margin-bottom: 24px; }
.card { background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.upload-area { padding: 24px; border: 2px dashed #d9d9d9; border-radius: 8px; cursor: pointer; background: #fafafa; }
.upload-area.dragover { border-color: #1677ff; background: #f0f7ff; }
.upload-content { text-align: center; }
.upload-icon { font-size: 40px; color: #1677ff; margin-bottom: 8px; }
.upload-hint { color: #999; font-size: 12px; }
.file-grid { display: grid; gap: 8px; }
.file-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f7f7f7; border-radius: 6px; }
.file-name { color: #333; }
.actions { display: flex; justify-content: space-between; align-items: center; }
.progress-msg { margin-top: 8px; color: #666; }
.result-json { background: #0b1021; color: #e6f7ff; padding: 12px; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; }
</style> 