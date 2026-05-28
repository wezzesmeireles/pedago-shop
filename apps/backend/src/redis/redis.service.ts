import { Injectable, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(@Inject('REDIS_OPTIONS') private readonly options: { url: string }) {}

  async onModuleInit() {
    this.client = new Redis(this.options.url, {
      retryStrategy: (times) => Math.min(times * 200, 5000),
      lazyConnect: false,
    });
    this.client.on('error', (err) => console.error('[Redis]', err.message));
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  // ── Refresh tokens ────────────────────────────────────────────
  // Chave: refresh:<userId>:<tokenId>
  async setRefreshToken(userId: string, tokenId: string, ttlSeconds: number): Promise<void> {
    await this.client.set(`refresh:${userId}:${tokenId}`, '1', 'EX', ttlSeconds);
  }

  async validateRefreshToken(userId: string, tokenId: string): Promise<boolean> {
    const val = await this.client.get(`refresh:${userId}:${tokenId}`);
    return val === '1';
  }

  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.client.del(`refresh:${userId}:${tokenId}`);
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    const keys = await this.client.keys(`refresh:${userId}:*`);
    if (keys.length) await this.client.del(...keys);
  }

  // ── Cache genérico ────────────────────────────────────────────
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}
