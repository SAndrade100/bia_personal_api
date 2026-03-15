import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('api/nutrition')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NutritionController {
  constructor(private readonly service: NutritionService) {}

  @Get()
  getAll(@Req() req: any, @Query('section') section?: string) {
    return this.service.getAll(req.user.id, section);
  }

  @Put('plan')
  @Roles('trainer')
  updatePlan(@Query('studentId') studentId: string, @Body() body: any) {
    return this.service.updatePlan(+studentId, body);
  }

  @Post('diary')
  addDiaryEntry(@Req() req: any, @Body() body: any) {
    return this.service.addDiaryEntry(req.user.id, body);
  }
}
