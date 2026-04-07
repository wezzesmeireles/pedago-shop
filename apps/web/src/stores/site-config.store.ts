import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import type { SiteConfigData } from '@pedago/shared';
import { DEFAULT_SITE_CONFIG } from '@pedago/shared';

export const useSiteConfigStore = defineStore('siteConfig', () => {
  const config = ref<SiteConfigData>({ ...DEFAULT_SITE_CONFIG });
  const loaded = ref(false);

  async function fetch() {
    try {
      const res = await api.get('/site-config');
      config.value = res.data;
      loaded.value = true;
      applyTheme(res.data);
    } catch {
      applyTheme(DEFAULT_SITE_CONFIG);
    }
  }

  async function update(data: Partial<SiteConfigData>) {
    const res = await api.patch('/site-config', data);
    config.value = res.data;
    applyTheme(res.data);
    return res.data;
  }

  function applyTheme(cfg: SiteConfigData) {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', cfg.primaryColor);
    root.style.setProperty('--color-secondary', cfg.secondaryColor);
    root.style.setProperty('--color-accent', cfg.accentColor);

    // Update favicon
    if (cfg.faviconUrl) {
      const favicon = document.getElementById('favicon') as HTMLLinkElement;
      if (favicon) favicon.href = cfg.faviconUrl;
    }

    // Update page title
    if (cfg.storeName) {
      document.title = cfg.storeName;
    }
  }

  return { config, loaded, fetch, update };
});
