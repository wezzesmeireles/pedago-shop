import type { Router } from 'vue-router'
import { PushNotifications } from '@capacitor/push-notifications'
import { account } from '@/lib/appwrite'

// Provider FCM criado no Appwrite Messaging.
const FCM_PROVIDER_ID = 'fcm-admin'

let listenersReady = false
let currentUserId: string | null = null

// Registra os listeners de token uma única vez. Quando o FCM entrega o token do
// aparelho, gravamos como push target do usuário admin atual (id determinístico
// por usuário → um target por aparelho/usuário, sempre com o token mais recente).
function ensureListeners() {
  if (listenersReady) return
  listenersReady = true

  PushNotifications.addListener('registration', async (token) => {
    if (!currentUserId) return
    const targetId = ('fcm-' + currentUserId).slice(0, 36)
    try {
      await account.createPushTarget(targetId, token.value, FCM_PROVIDER_ID)
    } catch (e: any) {
      // 409 = target já existe → atualiza com o token novo.
      if (e?.code === 409) {
        try { await account.updatePushTarget(targetId, token.value) } catch { /* ignore */ }
      } else {
        console.error('push createPushTarget falhou:', e?.message ?? e)
      }
    }
  })

  PushNotifications.addListener('registrationError', (err) => {
    console.error('push registrationError:', err)
  })
}

// Chamar quando um ADMIN loga no app. Pede permissão (Android 13+ runtime),
// registra no FCM e grava o target. Sem permissão → segue sem push (Telegram cobre).
export async function registerAdminPush(userId: string): Promise<void> {
  try {
    currentUserId = userId
    ensureListeners()
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') return
    await PushNotifications.register()
  } catch (e: any) {
    console.error('registerAdminPush falhou:', e?.message ?? e)
  }
}

// Liga o toque na notificação à navegação. Chamar uma vez no init nativo.
export function setupPushTap(router: Router): void {
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const route = (action.notification?.data?.route as string) || '/admin/pedidos'
    try { router.push(route) } catch { /* ignore */ }
  })
}
