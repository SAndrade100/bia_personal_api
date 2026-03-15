import { Body, Controller, Get, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AnamnesisService } from './anamnesis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('api/anamnesis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnamnesisController {
  constructor(private readonly service: AnamnesisService) {}

  @Get()
  getCurrent(@Req() req: any) {
    return this.service.getCurrent(req.user.id);
  }

  @Put()
  @Roles('trainer')
  upsert(@Query('studentId') studentId: string, @Body() body: any) {
    return this.service.upsert(+studentId, body);
  }
}
