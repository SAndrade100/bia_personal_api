import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnamnesisService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(userId: number) {
    return this.prisma.anamnesis.findFirst({
      where: { userId, isCurrent: true },
    });
  }

  async upsert(studentId: number, data: any) {
    // mark old as not current
    await this.prisma.anamnesis.updateMany({
      where: { userId: studentId, isCurrent: true },
      data: { isCurrent: false },
    });

    return this.prisma.anamnesis.create({
      data: {
        userId: studentId,
        filledAt: data.filledAt ? new Date(data.filledAt) : new Date(),
        personalInfo: data.personalInfo,
        healthHistory: data.healthHistory,
        physicalActivity: data.physicalActivity,
        dietaryProfile: data.dietaryProfile,
        goals: data.goals,
        trainerNotes: data.trainerNotes,
        isCurrent: true,
      },
    });
  }
}
