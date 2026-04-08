import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async register(dto: RegisterDto) {
    const { data, error } = await this.supabase.db.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true, // skip email confirmation — session available immediately
      user_metadata: { name: dto.name, phone: dto.phone ?? null },
    });

    if (error) {
      if (error.message?.includes('already registered')) {
        throw new UnauthorizedException('Email já cadastrado.');
      }
      throw new UnauthorizedException(error.message);
    }

    // Trigger creates profile; update name/phone to ensure correct values
    await this.supabase.db
      .from('profiles')
      .update({ name: dto.name, phone: dto.phone ?? null })
      .eq('id', data.user!.id);

    const { data: session, error: signInError } = await this.supabase.db.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (signInError || !session.session) {
      throw new UnauthorizedException('Usuário criado mas erro ao iniciar sessão. Faça login manualmente.');
    }

    return { accessToken: session.session.access_token };
  }

  async getAdminStatus() {
    const { count } = await this.supabase.db
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN');
    return { hasAdmin: (count ?? 0) > 0 };
  }

  async logout(userId: string) {
    await this.supabase.db.auth.admin.signOut(userId);
  }

  async createFirstAdmin(dto: RegisterDto) {
    const { count } = await this.supabase.db
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN');

    if ((count ?? 0) > 0) {
      throw new UnauthorizedException('Já existe um administrador cadastrado.');
    }

    const { data, error } = await this.supabase.db.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { name: dto.name },
    });

    if (error) throw new UnauthorizedException(error.message);

    await this.supabase.db
      .from('profiles')
      .update({ name: dto.name, role: 'ADMIN' })
      .eq('id', data.user!.id);

    const { data: session, error: signInError } = await this.supabase.db.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (signInError || !session.session) {
      throw new UnauthorizedException('Admin criado, mas erro ao criar sessão.');
    }

    return {
      accessToken: session.session.access_token,
      refreshToken: session.session.refresh_token,
    };
  }
}
