import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminService {
  constructor(private supabase: SupabaseService) {}

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [
      { data: totalRev },
      { data: monthRev },
      { data: lastMonthRev },
      { count: totalOrders },
      { count: monthOrders },
      { count: pendingOrders },
      { count: totalUsers },
      { data: topProducts },
      { data: recentOrders },
    ] = await Promise.all([
      this.supabase.db.from('orders').select('total_amount').eq('status', 'PAID'),
      this.supabase.db.from('orders').select('total_amount').eq('status', 'PAID').gte('paid_at', startOfMonth),
      this.supabase.db.from('orders').select('total_amount').eq('status', 'PAID').gte('paid_at', startOfLastMonth).lt('paid_at', startOfMonth),
      this.supabase.db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PAID'),
      this.supabase.db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PAID').gte('created_at', startOfMonth),
      this.supabase.db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'AWAITING_PAYMENT'),
      this.supabase.db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CUSTOMER'),
      this.supabase.db.from('products').select('id, name, sales_count, cover_image_url, price').is('deleted_at', null).order('sales_count', { ascending: false }).limit(5),
      this.supabase.db.from('orders').select('*, profiles(name, email), order_items(product_name)').eq('status', 'PAID').order('paid_at', { ascending: false }).limit(10),
    ]);

    const sumRev = (rows: any[]) => (rows ?? []).reduce((s: number, r: any) => s + Number(r.total_amount), 0);

    return {
      revenue: {
        total: sumRev(totalRev ?? []),
        month: sumRev(monthRev ?? []),
        lastMonth: sumRev(lastMonthRev ?? []),
      },
      orders: { total: totalOrders ?? 0, month: monthOrders ?? 0, pending: pendingOrders ?? 0 },
      users: { total: totalUsers ?? 0 },
      topProducts: topProducts ?? [],
      recentOrders: recentOrders ?? [],
    };
  }

  async getOrders(page: number, limit: number, status?: string, search?: string) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.supabase.db
      .from('orders')
      .select('*, profiles(name, email, avatar_url), order_items(product_name, quantity, unit_price)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) q = q.eq('status', status);
    if (search) q = q.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);
    return { items: data ?? [], total: count ?? 0, page, limit };
  }

  async getOrder(id: string) {
    const { data, error } = await this.supabase.db
      .from('orders')
      .select('*, profiles(*), order_items(*, products(id, name, cover_image_url), download_tokens(*))')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Pedido não encontrado.');
    return data;
  }

  async updateOrderStatus(id: string, status: string) {
    const { data: order } = await this.supabase.db.from('orders').select('id').eq('id', id).single();
    if (!order) throw new NotFoundException('Pedido não encontrado.');

    const { data, error } = await this.supabase.db
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getUsers(page: number, limit: number, search?: string) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.supabase.db
      .from('profiles')
      .select('id, name, phone, avatar_url, role, is_active, created_at, orders(count)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) q = q.or(`name.ilike.%${search}%`);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    // Also get emails from auth admin
    const items = await Promise.all(
      (data ?? []).map(async (profile: any) => {
        const { data: { user } } = await this.supabase.db.auth.admin.getUserById(profile.id);
        return { ...profile, email: user?.email ?? '' };
      }),
    );

    return { items, total: count ?? 0, page, limit };
  }

  async getUserOrders(userId: string) {
    const { data: profile } = await this.supabase.db
      .from('profiles')
      .select('id, name, phone')
      .eq('id', userId)
      .single();

    if (!profile) throw new NotFoundException('Usuário não encontrado.');

    const { data: authUser } = await this.supabase.db.auth.admin.getUserById(userId);

    const { data: orders } = await this.supabase.db
      .from('orders')
      .select('*, order_items(product_name, quantity, unit_price)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return {
      user: { ...profile, email: authUser.user?.email ?? '' },
      orders: orders ?? [],
    };
  }

  async updateUser(id: string, data: { role?: string; isActive?: boolean }) {
    const { data: profile } = await this.supabase.db.from('profiles').select('id').eq('id', id).single();
    if (!profile) throw new NotFoundException('Usuário não encontrado.');

    const update: any = { updated_at: new Date().toISOString() };
    if (data.role !== undefined) update.role = data.role;
    if (data.isActive !== undefined) update.is_active = data.isActive;

    const { data: updated, error } = await this.supabase.db
      .from('profiles')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  async resetDownloadToken(tokenId: string) {
    const { data: token } = await this.supabase.db.from('download_tokens').select('id').eq('id', tokenId).single();
    if (!token) throw new NotFoundException('Token não encontrado.');

    const { data, error } = await this.supabase.db
      .from('download_tokens')
      .update({ download_count: 0, revoked_at: null })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getIntegrations() {
    const { data } = await this.supabase.db
      .from('site_config')
      .select('value')
      .eq('key', 'integrations')
      .single();

    return (data?.value as any) ?? {
      mercadoPagoAccessToken: '',
      mercadoPagoPixKey: '',
      mercadoPagoWebhookSecret: '',
    };
  }

  async setIntegrations(data: Record<string, string>, adminId: string) {
    await this.supabase.db
      .from('site_config')
      .upsert(
        { key: 'integrations', value: data as any, updated_by_admin_id: adminId, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );
    return data;
  }
}
