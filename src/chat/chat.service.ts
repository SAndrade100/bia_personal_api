import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(userId: number, role: string, studentId?: string) {
    const parseId = (v: any): number | null => {
      if (typeof v === 'number') return Number.isFinite(v) ? v : null;
      if (!v) return null;
      const s = String(v);
      // try plain numeric
      if (/^-?\d+$/.test(s)) return Number(s);
      // extract digits (handles values like "u1")
      const digits = s.replace(/\D/g, '');
      if (!digits) return null;
      const n = Number(digits);
      return Number.isFinite(n) ? n : null;
    };

    const userNum = parseId(userId);
    const studentNum = role === 'trainer' && studentId ? parseId(studentId) : null;

    if (!userNum) {
      return [];
    }

    let participantA = userNum;
    let participantB: number;

    if (role === 'trainer' && studentNum) {
      participantB = studentNum;
    } else {
      // Student: find their trainer
      const student = await this.prisma.user.findUnique({
        where: { id: userNum },
        select: { trainerId: true },
      });
      if (!student?.trainerId) return [];
      participantB = student.trainerId;
    }

    // Get messages where both participants are involved
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: participantA, receiverId: participantB },
          { senderId: participantB, receiverId: participantA },
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
    const parseId = (v: any): number => {
      if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
      if (!v) return 0;
      const s = String(v);
      if (/^-?\d+$/.test(s)) return Number(s);
      const digits = s.replace(/\D/g, '');
      const n = Number(digits || 0);
      return Number.isFinite(n) ? n : 0;
    };

    const studentUserId = parseId(data.studentId);
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
      receiverId,
    };
  }
}
