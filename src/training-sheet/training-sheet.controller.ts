import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TrainingSheetService } from './training-sheet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('api/training-sheets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingSheetController {
  constructor(private readonly service: TrainingSheetService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('trainer')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @Roles('trainer')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles('trainer')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
