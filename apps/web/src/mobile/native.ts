import type { Router } from 'vue-router'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { setupPushTap } from './push'

// Inicializa comportamentos nativos da casca Capacitor. Chamado só no modo mobile.
export async function initNative(router: Router): Promise<void> {
  // Toque numa notificação push → navega (ex.: /admin/pedidos).
  setupPushTap(router)

  // Botão "voltar" do Android: volta no histórico do vue-router; na raiz, sai.
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) {
      router.back()
    } else {
      CapApp.exitApp()
    }
  })

  // Status bar legível sobre o tema claro da loja.
  try {
    await StatusBar.setStyle({ style: Style.Light })
  } catch { /* status bar pode não existir no emulador; ignorar */ }

  // Esconde o splash quando a UI já montou.
  try {
    await SplashScreen.hide()
  } catch { /* ignorar */ }
}

// Abre uma URL externa (checkout do cartão MP) no navegador in-app, mantendo o
// app vivo por trás — o retorno é confirmado por polling do reconcile-orders.
export async function openExternal(url: string): Promise<void> {
  await Browser.open({ url })
}

// True quando rodando dentro da casca nativa (build mobile).
export const isMobile = import.meta.env.VITE_TARGET === 'mobile'
