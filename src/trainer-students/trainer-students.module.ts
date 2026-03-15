import { Module } from '@nestjs/common';
import { TrainerStudentsService } from './trainer-students.service';
import { TrainerStudentsController } from './trainer-students.controller';

@Module({
  controllers: [TrainerStudentsController],
  providers: [TrainerStudentsService],
})
export class TrainerStudentsModule {}
