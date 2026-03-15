import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get()
  getMessages(@Req() req: any, @Query('studentId') studentId?: string) {
    return this.service.getMessages(req.user.id, req.user.role, studentId);
  }

  @Post()
  send(@Req() req: any, @Body() body: any) {
    return this.service.sendMessage(req.user.id, req.user.role, body);
  }
}
