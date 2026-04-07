import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalOrders,
      monthOrders,
      pendingOrders,
      totalUsers,
      topProducts,
      recentOrders,
    ] = await this.prisma.$transaction([
      this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
      this.prisma.order.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      this.prisma.order.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfLastMonth, lt: startOfMonth } }, _sum: { totalAmount: true } }),
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.order.count({ where: { status: 'PAID', createdAt: { gte: startOfMonth } } }),
      this.prisma.order.count({ where: { status: 'AWAITING_PAYMENT' } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { salesCount: 'desc' },
        take: 5,
        select: { id: true, name: true, salesCount: true, coverImageUrl: true, price: true },
      }),
      this.prisma.order.findMany({
        where: { status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { productName: true } },
        },
      }),
    ]);

    return {
      revenue: {
        total: Number(totalRevenue._sum.totalAmount ?? 0),
        month: Number(monthRevenue._sum.totalAmount ?? 0),
        lastMonth: Number(lastMonthRevenue._sum.totalAmount ?? 0),
      },
      orders: { total: totalOrders, month: monthOrders, pending: pendingOrders },
      users: { total: totalUsers },
      topProducts,
      recentOrders,
    };
  }

  async getOrders(page: number, limit: number, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, avatarUrl: true } },
          items: { select: { productName: true, quantity: true, unitPrice: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: { select: { id: true, name: true, coverImageUrl: true } },
            downloadTokens: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    return this.prisma.order.update({ where: { id }, data: { status: status as any } });
  }

  async getUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, phone: true, role: true, isActive: true,
          avatarUrl: true, createdAt: true,
          _count: { select: { orders: { where: { status: 'PAID' } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getUserOrders(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { select: { productName: true, quantity: true, unitPrice: true } } },
    });

    return { user, orders };
  }

  async updateUser(id: string, data: { role?: string; isActive?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.prisma.user.update({ where: { id }, data: data as any });
  }

  async resetDownloadToken(tokenId: string) {
    const token = await this.prisma.downloadToken.findUnique({ where: { id: tokenId } });
    if (!token) throw new NotFoundException('Token não encontrado.');
    return this.prisma.downloadToken.update({
      where: { id: tokenId },
      data: { downloadCount: 0, revokedAt: null },
    });
  }

  async getIntegrations() {
    const config = await this.prisma.siteConfig.findUnique({ where: { key: 'integrations' } });
    return (config?.value as any) ?? {
      mercadoPagoAccessToken: '',
      mercadoPagoPixKey: '',
      mercadoPagoWebhookSecret: '',
      googleClientId: '',
      googleClientSecret: '',
      googleCallbackUrl: '',
    };
  }

  async setIntegrations(data: Record<string, string>, adminId: string) {
    await this.prisma.siteConfig.upsert({
      where: { key: 'integrations' },
      update: { value: data as any, updatedByAdminId: adminId },
      create: { key: 'integrations', value: data as any, updatedByAdminId: adminId },
    });
    return data;
  }
}
