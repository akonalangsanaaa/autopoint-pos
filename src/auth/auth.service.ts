import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AccountStatus } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsername(loginDto.username);

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: 'Invalid username or password.',
        errors: ['The credentials do not match an active account.'],
        timestamp: new Date().toISOString(),
      });
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: 'Account is inactive.',
        errors: ['This account has been deactivated.'],
        timestamp: new Date().toISOString(),
      });
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: 'Invalid username or password.',
        errors: ['The credentials do not match an active account.'],
        timestamp: new Date().toISOString(),
      });
    }

    const payload = {
      sub: user.userId,
      username: user.username,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      expiresIn: 3600, // 1 hour in seconds
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}

