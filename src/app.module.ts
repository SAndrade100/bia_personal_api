import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TrainingModule } from './training/training.module';
import { TrainingSheetModule } from './training-sheet/training-sheet.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { ScheduleModule } from './schedule/schedule.module';
import { AssessmentModule } from './assessment/assessment.module';
import { AnamnesisModule } from './anamnesis/anamnesis.module';
import { ChatModule } from './chat/chat.module';
import { ProgressModule } from './progress/progress.module';
import { TrainerStudentsModule } from './trainer-students/trainer-students.module';
import { ExerciseLibraryModule } from './exercise-library/exercise-library.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    TrainingModule,
    TrainingSheetModule,
    NutritionModule,
    ScheduleModule,
    AssessmentModule,
    AnamnesisModule,
    ChatModule,
    ProgressModule,
    TrainerStudentsModule,
    ExerciseLibraryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
