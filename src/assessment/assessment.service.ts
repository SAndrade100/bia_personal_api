import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.assessment.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: number) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  create(data: any) {
    return this.prisma.assessment.create({
      data: {
        userId: +data.studentId,
        date: new Date(data.date),
        weight: data.weight,
        fatPercent: data.fatPercent,
        leanMass: data.leanMass,
        fatMass: data.fatMass,
        measurements: data.measurements,
        skinfolds: data.skinfolds,
        notes: data.notes,
      },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.assessment.update({ where: { id }, data });
  }
}
