import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { createClient } from '@supabase/supabase-js';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

  // Create a user-scoped client for auth operations
  private userClient() {
    return createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_ANON_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  async register(dto: RegisterDto) {
    const { data, error } = await this.supabase.db.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { name: dto.name, phone: dto.phone ?? null },
    });

    if (error) {
      if (error.message?.includes('already registered')) {
        throw new UnauthorizedException('Email já cadastrado.');
      }
      throw new UnauthorizedException(error.message);
    }

    // Update profile with name/phone (trigger handles creation)
    await this.supabase.db
      .from('profiles')
      .update({ name: dto.name, phone: dto.phone ?? null })
      .eq('id', data.user!.id);

    // Sign in to get tokens
    const { data: session, error: signInError } = await this.supabase.db.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (signInError || !session.session) {
      throw new UnauthorizedException('Erro ao criar sessão.');
    }

    return {
      accessToken: session.session.access_token,
      refreshToken: session.session.refresh_token,
    };
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.db.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { data: profile } = await this.supabase.db
      .from('profiles')
      .select('is_active')
      .eq('id', data.user.id)
      .single();

    if (!profile?.is_active) {
      throw new UnauthorizedException('Conta desativada.');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async refresh(refreshToken: string) {
    const { data, error } = await this.supabase.db.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async logout(userId: string) {
    await this.supabase.db.auth.admin.signOut(userId);
  }
}
