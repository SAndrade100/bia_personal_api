-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "weeklyScheduleId" INTEGER;

-- CreateTable
CREATE TABLE "TrainingSheet" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSheetDay" (
    "id" SERIAL NOT NULL,
    "trainingSheetId" INTEGER NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "weekdays" INTEGER[],

    CONSTRAINT "TrainingSheetDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySchedule" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "trainingSheetId" INTEGER NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "recurrenceWeeks" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingSheetDay_trainingSheetId_idx" ON "TrainingSheetDay"("trainingSheetId");

-- CreateIndex
CREATE INDEX "TrainingSheetDay_trainingId_idx" ON "TrainingSheetDay"("trainingId");

-- CreateIndex
CREATE INDEX "WeeklySchedule_userId_idx" ON "WeeklySchedule"("userId");

-- CreateIndex
CREATE INDEX "WeeklySchedule_trainingSheetId_idx" ON "WeeklySchedule"("trainingSheetId");

-- CreateIndex
CREATE INDEX "Schedule_weeklyScheduleId_idx" ON "Schedule"("weeklyScheduleId");

-- AddForeignKey
ALTER TABLE "TrainingSheetDay" ADD CONSTRAINT "TrainingSheetDay_trainingSheetId_fkey" FOREIGN KEY ("trainingSheetId") REFERENCES "TrainingSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSheetDay" ADD CONSTRAINT "TrainingSheetDay_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySchedule" ADD CONSTRAINT "WeeklySchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySchedule" ADD CONSTRAINT "WeeklySchedule_trainingSheetId_fkey" FOREIGN KEY ("trainingSheetId") REFERENCES "TrainingSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_weeklyScheduleId_fkey" FOREIGN KEY ("weeklyScheduleId") REFERENCES "WeeklySchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
