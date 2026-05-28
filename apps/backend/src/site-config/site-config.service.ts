import { Injectable, Inject } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PRISMA } from '../database/database.module';

@Injectable()
export class SiteConfigService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async get() {
    const row = await this.prisma.siteConfig.findUnique({ where: { key: 'global' } });
    return (row?.value as object) ?? {};
  }

  async update(data: Record<string, unknown>) {
    const current = await this.get();
    const merged = { ...(current as object), ...data };
    const row = await this.prisma.siteConfig.upsert({
      where: { key: 'global' },
      update: { value: merged as Prisma.InputJsonValue },
      create: { key: 'global', value: merged as Prisma.InputJsonValue },
    });
    return row.value;
  }
}
