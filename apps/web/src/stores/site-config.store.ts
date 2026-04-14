import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import type { SiteConfigData } from '@sitepedagogico/shared';
import { DEFAULT_SITE_CONFIG } from '@sitepedagogico/shared';

export const useSiteConfigStore = defineStore('siteConfig', () => {
  const config = ref<SiteConfigData>({ ...DEFAULT_SITE_CONFIG });
  const loaded = ref(false);

  async function fetch() {
    try {
      const { data } = await supabase.from('site_config').select('value').eq('key', 'global').single();
      if (data?.value) {
        const merged = { ...DEFAULT_SITE_CONFIG, ...(data.value as any) };
        // If DB has no banners or empty banners, keep defaults
        if (!merged.banners || merged.banners.length === 0) {
          merged.banners = DEFAULT_SITE_CONFIG.banners;
        }
        config.value = merged;
      }
      loaded.value = true;
      applyTheme(config.value);
    } catch {
      applyTheme(DEFAULT_SITE_CONFIG);
    }
  }

  async function update(data: Partial<SiteConfigData>) {
    const merged = { ...config.value, ...data };
    await supabase.from('site_config').upsert(
      { key: 'global', value: merged as any, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );
    config.value = merged;
    applyTheme(merged);
    return merged;
  }

  function applyTheme(cfg: SiteConfigData) {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', cfg.primaryColor);
    root.style.setProperty('--color-secondary', cfg.secondaryColor);
    root.style.setProperty('--color-accent', cfg.accentColor);
    const faviconHref = cfg.faviconUrl || cfg.logoUrl;
    if (faviconHref) {
      const favicon = document.getElementById('favicon') as HTMLLinkElement;
      if (favicon) favicon.href = faviconHref;
    }
    if (cfg.storeName) document.title = cfg.storeName;
  }

  return { config, loaded, fetch, update };
});
