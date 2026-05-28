import {
  Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { PRISMA } from '../database/database.module';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DownloadsService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly storage: StorageService,
  ) {}

  async listForUser(userId: string) {
    const now = new Date();
    const tokens = await this.prisma.downloadToken.findMany({
      where: {
        order: { userId },
        revokedAt: null,
      },
      include: {
        order: { select: { orderNumber: true, createdAt: true } },
        orderItem: {
          select: {
            productName: true,
            quantity: true,
            product: { select: { fileKey: true, coverImageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map(t => ({
      token: t.token,
      productName: t.orderItem.productName,
      orderNumber: t.order.orderNumber,
      orderedAt: t.order.createdAt,
      downloadCount: t.downloadCount,
      maxDownloads: t.maxDownloads,
      expiresAt: t.expiresAt,
      expired: t.expiresAt < now,
      deliveryLink: t.deliveryLink,
      fileKey: t.orderItem.product?.fileKey ?? null,
      coverImageUrl: t.orderItem.product?.coverImageUrl ?? null,
    }));
  }

  async serveFile(token: string, res: Response) {
    const record = await this.prisma.downloadToken.findUnique({
      where: { token },
      include: {
        order: { select: { userId: true } },
        orderItem: {
          select: {
            productName: true,
            product: { select: { fileKey: true } },
          },
        },
      },
    });

    if (!record) throw new NotFoundException('Token inválido.');
    if (record.revokedAt) throw new ForbiddenException('Token revogado.');
    if (record.expiresAt < new Date()) throw new ForbiddenException('Token expirado.');
    if (record.downloadCount >= record.maxDownloads) {
      throw new ForbiddenException('Limite de downloads atingido.');
    }

    await this.prisma.downloadToken.update({
      where: { token },
      data: { downloadCount: { increment: 1 }, lastDownloadAt: new Date() },
    });

    if (record.deliveryLink) {
      return res.redirect(302, record.deliveryLink);
    }

    const fileKey = record.orderItem.product.fileKey;
    if (fileKey) {
      const stream = await this.storage.getObject(fileKey);
      const filename = `${record.orderItem.productName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      stream.pipe(res);
      return;
    }

    throw new BadRequestException('Nenhum arquivo disponível para este token.');
  }
}
