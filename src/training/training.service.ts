import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExerciseLibraryService } from '../exercise-library/exercise-library.service';

@Injectable()
export class TrainingService {
  constructor(
    private prisma: PrismaService,
    private exerciseLibrary: ExerciseLibraryService,
  ) {}

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
    const cleanExercises = (exercises || []).map((e: any) => ({
      name: e.name,
      reps: e.reps,
      rest: e.rest,
      description: e.description || null,
      videoUrl: e.videoUrl || null,
    }));
    const training = await this.prisma.training.create({
      data: {
        ...rest,
        exercises: { create: cleanExercises },
      },
      include: { exercises: true },
    });
    // Save exercises to library
    await this.exerciseLibrary.upsertMany(
      cleanExercises.map((e: any) => ({ name: e.name, description: e.description, videoUrl: e.videoUrl, category: rest.category })),
    );
    return training;
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    const { exercises, ...rest } = data;
    if (exercises) {
      await this.prisma.exercise.deleteMany({ where: { trainingId: id } });
    }
    const cleanExercises = exercises
      ? exercises.map((e: any) => ({
          name: e.name,
          reps: e.reps,
          rest: e.rest,
          description: e.description || null,
          videoUrl: e.videoUrl || null,
        }))
      : undefined;
    const training = await this.prisma.training.update({
      where: { id },
      data: {
        ...rest,
        ...(cleanExercises ? { exercises: { create: cleanExercises } } : {}),
      },
      include: { exercises: true },
    });
    // Save exercises to library
    if (cleanExercises) {
      await this.exerciseLibrary.upsertMany(
        cleanExercises.map((e: any) => ({ name: e.name, description: e.description, videoUrl: e.videoUrl, category: rest.category })),
      );
    }
    return training;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.schedule.deleteMany({ where: { trainingId: id } });
    await this.prisma.training.delete({ where: { id } });
  }
}
