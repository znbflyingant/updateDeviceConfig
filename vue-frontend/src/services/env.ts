import type { FrontendBuildInfo } from '@/types'

export class Env {
  static get apiBase(): string {
    const raw = (import.meta.env as any).VITE_API_BASE_URL || ''
    const base = raw.replace(/\/$/, '')
    return /\/api$/i.test(base) ? base : `${base}/api`
  }

  static get ossBucket(): string {
    return (import.meta.env as any).VITE_OSS_BUCKET
  }

  static get huaweiRcKey(): string | undefined {
    return (import.meta.env as any).VITE_HUAWEI_RC_KEY
  }

  static get updatePrefix(): string {
    const val = (import.meta.env as any).VITE_UPDATE_PREFIX || ''
    return typeof val === 'string' ? val : ''
  }

  static get buildInfo(): FrontendBuildInfo | null {
    try { return (typeof __BUILD_INFO__ !== 'undefined') ? (__BUILD_INFO__ as FrontendBuildInfo) : null } catch { return null }
  }
}


