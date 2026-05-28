import {
  Injectable, Inject, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PRISMA } from '../database/database.module';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly config: ConfigService,
  ) {}

  // ── Criar pedido ──────────────────────────────────────────────
  async create(userId: string, body: {
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: 'PIX' | 'CREDIT_CARD' | 'FREE';
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });
    if (!user?.phone) throw new BadRequestException('Cadastre seu WhatsApp antes de finalizar.');

    const productIds = body.items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, deletedAt: null },
      select: { id: true, name: true, price: true, deliveryLink: true, deliveryType: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos não estão disponíveis.');
    }

    const productMap = new Map(products.map(p => [p.id, p]));
    const round = (v: number) => Math.round(Number(v) * 100) / 100;
    const totalAmount = round(body.items.reduce((sum, item) => {
      return sum + Number(productMap.get(item.productId)!.price) * item.quantity;
    }, 0));

    const count = await this.prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
    const isFree = body.paymentMethod === 'FREE' || totalAmount === 0;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: isFree ? OrderStatus.PAID : OrderStatus.AWAITING_PAYMENT,
        totalAmount,
        paymentMethod: isFree ? null : body.paymentMethod as any,
        paidAt: isFree ? new Date() : null,
        expiresAt: isFree ? null : new Date(Date.now() + 30 * 60_000),
        customerEmail: user.email,
        customerName: user.name,
        orderItems: {
          create: body.items.map(item => {
            const p = productMap.get(item.productId)!;
            return { productId: item.productId, productName: p.name, unitPrice: p.price, quantity: item.quantity };
          }),
        },
      },
      include: { orderItems: true },
    });

    if (isFree) {
      await this.createDownloadTokens(order.id, order.orderItems, productMap);
      return { order, payment: { type: 'FREE' } };
    }

    const cfg = await this.getSiteConfig();
    const accessToken = (cfg as any)?.mercadoPagoAccessToken?.trim()
      || this.config.get<string>('mercadoPago.accessToken') || '';

    if (!accessToken) throw new BadRequestException('Gateway de pagamento não configurado.');

    if (body.paymentMethod === 'PIX') {
      return this.createPixPayment(order, user, body.items, products, accessToken);
    }
    return this.createCardPayment(order, user, body.items, products, accessToken);
  }

  // ── Listar pedidos do usuário ─────────────────────────────────
  async findByUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          select: {
            id: true,
            productName: true,
            unitPrice: true,
            quantity: true,
            product: { select: { coverImageUrl: true, slug: true } },
          },
        },
      },
    });
    return orders.map(o => ({ ...o, items: o.orderItems }));
  }

  async findById(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { orderItems: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    return order;
  }

  // Admins podem ver qualquer pedido; usuários apenas o próprio
  async findByIdForUser(id: string, user: { id: string; role: string }) {
    if (user.role === 'ADMIN') {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: { orderItems: true },
      });
      if (!order) throw new NotFoundException('Pedido não encontrado.');
      return { ...order, items: order.orderItems };
    }
    const order = await this.findById(id, user.id);
    return { ...order, items: (order as any).orderItems ?? [] };
  }

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: status as any },
    });
    return order;
  }

  async reconcileOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { product: { select: { deliveryLink: true } } } } },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    if (!order.mpPaymentId) return { message: 'Pedido sem referência de pagamento MP.' };

    const cfg = await this.getSiteConfig();
    const accessToken = (cfg as any)?.mercadoPagoAccessToken?.trim()
      || this.config.get<string>('mercadoPago.accessToken') || '';
    if (!accessToken) return { message: 'Token MP não configurado.' };

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${order.mpPaymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return { message: 'Falha ao consultar MP.' };
    const data = await res.json();

    if (data.status === 'approved') {
      await this.markAsPaid(order.id, String(order.mpPaymentId), data.status);
      return { message: 'Pedido marcado como pago.' };
    }
    return { message: `Status MP: ${data.status}` };
  }

  async reconcileAll() {
    const { OrderStatus } = await import('@prisma/client');
    const pending = await this.prisma.order.findMany({
      where: { status: OrderStatus.AWAITING_PAYMENT, mpPaymentId: { not: null } },
      take: 50,
    });
    const results = await Promise.allSettled(
      pending.map(o => this.reconcileOne(o.id)),
    );
    const updated = results.filter(r => r.status === 'fulfilled').length;
    return { checked: pending.length, updated };
  }

  // ── Admin ──────────────────────────────────────────────────────
  async adminFindAll(opts: { page?: number; limit?: number; status?: string; search?: string } = {}) {
    const { page = 1, limit = 50, status, search } = opts;
    const where: any = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { orderItems: { select: { productName: true, quantity: true, unitPrice: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders: orders.map(o => ({ ...o, items: o.orderItems })), total, page, limit };
  }

  // ── Compras recentes públicas (social proof) ──────────────────
  async getRecentPublic(limit = 10) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        paidAt: { not: null },
        orderItems: { some: { productName: { not: '' } } },
      },
      orderBy: { paidAt: 'desc' },
      take: limit,
      select: {
        id: true,
        totalAmount: true,
        customerName: true,
        paidAt: true,
        orderItems: {
          where: { productName: { not: '' } },
          select: { productName: true },
          take: 1,
        },
      },
    });

    const icons = ['📚', '✏️', '🎨', '🖍️', '📝', '🎒', '🌈', '⭐'];
    const colors = [
      'linear-gradient(135deg,#667eea,#764ba2)',
      'linear-gradient(135deg,#f093fb,#f5576c)',
      'linear-gradient(135deg,#4facfe,#00f2fe)',
      'linear-gradient(135deg,#43e97b,#38f9d7)',
      'linear-gradient(135deg,#fa709a,#fee140)',
      'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    ];

    return orders.map((o, idx) => {
      const [first, ...rest] = (o.customerName ?? 'Alguém').trim().split(' ');
      const buyer = rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
      return {
        name: o.orderItems[0]?.productName ?? 'Produto pedagógico',
        buyer,
        paidAt: o.paidAt,
        price: this.fmt(Number(o.totalAmount)),
        icon: icons[idx % icons.length],
        color: colors[idx % colors.length],
      };
    });
  }

  // ── Dashboard KPIs ────────────────────────────────────────────
  async getStats() {
    const now = new Date();
    const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek  = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    const [totalAgg, dayAgg, weekAgg, monthAgg, yearAgg, ordersCount, ordersMonth, ordersPending, usersTotal] = await Promise.all([
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: OrderStatus.PAID } }),
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: OrderStatus.PAID, paidAt: { gte: startOfDay } } }),
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: OrderStatus.PAID, paidAt: { gte: startOfWeek } } }),
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: OrderStatus.PAID, paidAt: { gte: startOfMonth } } }),
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: OrderStatus.PAID, paidAt: { gte: startOfYear } } }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID, paidAt: { gte: startOfMonth } } }),
      this.prisma.order.count({ where: { status: { in: [OrderStatus.AWAITING_PAYMENT, OrderStatus.PENDING] } } }),
      this.prisma.user.count(),
    ]);

    // Monthly revenue for last 6 months
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const agg = await this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: OrderStatus.PAID, paidAt: { gte: d, lt: next } },
      });
      months.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short' }),
        value: Number(agg._sum.totalAmount ?? 0),
      });
    }

    return {
      revenue: Number(totalAgg._sum.totalAmount ?? 0),
      revenueDay: Number(dayAgg._sum.totalAmount ?? 0),
      revenueWeek: Number(weekAgg._sum.totalAmount ?? 0),
      revenueMonth: Number(monthAgg._sum.totalAmount ?? 0),
      revenueYear: Number(yearAgg._sum.totalAmount ?? 0),
      ordersCount,
      ordersMonth,
      ordersPending,
      usersTotal,
      customersCount: usersTotal,
      monthlyRevenue: months,
    };
  }

  // ── Helpers internos ──────────────────────────────────────────
  async markAsPaid(orderId: string, mpPaymentId: string, mpStatus: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { product: { select: { deliveryLink: true } } } } },
    });
    if (!order || order.status !== OrderStatus.AWAITING_PAYMENT) return null;

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID, mpPaymentId, mpStatus, paidAt: new Date() },
    });

    const productMap = new Map(
      order.orderItems.map(i => [i.productId, { deliveryLink: i.product.deliveryLink }]),
    );
    await this.createDownloadTokens(orderId, order.orderItems, productMap);

    for (const item of order.orderItems) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { salesCount: { increment: item.quantity } },
      });
    }

    return updated;
  }

  async createDownloadTokens(orderId: string, items: any[], productMap: Map<string, any>) {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 30);

    for (const item of items) {
      const existing = await this.prisma.downloadToken.findFirst({
        where: { orderItemId: item.id },
      });
      if (!existing) {
        const prod = productMap.get(item.productId);
        await this.prisma.downloadToken.create({
          data: {
            orderId,
            orderItemId: item.id,
            expiresAt,
            maxDownloads: 99999,
            deliveryLink: prod?.deliveryLink ?? null,
          },
        });
      }
    }
  }

  private async getSiteConfig() {
    const row = await this.prisma.siteConfig.findUnique({ where: { key: 'global' } });
    return row?.value ?? {};
  }

  private fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  private async createPixPayment(order: any, user: any, items: any[], products: any[], accessToken: string) {
    const [firstName, ...rest] = (user.name ?? 'Cliente').trim().split(' ');
    const supabaseUrl = this.config.get<string>('frontendUrl')!.replace('5173', '3000');

    const res = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${order.id}`,
      },
      body: JSON.stringify({
        transaction_amount: Number(order.totalAmount),
        description: `Pedido ${order.orderNumber}`,
        payment_method_id: 'pix',
        payer: { email: user.email, first_name: firstName, last_name: rest.join(' ') || firstName },
        external_reference: order.id,
        date_of_expiration: new Date(Date.now() + 30 * 60_000).toISOString().replace('Z', '-03:00'),
        notification_url: `${supabaseUrl}/webhooks/mercadopago`,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new BadRequestException(data?.message ?? 'Erro no Mercado Pago.');

    const qrCode = data.point_of_interaction?.transaction_data?.qr_code ?? '';
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64 ?? '';

    await this.prisma.order.update({
      where: { id: order.id },
      data: { mpPaymentId: String(data.id), metadata: { qr_code: qrCode, qr_code_base64: qrCodeBase64 } },
    });

    return { order, payment: { type: 'PIX', qrCode, qrCodeBase64, paymentId: String(data.id) } };
  }

  private async createCardPayment(order: any, user: any, items: any[], products: any[], accessToken: string) {
    const apiUrl = this.config.get<string>('frontendUrl')!.replace('5173', '3000');
    const frontendUrl = this.config.get<string>('frontendUrl')!;

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: order.orderItems.map((item: any) => ({
          id: item.productId,
          title: item.productName,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          currency_id: 'BRL',
        })),
        payer: { name: user.name, email: user.email },
        external_reference: order.id,
        notification_url: `${apiUrl}/webhooks/mercadopago`,
        back_urls: {
          success: `${frontendUrl}/checkout/success/${order.id}`,
          failure: `${frontendUrl}/checkout/failure/${order.id}`,
          pending: `${frontendUrl}/checkout/success/${order.id}`,
        },
        auto_return: 'approved',
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new BadRequestException(data?.message ?? 'Erro no Mercado Pago.');

    await this.prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: data.id },
    });

    return { order, payment: { type: 'CARD', initPoint: data.init_point } };
  }
}
