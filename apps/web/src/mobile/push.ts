import type { Router } from 'vue-router'
import { account } from '@/lib/appwrite'

const FCM_PROVIDER_ID = 'fcm-admin'

let listenersReady = false
let currentUserId: string | null = null

let PushNotifications: any = null;
try {
  // Tentativa segura de carregar o plugin nativo de push
  import('@capacitor/push-notifications').then(m => {
    PushNotifications = m.PushNotifications
    // Re-registra listeners agora que o plugin está disponível
    if (listenersReady) {
      listenersReady = false
      ensureListeners()
    }
  }).catch(() => {})
} catch {}

function ensureListeners() {
  if (listenersReady) return
  if (!PushNotifications) { listenersReady = true; return }
  listenersReady = true

  PushNotifications.addListener('registration', async (token: any) => {
    if (!currentUserId) return
    const targetId = ('fcm-' + currentUserId).slice(0, 36)
    try {
      await account.createPushTarget(targetId, token.value, FCM_PROVIDER_ID)
    } catch (e: any) {
      if (e?.code === 409) {
        try { await account.updatePushTarget(targetId, token.value) } catch { /* ignore */ }
      } else {
        console.error('push createPushTarget falhou:', e?.message ?? e)
      }
    }
  }).catch(() => {})

  PushNotifications.addListener('registrationError', (err: any) => {
    console.error('push registrationError:', err)
  }).catch(() => {})
}

export async function registerPush(userId: string): Promise<void> {
  if (!PushNotifications) return
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

export function setupPushTap(router: Router): void {
  if (!PushNotifications) return
  PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
    const route = (action.notification?.data?.route as string) || '/'
    try { router.push(route) } catch { /* ignore */ }
  }).catch(() => {})
}
