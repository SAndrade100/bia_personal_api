import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.id);
  }

  @Put()
  updateProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }
}
