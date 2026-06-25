const origFetch = window.fetch.bind(window)
let nativeFetch: ((input: any, init?: any) => Promise<Response>) | null = null

export async function patchFetch() {
  console.log('[fetch-override] patching fetch...')
  try {
    const mod = await import('@tauri-apps/plugin-http')
    nativeFetch = mod.fetch as typeof window.fetch
    // Test: try native fetch
    try {
      await nativeFetch('https://www.sitepedagogico.com/v1/account', { method: 'OPTIONS' })
      console.log('[fetch-override] native fetch test OK')
    } catch (e) {
      console.error('[fetch-override] native fetch test FAILED:', e)
    }
    console.log('[fetch-override] native fetch loaded successfully')
  } catch (e) {
    console.error('[fetch-override] failed to load @tauri-apps/plugin-http:', e)
    nativeFetch = null
  }
}

window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  if (nativeFetch) {
    try {
      // Build a plain object for headers so we can inject Origin without hitting
      // the browser's "forbidden header" restriction (Headers.set('Origin') is a no-op in WebView).
      const headersObj: Record<string, string> = {}
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((v, k) => { headersObj[k] = v })
        } else if (Array.isArray(init.headers)) {
          for (const [k, v] of init.headers) headersObj[k] = v
        } else {
          Object.assign(headersObj, init.headers)
        }
      }
      // Inject Origin — plain object bypasses the WebView Headers restriction;
      // Tauri's native HTTP passes it directly to Rust/reqwest with no filtering.
      headersObj['Origin'] = 'https://www.sitepedagogico.com'
      const result = nativeFetch(input as any, { ...init, headers: headersObj } as any)
      console.log('[fetch-override] using native fetch for:', typeof input === 'string' ? input : (input as Request).url)
      return result
    } catch (e) {
      console.warn('[fetch-override] native fetch threw, fallback to orig:', e)
    }
  }
  return origFetch(input, init)
}) as typeof window.fetch
