import {
  Controller, Get, Patch, Body, Param, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Perfil próprio ────────────────────────────────────────────
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: any,
    @Body() body: { name?: string; phone?: string; avatarUrl?: string },
  ) {
    return this.usersService.updateMe(user.id, body);
  }

  // ── Admin ──────────────────────────────────────────────────────
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  listAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.usersService.listAll(page, limit, search);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getUserWithOrders(@Param('id') id: string) {
    return this.usersService.getUserWithOrders(id);
  }

  @Get(':id/orders')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getUserOrders(@Param('id') id: string) {
    return this.usersService.getUserOrders(id);
  }

  @Patch(':id/phone')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updatePhone(@Param('id') id: string, @Body() body: { phone: string }) {
    return this.usersService.updatePhone(id, body.phone);
  }
}
