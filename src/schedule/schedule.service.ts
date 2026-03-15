import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: number, month?: string) {
    const where: any = { userId };
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }
    return this.prisma.schedule.findMany({ where, orderBy: { date: 'asc' } });
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
    });
  }

  async update(id: number, data: any) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Schedule not found');
    return this.prisma.schedule.update({ where: { id }, data });
  }

  async remove(id: number) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Schedule not found');
    await this.prisma.schedule.delete({ where: { id } });
  }
}
