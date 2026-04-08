import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { DEFAULT_SITE_CONFIG, SiteConfigData } from '@pedago/shared';

@Injectable()
export class SiteConfigService {
  constructor(private supabase: SupabaseService) {}

  async get(): Promise<SiteConfigData> {
    const { data } = await this.supabase.db
      .from('site_config')
      .select('value')
      .eq('key', 'global')
      .single();

    if (!data) return DEFAULT_SITE_CONFIG;
    return { ...DEFAULT_SITE_CONFIG, ...(data.value as any) };
  }

  async update(data: Partial<SiteConfigData>, adminId: string): Promise<SiteConfigData> {
    const current = await this.get();
    const merged = { ...current, ...data };

    await this.supabase.db
      .from('site_config')
      .upsert(
        { key: 'global', value: merged as any, updated_by_admin_id: adminId, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );

    return merged;
  }
}
