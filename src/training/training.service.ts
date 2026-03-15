import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private prisma: PrismaService) {}

  findAll(q?: string) {
    return this.prisma.training.findMany({
      where: q ? { title: { contains: q, mode: 'insensitive' } } : undefined,
      include: { exercises: true },
    });
  }

  async findOne(id: number) {
    const training = await this.prisma.training.findUnique({
      where: { id },
      include: { exercises: true },
    });
    if (!training) throw new NotFoundException('Training not found');
    return training;
  }

  async create(data: any) {
    const { exercises, ...rest } = data;
    return this.prisma.training.create({
      data: {
        ...rest,
        exercises: { create: exercises },
      },
      include: { exercises: true },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    const { exercises, ...rest } = data;
    if (exercises) {
      await this.prisma.exercise.deleteMany({ where: { trainingId: id } });
    }
    return this.prisma.training.update({
      where: { id },
      data: {
        ...rest,
        ...(exercises ? { exercises: { create: exercises } } : {}),
      },
      include: { exercises: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.training.delete({ where: { id } });
  }
}
