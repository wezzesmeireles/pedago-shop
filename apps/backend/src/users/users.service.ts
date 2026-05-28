import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRISMA } from '../database/database.module';

@Injectable()
export class UsersService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, phone: true,
        avatarUrl: true, role: true, isActive: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async updateMe(userId: string, data: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
  }) {
    if (data.phone) {
      const digits = data.phone.replace(/\D/g, '');
      if (digits.length < 10) throw new BadRequestException('Número de WhatsApp inválido.');
      data.phone = digits;
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, name: true, phone: true,
        avatarUrl: true, role: true,
      },
    });
  }

  // ── Admin ──────────────────────────────────────────────────────
  async listAll(page = 1, limit = 20, search?: string) {
    const where = search
      ? { OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ]}
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, name: true, phone: true,
          avatarUrl: true, role: true, isActive: true, createdAt: true,
          _count: { select: { orders: { where: { status: 'PAID' } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map(u => ({ ...u, ordersCount: u._count.orders })),
      total,
      page,
      limit,
    };
  }

  async getUserWithOrders(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { orderItems: { select: { productName: true, quantity: true, unitPrice: true } } },
    });

    return { user, orders };
  }

  async getUserOrders(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { orderItems: { select: { productName: true, quantity: true, unitPrice: true } } },
    });
    return orders.map(o => ({ ...o, items: o.orderItems }));
  }

  async updatePhone(userId: string, phone: string) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) throw new BadRequestException('Número inválido.');
    return this.prisma.user.update({
      where: { id: userId },
      data: { phone: digits },
      select: { id: true, phone: true },
    });
  }
}
