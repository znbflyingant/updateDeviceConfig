import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import { execSync } from 'node:child_process'
import pkg from './package.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = Number(env.VITE_DEV_PORT || 3000)
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3001'
  const commitHash = (() => {
    try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'unknown' }
  })()
  const buildTime = new Date().toISOString()

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: true
      }),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false
          })
        ],
        dts: true
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      host: true,
      port: devPort,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            antd: ['ant-design-vue', '@ant-design/icons-vue']
          }
        }
      }
    },
    define: {
      __BUILD_INFO__: JSON.stringify({ appName: pkg.name, version: pkg.version, commit: commitHash, time: buildTime })
    }
  }
})