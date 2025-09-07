/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_OSS_BUCKET: string
  readonly VITE_HUAWEI_RC_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 

declare const __BUILD_INFO__: {
  appName: string
  version: string
  commit: string
  time: string
}