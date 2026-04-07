import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Fetch products and validate
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, deletedAt: null },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos não estão disponíveis.');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const totalAmount = dto.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    // Generate order number
    const count = await this.prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: 'AWAITING_PAYMENT',
        totalAmount,
        paymentMethod: dto.paymentMethod as any,
        customerEmail: user.email,
        customerName: user.name,
        expiresAt,
        items: {
          create: dto.items.map((item) => {
            const p = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              productName: p.name,
              unitPrice: p.price,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    // Create payment — PIX uses direct Payment API, card uses Preference
    if (dto.paymentMethod === 'PIX') {
      const pix = await this.payments.createPix(order, user);

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          mpPaymentId: pix.paymentId,
          metadata: {
            qr_code: pix.qrCode,
            qr_code_base64: pix.qrCodeBase64,
          },
        },
      });

      return {
        order,
        payment: {
          type: 'PIX',
          qrCode: pix.qrCode,
          qrCodeBase64: pix.qrCodeBase64,
        },
      };
    } else {
      const pref = await this.payments.createPreference(order, user);

      await this.prisma.order.update({
        where: { id: order.id },
        data: { mpPreferenceId: pref.preferenceId },
      });

      return {
        order,
        payment: {
          type: 'CARD',
          initPoint: pref.initPoint,
          sandboxInitPoint: pref.sandboxInitPoint,
        },
      };
    }
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, coverImageUrl: true, slug: true } },
              downloadTokens: {
                where: { revokedAt: null },
                select: { token: true, downloadCount: true, maxDownloads: true, expiresAt: true },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, coverImageUrl: true, slug: true } },
            downloadTokens: {
              where: { revokedAt: null },
              select: { token: true, downloadCount: true, maxDownloads: true, expiresAt: true },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Pedido não encontrado.');
    if (order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  async getStatus(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, paidAt: true, userId: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    if (order.userId !== userId) throw new ForbiddenException();
    return { id: order.id, status: order.status, paidAt: order.paidAt };
  }
}
