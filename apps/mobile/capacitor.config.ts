import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sitepedagogico.app',
  appName: 'Site Pedagógico',
  // Assets vêm do build mobile do apps/web (base relativa).
  webDir: '../web/dist',
  android: {
    // Embute os assets (não carrega URL remota) — é um app de verdade, não um
    // atalho pra site. Importante pra aprovação na Play.
    allowMixedContent: false,
  },
};

export default config;
