import {
  Controller, Get, Post, Patch, Param, Query, Body, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@pedago/shared';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private svc: AdminService,
    private storage: StorageService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.svc.getDashboard();
  }

  @Get('orders')
  orders(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.getOrders(+page, +limit, status, search);
  }

  @Get('orders/:id')
  order(@Param('id') id: string) {
    return this.svc.getOrder(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.svc.updateOrderStatus(id, status);
  }

  @Get('users')
  users(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.svc.getUsers(+page, +limit, search);
  }

  @Get('users/:id/orders')
  userOrders(@Param('id') id: string) {
    return this.svc.getUserOrders(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: { role?: string; isActive?: boolean }) {
    return this.svc.updateUser(id, body);
  }

  @Post('downloads/:tokenId/reset')
  resetDownload(@Param('tokenId') tokenId: string) {
    return this.svc.resetDownloadToken(tokenId);
  }

  @Get('integrations')
  getIntegrations() {
    return this.svc.getIntegrations();
  }

  @Patch('integrations')
  setIntegrations(@Body() body: Record<string, string>, @CurrentUser('id') adminId: string) {
    return this.svc.setIntegrations(body, adminId);
  }

  @Post('uploads/public')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPublic(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado.');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não suportado.');
    }
    const url = await this.storage.upload(file.originalname, file.buffer, file.mimetype, true);
    return { url };
  }
}
