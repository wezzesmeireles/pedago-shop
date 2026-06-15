import { defineStore } from 'pinia';
import { ref } from 'vue';
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
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

async function fetchFromAppwrite(): Promise<SiteConfigData | null> {
  const doc = await databases.getDocument(DB_ID, COLLECTIONS.SITE_CONFIG, 'global');
  const raw = typeof doc.value === 'string' ? JSON.parse(doc.value) : doc.value;
  return raw;
}

async function saveConfig(config: object) {
  const value = JSON.stringify(config);
  const now = new Date().toISOString();
  try {
    await databases.updateDocument(DB_ID, COLLECTIONS.SITE_CONFIG, 'global', { value, updatedAt: now });
  } catch (err: any) {
    if (err.code === 404) {
      await databases.createDocument(DB_ID, COLLECTIONS.SITE_CONFIG, 'global', { key: 'global', value, updatedAt: now });
    } else {
      throw err;
    }
  }
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
      const data = await fetchFromAppwrite();
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
    await saveConfig(merged);
    config.value = merged;
    applyTheme(merged);
    writeCache(merged);
    return merged;
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

  return { config, loaded, fetch, update };
});
