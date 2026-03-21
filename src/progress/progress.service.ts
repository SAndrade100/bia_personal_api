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
        orderBy: { date: 'desc' },
        select: { date: true, trainingId: true },
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
      date: (a.date instanceof Date ? a.date : new Date(a.date)).toISOString().slice(0, 10),
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
    const weeklyWorkouts = Array.from(weekMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => {
        const numA = parseInt(a.week.replace('Sem ', ''), 10);
        const numB = parseInt(b.week.replace('Sem ', ''), 10);
        return numA - numB;
      });

    const totalWorkouts = schedules.length;
    const weightLost =
      user?.startWeight && user?.currentWeight
        ? +(user.startWeight - user.currentWeight).toFixed(1)
        : 0;

    // Compute total hours from training durations
    const trainingIds = [...new Set(schedules.map((s) => s.trainingId))];
    let totalMinutes = 0;
    if (trainingIds.length > 0) {
      const trainings = await this.prisma.training.findMany({
        where: { id: { in: trainingIds } },
        select: { id: true, duration: true },
      });
      const durationMap = new Map(trainings.map((t) => [t.id, t.duration]));
      for (const s of schedules) {
        totalMinutes += durationMap.get(s.trainingId) || 0;
      }
    }
    const totalHours = +(totalMinutes / 60).toFixed(1);

    // Compute streak (consecutive days with done workouts ending today/yesterday)
    const uniqueDays = [...new Set(schedules.map((s) => {
      const d = s.date instanceof Date ? s.date : new Date(s.date);
      return d.toISOString().slice(0, 10);
    }))].sort().reverse();
    let streak = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let check = new Date(today);
    for (const dayStr of uniqueDays) {
      const checkStr = check.toISOString().slice(0, 10);
      if (dayStr === checkStr) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else if (dayStr < checkStr) {
        break;
      }
    }

    return {
      weightHistory,
      weeklyWorkouts,
      personalRecords: personalRecords.map((r) => ({
        ...r,
        date: (r.date instanceof Date ? r.date : new Date(r.date)).toISOString().slice(0, 10),
      })),
      summary: {
        totalWorkouts,
        totalHours,
        weightLost,
        streak,
      },
    };
  }
}
