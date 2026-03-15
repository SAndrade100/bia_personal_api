import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getProgress(userId: number) {
    const [assessments, schedules, personalRecords, user] = await Promise.all([
      this.prisma.assessment.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        select: { date: true, weight: true },
      }),
      this.prisma.schedule.findMany({
        where: { userId, done: true },
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      this.prisma.personalRecord.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { startWeight: true, currentWeight: true },
      }),
    ]);

    const weightHistory = assessments.map((a) => ({
      date: a.date,
      value: a.weight,
    }));

    // group workouts by week
    const weekMap = new Map<string, number>();
    for (const s of schedules) {
      const d = new Date(s.date);
      const weekNum = Math.ceil(
        (d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
      );
      const key = `Sem ${weekNum}`;
      weekMap.set(key, (weekMap.get(key) || 0) + 1);
    }
    const weeklyWorkouts = Array.from(weekMap.entries()).map(([week, count]) => ({
      week,
      count,
    }));

    const totalWorkouts = schedules.length;
    const weightLost =
      user?.startWeight && user?.currentWeight
        ? +(user.startWeight - user.currentWeight).toFixed(1)
        : 0;

    return {
      weightHistory,
      weeklyWorkouts,
      personalRecords,
      summary: {
        totalWorkouts,
        totalHours: 0,
        weightLost,
        streak: 0,
      },
    };
  }
}
