#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises'
import { constants as FS_CONSTANTS } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

function parseEnv(content = '') {
  const result = {}
  const lines = content.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

async function main() {
  let envVars = {}
  const envFile = path.join(projectRoot, '.env.')
  try {
    await access(envFile, FS_CONSTANTS.F_OK)
    const content = await readFile(envFile, 'utf8')
    envVars = parseEnv(content)
  } catch {
    // ignore if file not found
  }

  // 目标目录：优先使用进程环境变量，其次使用 .env. 中的配置
  const targetDir = process.env.PARAMS_EXPORT_PATH
    || process.env.FRONTEND_PARAMS_PATH
    || envVars.PARAMS_EXPORT_PATH
    || envVars.FRONTEND_PARAMS_PATH

  if (!targetDir) {
    console.error('❌ 未设置导出目录。请通过以下任一方式提供：')
    console.error('   - 环境变量 PARAMS_EXPORT_PATH=/your/path')
    console.error('   - 环境变量 FRONTEND_PARAMS_PATH=/your/path')
    console.error('   - .env. 中设置 PARAMS_EXPORT_PATH=/your/path 或 FRONTEND_PARAMS_PATH=/your/path')
    process.exit(1)
  }

  // 仅导出 VITE_ 前缀的变量
  const exported = Object.fromEntries(
    Object.entries(envVars).filter(([k]) => k.startsWith('VITE_'))
  )

  const outDir = path.resolve(targetDir)
  await mkdir(outDir, { recursive: true })
  const outJson = path.join(outDir, 'frontend-params.json')
  const payload = {
    generatedAt: new Date().toISOString(),
    params: exported
  }
  await writeFile(outJson, JSON.stringify(payload, null, 2), 'utf8')

  // 额外复制一份 .env 以便人工查看（如存在）
  try {
    await access(envFile, FS_CONSTANTS.F_OK)
    await copyFile(envFile, path.join(outDir, '.env.frontend'))
  } catch {
    // skip if not exists
  }

  console.log(`✅ 已导出前端参数到: ${outJson}`)
}

main().catch((err) => {
  console.error('❌ 导出失败:', err?.message || err)
  process.exit(1)
})


