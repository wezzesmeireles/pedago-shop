import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('files')
export class FilesController {
  constructor(private storage: StorageService) {}

  // Public files are now served directly from Supabase Storage CDN.
  // This endpoint is kept for backwards compatibility but redirects.
  @Get(':path(*)')
  async serve(@Param('path') path: string, @Res() res: Response) {
    const url = this.storage.getPublicUrl('product-covers', path);
    res.redirect(301, url);
  }
}
