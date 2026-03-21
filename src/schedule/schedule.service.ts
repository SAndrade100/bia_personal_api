import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

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
    return rows.map((s) => ({
      ...s,
      date: (s.date instanceof Date ? s.date : new Date(s.date)).toISOString().slice(0, 10),
    }));
  }

  create(data: any) {
    return this.prisma.schedule.create({
      data: {
        userId: +data.studentId,
        trainingId: +data.trainingId,
        date: new Date(data.date),
        time: data.time,
        title: data.title,
      },
    }).then((s) => ({
      ...s,
      date: (s.date instanceof Date ? s.date : new Date(s.date)).toISOString().slice(0, 10),
    }));
  }

  async update(id: number, data: any) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Schedule not found');
    const updated = await this.prisma.schedule.update({ where: { id }, data });
    return {
      ...updated,
      date: (updated.date instanceof Date ? updated.date : new Date(updated.date)).toISOString().slice(0, 10),
    };
  }

  async remove(id: number) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Schedule not found');
    await this.prisma.schedule.delete({ where: { id } });
  }
}
