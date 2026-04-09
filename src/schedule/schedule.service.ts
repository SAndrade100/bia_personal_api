import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  private fmtDate(d: Date | string) {
    return (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);
  }

  async findAll(userId: number, role: string, month?: string) {
    const where: any = {};
    if (role === 'trainer') {
      const students = await this.prisma.user.findMany({
        where: { trainerId: userId },
        select: { id: true },
      });
      where.userId = { in: students.map((s) => s.id) };
    } else {
      where.userId = userId;
    }
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }
    const rows = await this.prisma.schedule.findMany({ where, orderBy: { date: 'asc' } });
    return rows.map((s) => ({ ...s, date: this.fmtDate(s.date) }));
  }

  async create(data: any) {
    const s = await this.prisma.schedule.create({
      data: {
        userId: +data.studentId,
        trainingId: +data.trainingId,
        date: new Date(data.date),
        time: data.time,
        title: data.title,
      },
    });
    return { ...s, date: this.fmtDate(s.date) };
  }

  async update(id: number, data: any) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Schedule not found');
    const updated = await this.prisma.schedule.update({ where: { id }, data });
    return { ...updated, date: this.fmtDate(updated.date) };
  }

  async remove(id: number) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Schedule not found');
    await this.prisma.schedule.delete({ where: { id } });
  }

  // ── Weekly schedule from a Training Sheet ──────────────
  async createWeekly(data: {
    studentId: number;
    trainingSheetId: number;
    weekStart: string; // ISO date of the Monday
    recurrenceWeeks: number;
    time: string;
  }) {
    const sheet = await this.prisma.trainingSheet.findUnique({
      where: { id: +data.trainingSheetId },
      include: { days: { include: { training: true } } },
    });
    if (!sheet) throw new NotFoundException('Training sheet not found');

    const ws = await this.prisma.weeklySchedule.create({
      data: {
        userId: +data.studentId,
        trainingSheetId: sheet.id,
        weekStart: new Date(data.weekStart),
        recurrenceWeeks: data.recurrenceWeeks || 1,
      },
    });

    const sessions: any[] = [];
    for (let week = 0; week < (data.recurrenceWeeks || 1); week++) {
      const base = new Date(data.weekStart);
      base.setDate(base.getDate() + week * 7);

      for (const day of sheet.days) {
        for (const wd of day.weekdays) {
          const date = new Date(base);
          // base is Monday (weekday 1). Adjust to target weekday.
          const diff = wd - 1; // 0=Dom→-1, 1=Seg→0, 6=Sáb→5
          date.setDate(base.getDate() + (diff < 0 ? 6 : diff));

          sessions.push({
            userId: +data.studentId,
            trainingId: day.trainingId,
            date,
            time: data.time,
            title: day.training.title,
            weeklyScheduleId: ws.id,
          });
        }
      }
    }

    if (sessions.length > 0) {
      await this.prisma.schedule.createMany({ data: sessions });
    }

    const created = await this.prisma.schedule.findMany({
      where: { weeklyScheduleId: ws.id },
      orderBy: { date: 'asc' },
    });

    return {
      weeklySchedule: ws,
      sessions: created.map((s) => ({ ...s, date: this.fmtDate(s.date) })),
    };
  }

  // ── List weekly schedules for trainer view ────────────
  async findWeeklySchedules(userId: number, role: string) {
    const where: any = {};
    if (role === 'trainer') {
      const students = await this.prisma.user.findMany({
        where: { trainerId: userId },
        select: { id: true },
      });
      where.userId = { in: students.map((s) => s.id) };
    } else {
      where.userId = userId;
    }
    return this.prisma.weeklySchedule.findMany({
      where,
      include: {
        trainingSheet: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { weekStart: 'desc' },
    });
  }

  async removeWeekly(id: number) {
    const ws = await this.prisma.weeklySchedule.findUnique({ where: { id } });
    if (!ws) throw new NotFoundException('Weekly schedule not found');
    await this.prisma.schedule.deleteMany({ where: { weeklyScheduleId: id } });
    await this.prisma.weeklySchedule.delete({ where: { id } });
  }
}
