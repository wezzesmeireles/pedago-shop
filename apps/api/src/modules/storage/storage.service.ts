import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Salva um arquivo no banco de dados.
   * Arquivos públicos (imagens) retornam a URL `/files/:id`.
   * Arquivos privados (PDFs) retornam apenas o ID do arquivo.
   */
  async upload(filename: string, buffer: Buffer, mimeType: string, isPublic: boolean): Promise<string> {
    const file = await this.prisma.storedFile.create({
      data: {
        filename,
        mimeType,
        size: buffer.length,
        data: buffer,
        isPublic,
      },
    });
    return isPublic ? `/files/${file.id}` : file.id;
  }

  async getFile(id: string) {
    const file = await this.prisma.storedFile.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('Arquivo não encontrado.');
    return file;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storedFile.delete({ where: { id } }).catch(() => {});
  }
}
