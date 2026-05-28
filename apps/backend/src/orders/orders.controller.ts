import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() body: { items: any[]; paymentMethod: string },
  ) {
    return this.ordersService.create(user.id, body as any);
  }

  @Get()
  findMine(@CurrentUser() user: any) {
    return this.ordersService.findByUser(user.id);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  stats() {
    return this.ordersService.getStats();
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  adminFindAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.adminFindAll({ page, limit, status, search });
  }

  @Post('reconcile-all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  reconcileAll() {
    return this.ordersService.reconcileAll();
  }

  @Get('recent-public')
  @Public()
  recentPublic() {
    return this.ordersService.getRecentPublic();
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.findByIdForUser(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status);
  }

  @Post(':id/reconcile')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  reconcileOne(@Param('id') id: string) {
    return this.ordersService.reconcileOne(id);
  }
}
