import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

  /**
   * Upload a file to Supabase Storage.
   * Public files (images) → bucket 'product-covers' or 'product-previews'
   * Private files (PDFs) → bucket 'product-files'
   * Returns public URL for public files, or storage path for private files.
   */
  async upload(
    filename: string,
    buffer: Buffer,
    mimeType: string,
    isPublic: boolean,
  ): Promise<string> {
    const bucket = isPublic ? 'product-covers' : 'product-files';
    const ext = filename.split('.').pop() ?? 'bin';
    const path = `${uuidv4()}.${ext}`;

    const { error } = await this.supabase.db.storage
      .from(bucket)
      .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    if (isPublic) {
      const { data } = this.supabase.db.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }

    return path;
  }

  /**
   * Upload a preview image specifically.
   */
  async uploadPreview(filename: string, buffer: Buffer, mimeType: string): Promise<string> {
    const ext = filename.split('.').pop() ?? 'jpg';
    const path = `${uuidv4()}.${ext}`;

    const { error } = await this.supabase.db.storage
      .from('product-previews')
      .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = this.supabase.db.storage.from('product-previews').getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Get a signed URL for private file download.
   * expiresIn: seconds (default 60s for downloads)
   */
  async getSignedUrl(path: string, expiresIn = 60): Promise<string> {
    const { data, error } = await this.supabase.db.storage
      .from('product-files')
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    return data.signedUrl;
  }

  /**
   * Get public URL for a public file.
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.db.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Delete a file from storage.
   */
  async delete(bucket: string, path: string): Promise<void> {
    await this.supabase.db.storage.from(bucket).remove([path]);
  }
}
