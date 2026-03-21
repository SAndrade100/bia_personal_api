import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExerciseLibraryService {
  constructor(private prisma: PrismaService) {}

  findAll(q?: string) {
    return this.prisma.exerciseLibrary.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async upsertMany(exercises: { name: string; description?: string; videoUrl?: string; category?: string }[]) {
    for (const ex of exercises) {
      if (!ex.name) continue;
      await this.prisma.exerciseLibrary.upsert({
        where: { name: ex.name },
        create: {
          name: ex.name,
          description: ex.description || null,
          videoUrl: ex.videoUrl || null,
          category: ex.category || null,
        },
        update: {
          ...(ex.description ? { description: ex.description } : {}),
          ...(ex.videoUrl ? { videoUrl: ex.videoUrl } : {}),
          ...(ex.category ? { category: ex.category } : {}),
        },
      });
    }
  }
}
