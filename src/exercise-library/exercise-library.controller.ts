import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExerciseLibraryService } from './exercise-library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/exercise-library')
@UseGuards(JwtAuthGuard)
export class ExerciseLibraryController {
  constructor(private readonly service: ExerciseLibraryService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.service.findAll(q);
  }
}
