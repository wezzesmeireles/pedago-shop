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
    const { signedUrl, fileName } = await this.svc.download(token, req);
    // Redirect to Supabase signed URL — browser will download the file directly
    res.redirect(302, signedUrl);
  }
}
