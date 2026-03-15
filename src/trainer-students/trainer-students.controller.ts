import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { TrainerStudentsService } from './trainer-students.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('api/trainer/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('trainer')
export class TrainerStudentsController {
  constructor(private readonly service: TrainerStudentsService) {}

  @Get()
  findAll(@Req() req: any, @Query('status') status?: string, @Query('q') q?: string) {
    return this.service.findAll(req.user.id, status, q);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Query('section') section?: string) {
    return this.service.findOne(req.user.id, id, section);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user.id, body);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(req.user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.service.remove(req.user.id, id);
  }
}
