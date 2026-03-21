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

    const students = await this.prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, birthdate: true,
        height: true, currentWeight: true, targetWeight: true, startWeight: true,
        goal: true, startDate: true, plan: true, status: true, avatar: true, notes: true,
      },
    });

    // Compute extra fields from Schedule + Assessment
    const ids = students.map((s) => s.id);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [doneSchedules, allDoneSchedules, latestAssessments] = await Promise.all([
      // Weekly done schedules
      this.prisma.schedule.findMany({
        where: { userId: { in: ids }, done: true, date: { gte: weekStart } },
        select: { userId: true },
      }),
      // All done schedules (for totalWorkouts + lastWorkout + streak)
      this.prisma.schedule.findMany({
        where: { userId: { in: ids }, done: true },
        select: { userId: true, date: true },
        orderBy: { date: 'desc' },
      }),
      // Latest assessment per student (fatPercent)
      this.prisma.assessment.findMany({
        where: { userId: { in: ids } },
        select: { userId: true, fatPercent: true, date: true },
        orderBy: { date: 'desc' },
      }),
    ]);

    // Build lookup maps
    const weeklyDoneMap = new Map<number, number>();
    for (const s of doneSchedules) {
      weeklyDoneMap.set(s.userId, (weeklyDoneMap.get(s.userId) || 0) + 1);
    }

    const totalMap = new Map<number, number>();
    const lastWorkoutMap = new Map<number, string>();
    const streakMap = new Map<number, number>();
    const schedulesByUser = new Map<number, Date[]>();

    for (const s of allDoneSchedules) {
      totalMap.set(s.userId, (totalMap.get(s.userId) || 0) + 1);
      if (!lastWorkoutMap.has(s.userId)) {
        lastWorkoutMap.set(s.userId, s.date instanceof Date ? s.date.toISOString().slice(0, 10) : String(s.date).slice(0, 10));
      }
      if (!schedulesByUser.has(s.userId)) schedulesByUser.set(s.userId, []);
      schedulesByUser.get(s.userId)!.push(new Date(s.date));
    }

    // Compute streak per user
    for (const [uid, dates] of schedulesByUser) {
      const uniqueDays = [...new Set(dates.map(d => d.toISOString().slice(0, 10)))].sort().reverse();
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
      streakMap.set(uid, streak);
    }

    const fatMap = new Map<number, number>();
    for (const a of latestAssessments) {
      if (!fatMap.has(a.userId) && a.fatPercent != null) {
        fatMap.set(a.userId, a.fatPercent);
      }
    }

    return students.map((s) => {
      const bd = s.birthdate instanceof Date ? s.birthdate.toISOString().slice(0, 10) : s.birthdate ? String(s.birthdate).slice(0, 10) : null;
      const sd = s.startDate instanceof Date ? s.startDate.toISOString().slice(0, 10) : s.startDate ? String(s.startDate).slice(0, 10) : null;
      return {
        ...s,
        birthdate: bd,
        startDate: sd,
        weeklyDone: weeklyDoneMap.get(s.id) || 0,
        weeklyGoal: 3,
        totalWorkouts: totalMap.get(s.id) || 0,
        lastWorkout: lastWorkoutMap.get(s.id) || null,
        streak: streakMap.get(s.id) || 0,
        fatPercent: fatMap.get(s.id) ?? 0,
      };
    });
  }

  async findOne(trainerId: number, studentId: number, section?: string) {
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, trainerId },
    });
    if (!student) throw new NotFoundException('Student not found');

    if (section === 'anamnesis') {
      const ana = await this.prisma.anamnesis.findFirst({
        where: { userId: studentId, isCurrent: true },
      });
      if (ana) {
        return { ...ana, filledAt: (ana.filledAt instanceof Date ? ana.filledAt : new Date(ana.filledAt)).toISOString() };
      }
      return null;
    }
    if (section === 'assessments') {
      const rows = await this.prisma.assessment.findMany({
        where: { userId: studentId },
        orderBy: { date: 'asc' },
      });
      return rows.map((r) => ({
        ...r,
        date: (r.date instanceof Date ? r.date : new Date(r.date)).toISOString().slice(0, 10),
      }));
    }
    if (section === 'progress') {
      const [assessments, schedules, personalRecords, user] = await Promise.all([
        this.prisma.assessment.findMany({ where: { userId: studentId }, orderBy: { date: 'asc' }, select: { date: true, weight: true } }),
        this.prisma.schedule.findMany({ where: { userId: studentId, done: true }, select: { date: true, trainingId: true }, orderBy: { date: 'desc' } }),
        this.prisma.personalRecord.findMany({ where: { userId: studentId } }),
        this.prisma.user.findUnique({ where: { id: studentId }, select: { startWeight: true, currentWeight: true } }),
      ]);

      const weightHistory = assessments.map((a) => ({
        date: (a.date instanceof Date ? a.date : new Date(a.date)).toISOString().slice(0, 10),
        value: a.weight,
      }));

      // weekly workouts
      const weekMap = new Map<string, number>();
      for (const s of schedules) {
        const d = new Date(s.date);
        const weekNum = Math.ceil((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 86400000));
        const key = `Sem ${weekNum}`;
        weekMap.set(key, (weekMap.get(key) || 0) + 1);
      }
      const weeklyWorkouts = Array.from(weekMap.entries())
        .map(([week, count]) => ({ week, count }))
        .sort((a, b) => parseInt(a.week.replace('Sem ', ''), 10) - parseInt(b.week.replace('Sem ', ''), 10));

      // total hours
      const trainingIds = [...new Set(schedules.map((s) => s.trainingId))];
      let totalMinutes = 0;
      if (trainingIds.length > 0) {
        const trainings = await this.prisma.training.findMany({ where: { id: { in: trainingIds } }, select: { id: true, duration: true } });
        const durMap = new Map(trainings.map((t) => [t.id, t.duration]));
        for (const s of schedules) totalMinutes += durMap.get(s.trainingId) || 0;
      }

      // streak
      const uniqueDays = [...new Set(schedules.map((s) => {
        const d = s.date instanceof Date ? s.date : new Date(s.date);
        return d.toISOString().slice(0, 10);
      }))].sort().reverse();
      let streak = 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let check = new Date(today);
      for (const dayStr of uniqueDays) {
        const checkStr = check.toISOString().slice(0, 10);
        if (dayStr === checkStr) { streak++; check.setDate(check.getDate() - 1); }
        else if (dayStr < checkStr) break;
      }

      const weightLost = user?.startWeight && user?.currentWeight
        ? +(user.startWeight - user.currentWeight).toFixed(1) : 0;

      return {
        weightHistory,
        weeklyWorkouts,
        personalRecords: personalRecords.map((r) => ({
          ...r,
          date: (r.date instanceof Date ? r.date : new Date(r.date)).toISOString().slice(0, 10),
        })),
        summary: { totalWorkouts: schedules.length, totalHours: +(totalMinutes / 60).toFixed(1), weightLost, streak },
      };
    }

    // Compute extra fields similar to findAll for a single student
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [doneSchedules, allDoneSchedules, latestAssessment] = await Promise.all([
      this.prisma.schedule.findMany({ where: { userId: studentId, done: true, date: { gte: weekStart } }, select: { userId: true } }),
      this.prisma.schedule.findMany({ where: { userId: studentId, done: true }, select: { userId: true, date: true }, orderBy: { date: 'desc' } }),
      this.prisma.assessment.findFirst({ where: { userId: studentId }, orderBy: { date: 'desc' } }),
    ]);

    const weeklyDone = (doneSchedules || []).length;
    const totalWorkouts = (allDoneSchedules || []).length;

    let lastWorkout: string | null = null;
    const schedules: Date[] = [];
    for (const s of allDoneSchedules) {
      if (!lastWorkout) lastWorkout = s.date instanceof Date ? s.date.toISOString().slice(0, 10) : String(s.date).slice(0, 10);
      schedules.push(new Date(s.date));
    }

    // compute streak
    let streak = 0;
    if (schedules.length > 0) {
      const uniqueDays = [...new Set(schedules.map(d => d.toISOString().slice(0, 10)))].sort().reverse();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let check = new Date(today);
      for (const dayStr of uniqueDays) {
        const checkStr = check.toISOString().slice(0, 10);
        if (dayStr === checkStr) {
          streak++; check.setDate(check.getDate() - 1);
        } else if (dayStr < checkStr) {
          break;
        }
      }
    }

    const fatPercent = latestAssessment?.fatPercent ?? 0;

    // Use latest assessment weight as currentWeight if available
    const currentWeight = latestAssessment?.weight ?? student.currentWeight;

    const { password, ...result } = student;
    const bd = result.birthdate instanceof Date ? result.birthdate.toISOString().slice(0, 10) : result.birthdate ? String(result.birthdate).slice(0, 10) : null;
    const sd = result.startDate instanceof Date ? result.startDate.toISOString().slice(0, 10) : result.startDate ? String(result.startDate).slice(0, 10) : null;
    return {
      ...result,
      birthdate: bd,
      startDate: sd,
      currentWeight,
      weeklyDone,
      weeklyGoal: 3,
      totalWorkouts,
      lastWorkout,
      streak,
      fatPercent,
    };
  }

  async create(trainerId: number, data: any) {
    const hashed = await bcrypt.hash('changeme', 10);
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: 'student',
        phone: data.phone || '',
        birthdate: data.birthdate ? new Date(data.birthdate) : null,
        height: data.height ? Number(data.height) : null,
        startWeight: data.startWeight ? Number(data.startWeight) : null,
        currentWeight: data.startWeight ? Number(data.startWeight) : null,
        targetWeight: data.targetWeight ? Number(data.targetWeight) : null,
        goal: data.goal || null,
        plan: data.plan || null,
        startDate: new Date(),
        status: 'active',
        trainerId,
      },
    });
  }

  async update(trainerId: number, studentId: number, data: any) {
    const student = await this.prisma.user.findFirst({ where: { id: studentId, trainerId } });
    if (!student) throw new NotFoundException('Student not found');

    // Only pass valid User columns to Prisma (strip computed/read-only fields)
    const { name, email, phone, birthdate, height, currentWeight, targetWeight, startWeight, goal, plan, status, avatar, notes } = data;
    const cleaned: Record<string, any> = {};
    if (name !== undefined) cleaned.name = name;
    if (email !== undefined) cleaned.email = email;
    if (phone !== undefined) cleaned.phone = phone;
    if (birthdate !== undefined) cleaned.birthdate = birthdate ? new Date(birthdate) : null;
    if (height !== undefined) cleaned.height = height ? Number(height) : null;
    if (currentWeight !== undefined) cleaned.currentWeight = currentWeight ? Number(currentWeight) : null;
    if (targetWeight !== undefined) cleaned.targetWeight = targetWeight ? Number(targetWeight) : null;
    if (startWeight !== undefined) cleaned.startWeight = startWeight ? Number(startWeight) : null;
    if (goal !== undefined) cleaned.goal = goal;
    if (plan !== undefined) cleaned.plan = plan;
    if (status !== undefined) cleaned.status = status;
    if (avatar !== undefined) cleaned.avatar = avatar;
    if (notes !== undefined) cleaned.notes = notes;

    return this.prisma.user.update({ where: { id: studentId }, data: cleaned });
  }

  async remove(trainerId: number, studentId: number) {
    const student = await this.prisma.user.findFirst({ where: { id: studentId, trainerId } });
    if (!student) throw new NotFoundException('Student not found');

    // Delete all related records before deleting the user
    await Promise.all([
      this.prisma.schedule.deleteMany({ where: { userId: studentId } }),
      this.prisma.assessment.deleteMany({ where: { userId: studentId } }),
      this.prisma.anamnesis.deleteMany({ where: { userId: studentId } }),
      this.prisma.personalRecord.deleteMany({ where: { userId: studentId } }),
      this.prisma.diaryEntry.deleteMany({ where: { userId: studentId } }),
      this.prisma.chatMessage.deleteMany({ where: { OR: [{ senderId: studentId }, { receiverId: studentId }] } }),
    ]);
    // NutritionPlan cascades to Meal → MealItem
    await this.prisma.nutritionPlan.deleteMany({ where: { userId: studentId } });
    await this.prisma.user.delete({ where: { id: studentId } });
  }
}
