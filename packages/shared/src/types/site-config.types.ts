export interface SocialLinks {
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
}

export interface BannerSlide {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
}

export interface SiteConfigData {
  banners: BannerSlide[];
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
  mercadoPagoAccessToken: string | null;
  mercadoPagoWebhookSecret: string | null;
  mercadoPagoPixKey: string | null;
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
  banners: [
    {
      title: 'FAÇA SUA COMPRA!',
      subtitle: 'Receba pelo email e no WhatsApp imediatamente',
      imageUrl: 'https://picsum.photos/seed/pedagogo1/1600/600',
      ctaText: 'Ver Atividades',
      ctaLink: '/catalogo',
    },
    {
      title: 'Atividades Pedagógicas Incríveis!',
      subtitle: 'Downloads digitais para educadores e pais',
      imageUrl: 'https://picsum.photos/seed/pedagogo2/1600/600',
      ctaText: 'Explorar Catálogo',
      ctaLink: '/catalogo',
    },
    {
      title: 'Entrega Automática!',
      subtitle: 'Pague via PIX e receba o PDF na hora',
      imageUrl: 'https://picsum.photos/seed/pedagogo3/1600/600',
      ctaText: 'Comprar Agora',
      ctaLink: '/catalogo',
    },
  ],
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
  mercadoPagoAccessToken: null,
  mercadoPagoWebhookSecret: null,
  mercadoPagoPixKey: null,
};
