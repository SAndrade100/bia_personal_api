import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  private normalise(a: any) {
    return {
      ...a,
      date: (a.date instanceof Date ? a.date : new Date(a.date)).toISOString().slice(0, 10),
    };
  }

  async findAll(userId: number) {
    const rows = await this.prisma.assessment.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
    return rows.map((r) => this.normalise(r));
  }

  async findOne(id: number) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return this.normalise(assessment);
  }

  async create(data: any) {
    const userId = +data.studentId;
    const row = await this.prisma.assessment.create({
      data: {
        userId,
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
    // Keep User.currentWeight in sync with latest assessment
    if (data.weight) {
      await this.prisma.user.update({ where: { id: userId }, data: { currentWeight: data.weight } });
    }
    return this.normalise(row);
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    const row = await this.prisma.assessment.update({ where: { id }, data });
    return this.normalise(row);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.assessment.delete({ where: { id } });
  }
}
