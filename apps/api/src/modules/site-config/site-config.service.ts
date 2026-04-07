import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SITE_CONFIG, SiteConfigData } from '@pedago/shared';

@Injectable()
export class SiteConfigService {
  constructor(private prisma: PrismaService) {}

  async get(): Promise<SiteConfigData> {
    const config = await this.prisma.siteConfig.findUnique({ where: { key: 'global' } });
    if (!config) return DEFAULT_SITE_CONFIG;
    return { ...DEFAULT_SITE_CONFIG, ...(config.value as any) };
  }

  async update(data: Partial<SiteConfigData>, adminId: string): Promise<SiteConfigData> {
    const current = await this.get();
    const merged = { ...current, ...data };

    await this.prisma.siteConfig.upsert({
      where: { key: 'global' },
      update: { value: merged as any, updatedByAdminId: adminId },
      create: { key: 'global', value: merged as any, updatedByAdminId: adminId },
    });

    return merged;
  }
}
