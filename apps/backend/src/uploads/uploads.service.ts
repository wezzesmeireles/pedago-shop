import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService, BucketName } from '../storage/storage.service';

type UploadTarget = BucketName;

const ALLOWED_MIME: Record<UploadTarget, string[]> = {
  covers: ['image/jpeg', 'image/png', 'image/webp'],
  previews: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  files: ['application/pdf'],
};

const MAX_SIZE: Record<UploadTarget, number> = {
  covers: 5 * 1024 * 1024,
  previews: 10 * 1024 * 1024,
  files: 200 * 1024 * 1024,
};

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageService) {}

  async uploadFile(
    target: UploadTarget,
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    const allowed = ALLOWED_MIME[target];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de arquivo não permitido para ${target}.`);
    }
    if (file.size > MAX_SIZE[target]) {
      throw new BadRequestException(`Arquivo excede o tamanho máximo para ${target}.`);
    }

    const { key, url } = await this.storage.upload(target, file);
    return { url, key: `${target}/${key}` };
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    await this.storage.delete(bucket as BucketName, key);
  }
}
