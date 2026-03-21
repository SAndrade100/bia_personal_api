import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  /** Maps userId → Set of socket IDs */
  private userSockets = new Map<number, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUser(client: Socket): { id: number; role: string } | null {
    const token =
      (client.handshake.auth?.token as string) ??
      client.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? 'dev_secret',
      });
      return { id: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  }

  handleConnection(client: Socket) {
    const user = this.extractUser(client);
    if (!user) {
      client.disconnect();
      return;
    }
    (client as any).user = user;

    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set());
    }
    this.userSockets.get(user.id)!.add(client.id);

    // Join a personal room so we can emit to a user by id
    client.join(`user:${user.id}`);
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user as { id: number } | undefined;
    if (user) {
      const sockets = this.userSockets.get(user.id);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(user.id);
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: { text: string; studentId?: string }) {
    const user = (client as any).user as { id: number; role: string };
    if (!user) return;

    const saved = await this.chatService.sendMessage(user.id, user.role, {
      text: payload.text,
      studentId: payload.studentId,
    });

    const receiverId = (saved as any).receiverId as number;
    // Strip receiverId from the message sent to clients
    const msg = { id: saved.id, from: saved.from, text: saved.text, time: saved.time };

    // Emit to both sender and receiver
    this.server.to(`user:${user.id}`).emit('newMessage', msg);
    if (receiverId) {
      this.server.to(`user:${receiverId}`).emit('newMessage', msg);
    }
  }
}
