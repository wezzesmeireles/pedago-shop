import { Controller, Get, Post, HttpCode, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: any) {
    return user;
  }

  @Get('has-admin')
  hasAdmin() {
    return this.authService.hasAdmin();
  }

  @Post('setup-admin')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async setupAdmin(@CurrentUser() user: any) {
    await this.authService.promoteFirstAdmin(user.id);
    return { ok: true };
  }
}
