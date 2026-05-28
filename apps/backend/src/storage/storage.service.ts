import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

export type BucketName = 'covers' | 'previews' | 'files';

@Injectable()
export class StorageService implements OnModuleInit {
  private client: Minio.Client;
  private buckets: Record<BucketName, string>;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const s3 = this.config.get('s3');
    this.client = new Minio.Client({
      endPoint: s3.endpoint,
      port: s3.port,
      useSSL: s3.useSsl,
      accessKey: s3.accessKey,
      secretKey: s3.secretKey,
    });
    this.buckets = {
      covers: s3.bucketCovers,
      previews: s3.bucketPreviews,
      files: s3.bucketFiles,
    };
    await this.ensureBuckets();
  }

  private async ensureBuckets() {
    for (const [, name] of Object.entries(this.buckets)) {
      const exists = await this.client.bucketExists(name);
      if (!exists) {
        await this.client.makeBucket(name, 'us-east-1');
        if (name !== this.buckets.files) {
          await this.client.setBucketPolicy(name, JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${name}/*`],
            }],
          }));
        }
      }
    }
  }

  async upload(
    bucket: BucketName,
    file: Express.Multer.File,
    prefix?: string,
  ): Promise<{ key: string; url: string }> {
    const ext = file.originalname.split('.').pop();
    const key = `${prefix ? prefix + '/' : ''}${uuidv4()}.${ext}`;
    const bucketName = this.buckets[bucket];

    await this.client.putObject(bucketName, key, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const publicUrl = this.config.get<string>('s3.publicUrl');
    const url = `${publicUrl}/${bucketName}/${key}`;
    return { key, url };
  }

  async delete(bucket: BucketName, key: string): Promise<void> {
    await this.client.removeObject(this.buckets[bucket], key);
  }

  // URL assinada para download privado (arquivos PDF)
  async getSignedUrl(key: string, expirySeconds = 300): Promise<string> {
    return this.client.presignedGetObject(this.buckets.files, key, expirySeconds);
  }

  // Stream direto do objeto (para a Edge Function de download)
  async getObject(key: string): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(this.buckets.files, key);
  }

  getPublicUrl(bucket: BucketName, key: string): string {
    const publicUrl = this.config.get<string>('s3.publicUrl');
    return `${publicUrl}/${this.buckets[bucket]}/${key}`;
  }
}
