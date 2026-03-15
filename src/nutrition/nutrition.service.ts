import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NutritionService {
  constructor(private prisma: PrismaService) {}

  async getAll(userId: number, section?: string) {
    if (section === 'plan') return this.getPlan(userId);
    if (section === 'diary') return this.getDiary(userId);
    return {
      plan: await this.getPlan(userId),
      diary: await this.getDiary(userId),
    };
  }

  async getPlan(userId: number) {
    return this.prisma.nutritionPlan.findFirst({
      where: { userId, isCurrent: true },
      include: { meals: { include: { items: true } } },
    });
  }

  async getDiary(userId: number) {
    return this.prisma.diaryEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async updatePlan(studentId: number, data: any) {
    // mark old plans as not current
    await this.prisma.nutritionPlan.updateMany({
      where: { userId: studentId, isCurrent: true },
      data: { isCurrent: false },
    });

    const { meals, ...planData } = data;
    return this.prisma.nutritionPlan.create({
      data: {
        userId: studentId,
        title: planData.title,
        updatedBy: planData.updatedBy,
        dailyTargets: planData.dailyTargets,
        isCurrent: true,
        meals: {
          create: meals?.map((meal: any) => ({
            name: meal.name,
            time: meal.time,
            emoji: meal.emoji,
            items: {
              create: meal.items,
            },
          })),
        },
      },
      include: { meals: { include: { items: true } } },
    });
  }

  async addDiaryEntry(userId: number, data: any) {
    return this.prisma.diaryEntry.create({
      data: {
        userId,
        date: new Date(data.date),
        mealSlot: data.mealSlot,
        description: data.description,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        time: data.time,
      },
    });
  }
}
