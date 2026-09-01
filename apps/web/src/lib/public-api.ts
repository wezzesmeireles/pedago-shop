import { account } from './appwrite';

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

