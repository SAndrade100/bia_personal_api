import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingSheetService {
  constructor(private prisma: PrismaService) {}

  findAll(q?: string) {
    return this.prisma.trainingSheet.findMany({
      where: q ? { title: { contains: q, mode: 'insensitive' } } : undefined,
      include: {
        days: {
          include: { training: { include: { exercises: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const sheet = await this.prisma.trainingSheet.findUnique({
      where: { id },
      include: {
        days: {
          include: { training: { include: { exercises: true } } },
        },
      },
    });
    if (!sheet) throw new NotFoundException('Training sheet not found');
    return sheet;
  }

  async create(data: { title: string; days: { trainingId: number; weekdays: number[] }[] }) {
    return this.prisma.trainingSheet.create({
      data: {
        title: data.title,
        days: {
          create: data.days.map((d) => ({
            trainingId: d.trainingId,
            weekdays: d.weekdays,
          })),
        },
      },
      include: {
        days: {
          include: { training: { include: { exercises: true } } },
        },
      },
    });
  }

  async update(id: number, data: { title?: string; days?: { trainingId: number; weekdays: number[] }[] }) {
    await this.findOne(id);

    if (data.days) {
      await this.prisma.trainingSheetDay.deleteMany({ where: { trainingSheetId: id } });
    }

    return this.prisma.trainingSheet.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.days
          ? {
              days: {
                create: data.days.map((d) => ({
                  trainingId: d.trainingId,
                  weekdays: d.weekdays,
                })),
              },
            }
          : {}),
      },
      include: {
        days: {
          include: { training: { include: { exercises: true } } },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.trainingSheet.delete({ where: { id } });
  }
}
