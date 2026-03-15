import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(userId: number, role: string, studentId?: string) {
    const targetUserId = role === 'trainer' && studentId ? +studentId : userId;

    // get messages where user is sender or receiver with the counterpart
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: targetUserId },
          { receiverId: targetUserId },
        ],
      },
      orderBy: { time: 'asc' },
      include: {
        sender: { select: { id: true, role: true } },
      },
    });

    return messages.map((m) => ({
      id: m.id,
      from: m.sender.role,
      text: m.text,
      time: m.time,
    }));
  }

  async sendMessage(senderId: number, senderRole: string, data: any) {
    // find the counterpart
    const studentUserId = +data.studentId;
    let receiverId: number;

    if (senderRole === 'trainer') {
      receiverId = studentUserId;
    } else {
      // student sending — find their trainer
      const student = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { trainerId: true },
      });
      receiverId = student?.trainerId ?? 0;
    }

    const msg = await this.prisma.chatMessage.create({
      data: {
        senderId,
        receiverId,
        text: data.text,
      },
    });

    return {
      id: msg.id,
      from: senderRole,
      text: msg.text,
      time: msg.time,
    };
  }
}
