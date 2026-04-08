import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.supabase.db
      .from('profiles')
      .update({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatar_url: dto.avatarUrl }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, name, phone, avatar_url, role, is_active, created_at')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findById(id: string) {
    const { data } = await this.supabase.db
      .from('profiles')
      .select('id, name, phone, avatar_url, role, is_active, created_at')
      .eq('id', id)
      .single();

    return data ?? null;
  }
}
