import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('files')
export class FilesController {
  constructor(private storage: StorageService) {}

  @Get(':id')
  async serve(@Param('id') id: string, @Res() res: Response) {
    const file = await this.storage.getFile(id);
    if (!file.isPublic) throw new NotFoundException('Arquivo não encontrado.');

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(file.data);
  }
}
