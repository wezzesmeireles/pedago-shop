import * as crypto from 'crypto';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PRISMA } from '../../database/database.module';

interface SupabaseJwtPayload {
  sub: string;
  email: string;
  role: string;
  user_metadata?: { full_name?: string; avatar_url?: string; phone?: string };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly hsSecret: string;
  private readonly jwksUrl: string;
  private readonly jwksCache = new Map<string, crypto.KeyObject>();
  private jwksFetchedAt = 0;

  constructor(
    config: ConfigService,
    @Inject(PRISMA) private readonly prisma: PrismaClient,
  ) {
    const hsSecret = config.get<string>('supabase.jwtSecret')!;
    const supabaseUrl = config.get<string>('supabase.url') ?? '';
    const jwksUrl = supabaseUrl
      ? `${supabaseUrl}/auth/v1/.well-known/jwks.json`
      : '';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (_req: any, rawToken: string, done: (err: any, key?: any) => void) => {
        try {
          const header = JSON.parse(Buffer.from(rawToken.split('.')[0], 'base64url').toString());
          const alg: string = header.alg ?? 'HS256';

          if (alg === 'HS256') {
            return done(null, hsSecret);
          }

          if (alg === 'ES256' || alg === 'RS256') {
            const key = await this.resolveAsymmetricKey(jwksUrl, header.kid);
            if (!key) return done(new Error(`No key found for kid=${header.kid}`));
            return done(null, key);
          }

          done(new Error(`Unsupported JWT algorithm: ${alg}`));
        } catch (e) {
          done(e);
        }
      },
    });

    this.hsSecret = hsSecret;
    this.jwksUrl = jwksUrl;
  }

  private async resolveAsymmetricKey(jwksUrl: string, kid?: string): Promise<crypto.KeyObject | null> {
    if (!jwksUrl) return null;

    const now = Date.now();
    if (now - this.jwksFetchedAt > 300_000 || this.jwksCache.size === 0) {
      await this.refreshJwks(jwksUrl);
    }

    if (kid && this.jwksCache.has(kid)) return this.jwksCache.get(kid)!;
    // Fallback: return the first cached key
    const first = this.jwksCache.values().next();
    return first.done ? null : first.value;
  }

  private async refreshJwks(url: string): Promise<void> {
    try {
      console.log(`[JwtStrategy] fetching JWKS from ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
      const { keys } = (await res.json()) as { keys: any[] };
      this.jwksCache.clear();
      for (const jwk of keys) {
        if (!jwk.kty) continue;
        const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
        this.jwksCache.set(jwk.kid ?? `key-${this.jwksCache.size}`, key);
      }
      this.jwksFetchedAt = Date.now();
      console.log(`[JwtStrategy] JWKS loaded: ${this.jwksCache.size} key(s)`);
    } catch (e: any) {
      console.error('[JwtStrategy] JWKS fetch error:', e.message);
    }
  }

  async validate(payload: SupabaseJwtPayload) {
    if (!payload?.sub || !payload?.email) throw new UnauthorizedException();

    const select = { id: true, email: true, name: true, role: true, phone: true, avatarUrl: true } as const;

    try {
      // Fast path: find by primary UUID or by linked googleId (covers the migrated-user case
      // after the first login links the Google OAuth sub to the local account)
      const existing = await this.prisma.user.findFirst({
        where: { OR: [{ id: payload.sub }, { googleId: payload.sub }] },
        select,
      });
      if (existing) return existing;

      // Email fallback: migrated user whose id differs from the Google OAuth sub
      const byEmail = await this.prisma.user.findUnique({
        where: { email: payload.email },
        select,
      });
      if (byEmail) {
        // Link this Google UUID so future lookups hit the fast path above
        await this.prisma.user.updateMany({
          where: { email: payload.email, googleId: null },
          data: { googleId: payload.sub },
        }).catch(() => {});
        return byEmail;
      }

      // Brand-new Google user — create a record
      return await this.prisma.user.create({
        data: {
          id: payload.sub,
          email: payload.email,
          name: payload.user_metadata?.full_name ?? payload.email.split('@')[0],
          phone: payload.user_metadata?.phone ?? null,
          avatarUrl: payload.user_metadata?.avatar_url ?? null,
          role: 'CUSTOMER',
          googleId: payload.sub,
        },
        select,
      });
    } catch {
      throw new UnauthorizedException();
    }
  }
}
