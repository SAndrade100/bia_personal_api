import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Get()
  getProgress(@Req() req: any) {
    return this.service.getProgress(req.user.id);
  }
}
