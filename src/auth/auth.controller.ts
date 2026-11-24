import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('sessions')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/sessions
   * Public endpoint – Login and receive JWT token
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
