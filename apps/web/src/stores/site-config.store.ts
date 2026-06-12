import { defineStore } from 'pinia';
import { ref } from 'vue';
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import type { SiteConfigData } from '@sitepedagogico/shared';
import { DEFAULT_SITE_CONFIG } from '@sitepedagogico/shared';

async function fetchConfig(): Promise<SiteConfigData | null> {
  const doc = await databases.getDocument(DB_ID, COLLECTIONS.SITE_CONFIG, 'global');
  return typeof doc.value === 'string' ? JSON.parse(doc.value) : doc.value;
}

async function saveConfig(config: object) {
  const value = JSON.stringify(config);
  const now = new Date().toISOString();
  try {
    await databases.updateDocument(DB_ID, COLLECTIONS.SITE_CONFIG, 'global', {
      value,
      updatedAt: now,
    });
  } catch (err: any) {
    if (err.code === 404) {
      await databases.createDocument(DB_ID, COLLECTIONS.SITE_CONFIG, 'global', {
        key: 'global',
        value,
        updatedAt: now,
      });
    } else {
      throw err;
    }
  }
}

export const useSiteConfigStore = defineStore('siteConfig', () => {
  const config = ref<SiteConfigData>({ ...DEFAULT_SITE_CONFIG });
  const loaded = ref(false);

  async function fetch() {
    try {
      const data = await fetchConfig();
      if (data) {
        const merged = { ...DEFAULT_SITE_CONFIG, ...data };
        // If DB has no banners or empty banners, keep defaults
        if (!merged.banners || merged.banners.length === 0) {
          merged.banners = DEFAULT_SITE_CONFIG.banners;
        }
        config.value = merged;
      }
      applyTheme(config.value);
    } catch {
      applyTheme(DEFAULT_SITE_CONFIG);
    } finally {
      loaded.value = true;
    }
  }

  async function update(data: Partial<SiteConfigData>) {
    const merged = { ...config.value, ...data };
    await saveConfig(merged);
    config.value = merged;
    applyTheme(merged);
    return merged;
  }

  function applyTheme(cfg: SiteConfigData) {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', cfg.primaryColor);
    root.style.setProperty('--color-secondary', cfg.secondaryColor);
    root.style.setProperty('--color-accent', cfg.accentColor);
    // Só troca o favicon se o admin definir um favicon PRÓPRIO. Sem isso,
    // mantém o favicon estático (o escudo da marca em /favicon.ico) — a logo
    // wordmark fica ilegível como favicon e antes sobrescrevia o ícone bom.
    if (cfg.faviconUrl) {
      const favicon = document.getElementById('favicon') as HTMLLinkElement;
      if (favicon) favicon.href = cfg.faviconUrl;
    }
    if (cfg.storeName) document.title = cfg.storeName;
  }

  return { config, loaded, fetch, update };
});
