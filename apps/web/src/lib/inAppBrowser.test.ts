import { describe, expect, it } from 'vitest';
import { detectInAppBrowser } from './inAppBrowser';

describe('detectInAppBrowser', () => {
  it('detecta o navegador interno do Instagram', () => {
    const result = detectInAppBrowser(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Instagram 320.0.0.0.0',
    );
    expect(result).toEqual({ inApp: true, name: 'Instagram' });
  });

  it('detecta o WebView do Instagram no Android', () => {
    const result = detectInAppBrowser(
      'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36 Instagram 334.0.0.0.91 Android',
    );
    expect(result).toEqual({ inApp: true, name: 'Instagram' });
  });

  it('não bloqueia Safari e Chrome comuns', () => {
    expect(detectInAppBrowser('Mozilla/5.0 Chrome/124.0 Mobile Safari/537.36').inApp).toBe(false);
    expect(detectInAppBrowser('Mozilla/5.0 Version/17.0 Mobile Safari/604.1').inApp).toBe(false);
  });
});
