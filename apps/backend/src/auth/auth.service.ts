import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRISMA } from '../database/database.module';

@Injectable()
export class AuthService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async hasAdmin(): Promise<{ hasAdmin: boolean }> {
    const count = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    return { hasAdmin: count > 0 };
  }

  async promoteFirstAdmin(userId: string): Promise<void> {
    const { hasAdmin } = await this.hasAdmin();
    if (hasAdmin) {
      const { ForbiddenException } = await import('@nestjs/common');
      throw new ForbiddenException('Já existe um administrador cadastrado.');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
  }
}
