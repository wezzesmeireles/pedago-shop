import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private svc: DownloadsService) {}

  @Get(':token')
  async download(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { data, mimeType, fileName } = await this.svc.download(token, req);
    const encoded = encodeURIComponent(fileName);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encoded}; filename="${encoded}"`);
    res.setHeader('Content-Length', data.length);
    res.send(data);
  }
}
