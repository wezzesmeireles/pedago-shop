const apiOrigin = (() => {
  if (typeof window === 'undefined') return '';
  // Native mobile builds do not have a Vercel server alongside the app.
  // Local web development stays same-origin and is proxied by Vite, avoiding CORS.
  if (import.meta.env.VITE_TARGET === 'mobile') {
    return 'https://www.sitepedagogico.com';
  }
  return '';
})();

export function publicApiUrl(path: string) {
  return `${apiOrigin}${path}`;
}

export async function authenticatedHeaders() {
  // Importação tardia mantém os utilitários públicos independentes da
  // configuração do Appwrite e evita inicializar o SDK em rotas que não usam login.
  const { account } = await import('./appwrite');
  const { jwt } = await account.createJWT();
  return { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };
}

let catalogPromise: Promise<{ products: any[]; categories: any[] }> | null = null;

export function fetchPublicCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch(publicApiUrl('/api/catalog'))
      .then(async (response) => {
        if (!response.ok) throw new Error(`Catálogo indisponível (${response.status})`);
        return response.json();
      })
      .catch((error) => {
        catalogPromise = null;
        throw error;
      });
  }
  return catalogPromise;
}

