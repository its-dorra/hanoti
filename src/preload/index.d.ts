import { ElectronAPI } from '@electron-toolkit/preload'

interface RendererAPI {
  openPdf: (payload: { base64: string; filename: string }) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RendererAPI
  }
}
