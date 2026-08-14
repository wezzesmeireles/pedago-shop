import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authenticatedHeaders, publicApiUrl } from '@/lib/public-api';
import type { SiteConfigData } from '@sitepedagogico/shared';
import { DEFAULT_SITE_CONFIG } from '@sitepedagogico/shared';

const CACHE_KEY = 'sp_site_cfg_v1';

function readCache(): SiteConfigData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(data: SiteConfigData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

function mergeConfig(data: Partial<SiteConfigData>): SiteConfigData {
  const merged = { ...DEFAULT_SITE_CONFIG, ...data };
  if (!merged.banners || merged.banners.length === 0) {
    merged.banners = DEFAULT_SITE_CONFIG.banners;
  }
  return merged;
}

async function fetchFromServer(admin = false): Promise<SiteConfigData | null> {
  const response = await fetch(publicApiUrl('/api/site-config'), {
    headers: admin ? await authenticatedHeaders() : undefined,
  });
  if (!response.ok) throw new Error(`Configuração indisponível (${response.status})`);
  return response.json();
}

async function saveConfig(config: object) {
  const response = await fetch(publicApiUrl('/api/site-config'), {
    method: 'PUT',
    headers: await authenticatedHeaders(),
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error(`Não foi possível salvar (${response.status})`);
  return response.json();
}

export const useSiteConfigStore = defineStore('siteConfig', () => {
  const config = ref<SiteConfigData>({ ...DEFAULT_SITE_CONFIG });
  const loaded = ref(false);

  async function fetch() {
    // 1. Cache → renderização instantânea em revisitas
    const cached = readCache();
    if (cached) {
      config.value = mergeConfig(cached);
      applyTheme(config.value);
      loaded.value = true;
    }

    // 2. Appwrite → atualiza em background (first visit bloqueia até ter dados)
    try {
      const data = await fetchFromServer();
      if (data) {
        const merged = mergeConfig(data);
        config.value = merged;
        applyTheme(merged);
        writeCache(merged);
      }
    } catch {
      if (!cached) applyTheme(DEFAULT_SITE_CONFIG);
    } finally {
      loaded.value = true;
    }
  }

  async function update(data: Partial<SiteConfigData>) {
    const merged = { ...config.value, ...data };
    const saved = mergeConfig(await saveConfig(merged));
    config.value = saved;
    applyTheme(saved);
    writeCache(saved);
    return saved;
  }

  async function fetchPrivate() {
    const data = await fetchFromServer(true);
    if (!data) return null;
    return data;
  }

  function applyTheme(cfg: SiteConfigData) {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', cfg.primaryColor);
    root.style.setProperty('--color-secondary', cfg.secondaryColor);
    root.style.setProperty('--color-accent', cfg.accentColor);
    if (cfg.faviconUrl) {
      const favicon = document.getElementById('favicon') as HTMLLinkElement;
      if (favicon) favicon.href = cfg.faviconUrl;
    }
    if (cfg.storeName) document.title = cfg.storeName;
  }

  return { config, loaded, fetch, fetchPrivate, update };
});
