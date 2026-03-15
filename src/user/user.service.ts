import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { trainer: { select: { name: true } } },
    });
    if (!user) return null;
    const { password, trainerId, ...result } = user;
    return {
      ...result,
      trainer: user.trainer?.name ?? null,
    };
  }

  async updateProfile(userId: number, data: UpdateUserDto) {
    await this.prisma.user.update({ where: { id: userId }, data });
    return this.getProfile(userId);
  }
}
