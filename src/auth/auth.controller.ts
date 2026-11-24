import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from '../users/dto/create-user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/sessions
   * Public endpoint – Login and receive JWT token
   */
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('registrations')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }
}
