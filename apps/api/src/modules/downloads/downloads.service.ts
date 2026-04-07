import {
  Injectable,
  NotFoundException,
  GoneException,
  ForbiddenException,
} from '@nestjs/common';
// Note: download tokens are UUIDs (122-bit random) — the token itself is the auth credential.
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Request } from 'express';

@Injectable()
export class DownloadsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async download(token: string, req: Request) {
    const downloadToken = await this.prisma.downloadToken.findUnique({
      where: { token },
      include: {
        order: { select: { userId: true, status: true } },
        orderItem: {
          include: { product: { select: { r2FileKey: true, name: true } } },
        },
      },
    });

    if (!downloadToken) throw new NotFoundException('Token de download inválido.');

    if (downloadToken.order.status !== 'PAID') {
      throw new ForbiddenException('Pedido não confirmado.');
    }

    if (downloadToken.revokedAt) {
      throw new GoneException('Este link de download foi revogado.');
    }

    if (downloadToken.expiresAt < new Date()) {
      throw new GoneException('Link de download expirado. Entre em contato com o suporte.');
    }

    const fileId = downloadToken.orderItem.product.r2FileKey;
    const file = await this.storage.getFile(fileId);

    await this.prisma.downloadToken.update({
      where: { id: downloadToken.id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadAt: new Date(),
        lastDownloadIp: req.ip,
      },
    });

    await this.prisma.product.update({
      where: { id: downloadToken.orderItem.productId },
      data: { downloadCount: { increment: 1 } },
    });

    return {
      data: file.data,
      mimeType: file.mimeType,
      fileName: `${downloadToken.orderItem.product.name}.pdf`,
    };
  }
}
