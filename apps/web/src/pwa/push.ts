import { account } from '@/lib/appwrite';

const FCM_PROVIDER_ID = import.meta.env.VITE_APPWRITE_FCM_PROVIDER_ID || 'fcm-admin';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
let foregroundListenerReady = false;

export function isWebPushConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    vapidKey,
  );
}

export function canUseWebPush(): boolean {
  return (
    import.meta.env.VITE_TARGET !== 'mobile' &&
    isWebPushConfigured() &&
    'serviceWorker' in navigator &&
    'Notification' in window
  );
}

async function targetIdForToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `web-${hash.slice(0, 32)}`;
}

export async function enableWebPush(userId: string): Promise<'enabled' | 'denied' | 'unsupported'> {
  if (!canUseWebPush()) return 'unsupported';

  const supported = await import('firebase/messaging').then((module) => module.isSupported());
  if (!supported) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const registration = await navigator.serviceWorker.ready;
  const [{ initializeApp, getApps }, { getMessaging, getToken, onMessage }] = await Promise.all([
    import('firebase/app'),
    import('firebase/messaging'),
  ]);

  const appName = 'site-pedagogico-web-push';
  const firebaseApp = getApps().find((app) => app.name === appName) || initializeApp(firebaseConfig, appName);
  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error('O navegador não retornou um token de notificação.');

  const targetId = await targetIdForToken(token);
  try {
    await account.createPushTarget(targetId, token, FCM_PROVIDER_ID);
  } catch (error: any) {
    if (error?.code === 409) {
      await account.updatePushTarget(targetId, token);
    } else {
      throw error;
    }
  }

  if (!foregroundListenerReady) {
    foregroundListenerReady = true;
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Site Pedagógico';
      const body = payload.notification?.body || payload.data?.body || 'Você tem uma novidade.';
      const route = payload.data?.route?.startsWith('/') ? payload.data.route : '/';
      registration.showNotification(title, {
        body,
        icon: '/favicon-192.png',
        badge: '/favicon-192.png',
        tag: payload.data?.tag || payload.messageId,
        data: { route },
      }).catch(() => {});
    });
  }

  localStorage.setItem('pedago-web-push-enabled', userId);
  return 'enabled';
}
