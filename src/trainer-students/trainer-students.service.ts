import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TrainerStudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(trainerId: number, status?: string, q?: string) {
    const where: any = { trainerId, role: 'student' };
    if (status) where.status = status;
    if (q) where.name = { contains: q, mode: 'insensitive' };

    return this.prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, birthdate: true,
        height: true, currentWeight: true, targetWeight: true, startWeight: true,
        goal: true, startDate: true, plan: true, status: true, avatar: true, notes: true,
      },
    });
  }

  async findOne(trainerId: number, studentId: number, section?: string) {
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, trainerId },
    });
    if (!student) throw new NotFoundException('Student not found');

    if (section === 'anamnesis') {
      return this.prisma.anamnesis.findFirst({
        where: { userId: studentId, isCurrent: true },
      });
    }
    if (section === 'assessments') {
      return this.prisma.assessment.findMany({
        where: { userId: studentId },
        orderBy: { date: 'asc' },
      });
    }
    if (section === 'progress') {
      // reuse inline progress gathering
      const [assessments, schedules, personalRecords] = await Promise.all([
        this.prisma.assessment.findMany({ where: { userId: studentId }, orderBy: { date: 'asc' }, select: { date: true, weight: true } }),
        this.prisma.schedule.findMany({ where: { userId: studentId, done: true }, select: { date: true } }),
        this.prisma.personalRecord.findMany({ where: { userId: studentId } }),
      ]);
      return {
        weightHistory: assessments.map((a) => ({ date: a.date, value: a.weight })),
        personalRecords,
        summary: { totalWorkouts: schedules.length },
      };
    }

    const { password, ...result } = student;
    return result;
  }

  async create(trainerId: number, data: any) {
    const hashed = await bcrypt.hash('changeme', 10);
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: 'student',
        phone: data.phone,
        birthdate: data.birthdate ? new Date(data.birthdate) : null,
        height: data.height,
        startWeight: data.startWeight,
        currentWeight: data.startWeight,
        targetWeight: data.targetWeight,
        goal: data.goal,
        plan: data.plan,
        startDate: new Date(),
        status: 'active',
        trainerId,
      },
    });
  }

  async update(trainerId: number, studentId: number, data: any) {
    const student = await this.prisma.user.findFirst({ where: { id: studentId, trainerId } });
    if (!student) throw new NotFoundException('Student not found');
    return this.prisma.user.update({ where: { id: studentId }, data });
  }

  async remove(trainerId: number, studentId: number) {
    const student = await this.prisma.user.findFirst({ where: { id: studentId, trainerId } });
    if (!student) throw new NotFoundException('Student not found');
    await this.prisma.user.delete({ where: { id: studentId } });
  }
}
