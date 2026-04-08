import { Injectable, NotFoundException, GoneException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { StorageService } from '../storage/storage.service';
import { Request } from 'express';

@Injectable()
export class DownloadsService {
  constructor(
    private supabase: SupabaseService,
    private storage: StorageService,
  ) {}

  async download(token: string, req: Request) {
    const { data: downloadToken, error } = await this.supabase.db
      .from('download_tokens')
      .select(`
        *,
        orders(user_id, status),
        order_items(
          product_id,
          products(file_key, name)
        )
      `)
      .eq('token', token)
      .single();

    if (error || !downloadToken) throw new NotFoundException('Token de download inválido.');

    if (downloadToken.orders.status !== 'PAID') {
      throw new ForbiddenException('Pedido não confirmado.');
    }

    if (downloadToken.revoked_at) {
      throw new GoneException('Este link de download foi revogado.');
    }

    if (new Date(downloadToken.expires_at) < new Date()) {
      throw new GoneException('Link de download expirado. Entre em contato com o suporte.');
    }

    const fileKey = downloadToken.order_items.products.file_key;
    const productName = downloadToken.order_items.products.name;

    // Get signed URL for private file (valid for 60 seconds)
    const signedUrl = await this.storage.getSignedUrl(fileKey, 60);

    // Update download stats
    await this.supabase.db
      .from('download_tokens')
      .update({
        download_count: downloadToken.download_count + 1,
        last_download_at: new Date().toISOString(),
        last_download_ip: req.ip,
      })
      .eq('id', downloadToken.id);

    await this.supabase.db
      .from('products')
      .update({ download_count: downloadToken.order_items.products.download_count + 1 })
      .eq('id', downloadToken.order_items.product_id);

    return { signedUrl, fileName: `${productName}.pdf` };
  }
}
