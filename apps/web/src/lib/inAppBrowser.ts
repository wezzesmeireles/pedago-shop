// In-app browser (webview) detection.
//
// The Instagram / Facebook / TikTok in-app browsers are stripped-down webviews
// that CANNOT save a file via the standard `fetch -> blob -> <a download>` trick
// — the click silently does nothing, so the download "fails" even though auth
// and the file are fine. The only reliable path is to send the user to a real
// browser (Chrome/Safari). We detect the known social webviews conservatively so
// we never block a download that would actually work.

export function detectInAppBrowser(): { inApp: boolean; name: string } {
  if (typeof navigator === 'undefined') return { inApp: false, name: '' }
  const ua = navigator.userAgent || (navigator as any).vendor || ''
  const rules: [RegExp, string][] = [
    [/Instagram/i, 'Instagram'],
    [/FBAN|FBAV|FB_IAB|FBIOS|FBSV/i, 'Facebook'],
    [/Messenger/i, 'Messenger'],
    [/TikTok|musical_ly|BytedanceWebview/i, 'TikTok'],
    [/\bLine\//i, 'LINE'],
    [/Snapchat/i, 'Snapchat'],
    [/Pinterest/i, 'Pinterest'],
    [/Twitter|TwitterAndroid/i, 'Twitter'],
  ]
  for (const [re, name] of rules) if (re.test(ua)) return { inApp: true, name }
  return { inApp: false, name: '' }
}

export function isInAppBrowser(): boolean {
  return detectInAppBrowser().inApp
}

export function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
}

// Android-only escape hatch: bounce the current page to the system default
// browser via an Android intent. Omitting `package=` shows the "Open with"
// chooser instead of requiring Chrome specifically — works on Samsung Internet,
// Xiaomi, etc. iOS has no programmatic escape from an in-app webview.
export function tryOpenInExternalBrowserAndroid(url: string): void {
  const noScheme = url.replace(/^https?:\/\//, '')
  // S.browser_fallback_url ensures a web fallback if no browser handles it
  window.location.href = `intent://${noScheme}#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(url)};end`
}
