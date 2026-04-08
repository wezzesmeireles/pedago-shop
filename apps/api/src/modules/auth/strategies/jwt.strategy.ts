import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private supabase: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const { data: profile } = await this.supabase.db
      .from('profiles')
      .select('id, name, role, is_active, deleted_at')
      .eq('id', payload.sub)
      .single();

    if (!profile || !profile.is_active || profile.deleted_at) {
      throw new UnauthorizedException();
    }

    return {
      id: profile.id,
      email: payload.email,
      role: profile.role,
      name: profile.name,
    };
  }
}
