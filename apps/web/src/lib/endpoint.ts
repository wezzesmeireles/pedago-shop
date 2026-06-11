// Decide qual URL base do Appwrite usar.
//
// Web: o endpoint configurado só fornece o path (/v1); trocamos o host pelo
// origin atual (www vs não-www vs localhost) pra a chamada ser SEMPRE de mesma
// origem — o proxy Vercel/Vite encaminha /v1 pro Appwrite e fura o firewall de
// escolas. Cross-origin seria bloqueado por CORS (página em branco).
//
// Mobile (Capacitor): o origin é https://localhost (inexistente como API), então
// NÃO trocamos o host — usamos o endpoint absoluto, que continua passando pelo
// proxy anti-firewall em www.sitepedagogico.com.
export function resolveEndpoint(opts: {
  configured: string;
  origin: string | undefined;
  isMobile: boolean;
}): string {
  const { configured, origin, isMobile } = opts;
  if (isMobile || !origin) return configured;
  const path = configured.replace(/^https?:\/\/[^/]+/, '') || '/v1';
  return origin + path;
}

// Origin público do site, pra montar links que VOLTAM por fora do app (e-mail de
// recuperação de senha, compartilhamento). No app `window.location.origin` é
// `https://localhost` (inexistente), então usamos o domínio real do site.
export const webOrigin =
  import.meta.env.VITE_TARGET === 'mobile'
    ? 'https://www.sitepedagogico.com'
    : typeof window !== 'undefined'
      ? window.location.origin
      : 'https://www.sitepedagogico.com';
