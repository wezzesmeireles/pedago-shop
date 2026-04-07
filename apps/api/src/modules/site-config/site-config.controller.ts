import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SiteConfigService } from './site-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@pedago/shared';

@Controller('site-config')
export class SiteConfigController {
  constructor(private svc: SiteConfigService) {}

  @Get()
  get() {
    return this.svc.get();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Body() data: any, @CurrentUser('id') adminId: string) {
    return this.svc.update(data, adminId);
  }
}
