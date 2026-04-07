export interface SocialLinks {
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
  youtube?: string;
}

export interface SiteConfigData {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  storeName: string;
  storeDescription: string;
  bannerEnabled: boolean;
  bannerImageUrl: string | null;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerCtaText: string;
  bannerCtaLink: string;
  highlightedProductIds: string[];
  highlightedCategoryIds: string[];
  announcementBarText: string | null;
  announcementBarColor: string;
  footerText: string;
  socialLinks: SocialLinks;
  pixMessage: string;
  seoTitle: string;
  seoDescription: string;
  maintenanceMode: boolean;
}

export const DEFAULT_SITE_CONFIG: SiteConfigData = {
  primaryColor: '#7C3AED',
  secondaryColor: '#EC4899',
  accentColor: '#F59E0B',
  logoUrl: null,
  faviconUrl: null,
  storeName: 'sitepedagogico',
  storeDescription: 'Atividades pedagógicas digitais',
  bannerEnabled: true,
  bannerImageUrl: null,
  bannerTitle: 'Atividades Pedagógicas Incríveis!',
  bannerSubtitle: 'Downloads digitais para educadores e pais',
  bannerCtaText: 'Ver Produtos',
  bannerCtaLink: '/catalogo',
  highlightedProductIds: [],
  highlightedCategoryIds: [],
  announcementBarText: null,
  announcementBarColor: '#F59E0B',
  footerText: '© 2026 sitepedagogico. Todos os direitos reservados.',
  socialLinks: {},
  pixMessage: 'Pague via PIX e receba o PDF imediatamente!',
  seoTitle: 'sitepedagogico - Atividades Pedagógicas Digitais',
  seoDescription: 'Compre atividades pedagógicas digitais em PDF. Entrega automática após o pagamento.',
  maintenanceMode: false,
};
