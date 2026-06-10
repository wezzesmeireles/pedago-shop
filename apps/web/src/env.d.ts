/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_DATABASE_ID: string
  readonly VITE_HCAPTCHA_SITE_KEY: string
  // 'mobile' no build do app Capacitor; undefined no build web.
  readonly VITE_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
