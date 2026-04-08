import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    private supabase: SupabaseService,
    private payments: PaymentsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Fetch user profile
    const { data: profile } = await this.supabase.db
      .from('profiles')
      .select('id, name')
      .eq('id', userId)
      .single();

    // Fetch user email from auth
    const { data: { user: authUser } } = await this.supabase.db.auth.admin.getUserById(userId);
    if (!authUser) throw new NotFoundException('Usuário não encontrado.');

    const productIds = dto.items.map((i) => i.productId);
    const { data: products, error: prodErr } = await this.supabase.db
      .from('products')
      .select('id, name, price')
      .in('id', productIds)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (prodErr || !products || products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos não estão disponíveis.');
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    const totalAmount = dto.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    // Generate order number
    const { count } = await this.supabase.db.from('orders').select('*', { count: 'exact', head: true });
    const orderNumber = `ORD-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(6, '0')}`;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Create order
    const { data: order, error: orderErr } = await this.supabase.db
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        status: 'AWAITING_PAYMENT',
        total_amount: totalAmount,
        payment_method: dto.paymentMethod,
        customer_email: authUser.email,
        customer_name: profile?.name ?? authUser.email,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (orderErr || !order) throw new Error(orderErr?.message ?? 'Erro ao criar pedido.');

    // Create order items
    const itemsData = dto.items.map((item) => {
      const p = productMap.get(item.productId)!;
      return {
        order_id: order.id,
        product_id: item.productId,
        product_name: p.name,
        unit_price: p.price,
        quantity: item.quantity,
      };
    });

    const { data: orderItems } = await this.supabase.db
      .from('order_items')
      .insert(itemsData)
      .select();

    const fullOrder = { ...order, items: orderItems ?? [] };

    // Create payment
    if (dto.paymentMethod === 'PIX') {
      const pix = await this.payments.createPix(fullOrder, { email: authUser.email, name: profile?.name ?? '' });

      await this.supabase.db
        .from('orders')
        .update({
          mp_payment_id: pix.paymentId,
          metadata: { qr_code: pix.qrCode, qr_code_base64: pix.qrCodeBase64 },
        })
        .eq('id', order.id);

      return {
        order: fullOrder,
        payment: { type: 'PIX', qrCode: pix.qrCode, qrCodeBase64: pix.qrCodeBase64 },
      };
    } else {
      const pref = await this.payments.createPreference(fullOrder, { email: authUser.email, name: profile?.name ?? '' });

      await this.supabase.db
        .from('orders')
        .update({ mp_preference_id: pref.preferenceId })
        .eq('id', order.id);

      return {
        order: fullOrder,
        payment: { type: 'CARD', initPoint: pref.initPoint, sandboxInitPoint: pref.sandboxInitPoint },
      };
    }
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: items, error, count } = await this.supabase.db
      .from('orders')
      .select(
        `*, order_items(*, products(id, name, cover_image_url, slug), download_tokens(*))`,
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return { items: items ?? [], total: count ?? 0, page, limit };
  }

  async findById(id: string, userId: string) {
    const { data: order, error } = await this.supabase.db
      .from('orders')
      .select(`*, order_items(*, products(id, name, cover_image_url, slug), download_tokens(*))`)
      .eq('id', id)
      .single();

    if (error || !order) throw new NotFoundException('Pedido não encontrado.');
    if (order.user_id !== userId) throw new ForbiddenException();
    return order;
  }

  async getStatus(id: string, userId: string) {
    const { data: order, error } = await this.supabase.db
      .from('orders')
      .select('id, status, paid_at, user_id')
      .eq('id', id)
      .single();

    if (error || !order) throw new NotFoundException('Pedido não encontrado.');
    if (order.user_id !== userId) throw new ForbiddenException();
    return { id: order.id, status: order.status, paidAt: order.paid_at };
  }
}
