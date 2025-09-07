#!/usr/bin/env node
import { stat, mkdir, cp, access } from 'node:fs/promises'
import { constants as FS } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

async function exists(p) {
  try { await access(p, FS.F_OK); return true } catch { return false }
}

async function main() {
  const target = process.env.DEPLOY_DIST_PATH || process.env.FRONTEND_DEPLOY_PATH
  if (!target) {
    console.error('❌ 未设置目标目录。请通过环境变量 DEPLOY_DIST_PATH（或 FRONTEND_DEPLOY_PATH）提供目标路径')
    process.exit(1)
  }

  const distDir = path.join(root, 'dist')
  if (!(await exists(distDir))) {
    console.error('❌ 未找到 dist 目录，请先执行：npm run build')
    process.exit(1)
  }

  const targetDir = path.resolve(target)
  await mkdir(targetDir, { recursive: true })

  // 复制 dist 内容到目标目录（不删除目标目录既有文件）
  await cp(distDir, targetDir, { recursive: true })

  const s = await stat(targetDir)
  if (!s.isDirectory()) {
    console.error('❌ 目标路径不是目录:', targetDir)
    process.exit(1)
  }

  console.log('✅ 已拷贝构建产物到:', targetDir)
}

main().catch(err => {
  console.error('❌ 拷贝失败:', err?.message || err)
  process.exit(1)
})


