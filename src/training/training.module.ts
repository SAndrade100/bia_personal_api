import { Module } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { ExerciseLibraryModule } from '../exercise-library/exercise-library.module';

@Module({
  imports: [ExerciseLibraryModule],
  controllers: [TrainingController],
  providers: [TrainingService],
})
export class TrainingModule {}
