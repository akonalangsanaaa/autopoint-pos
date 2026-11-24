import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, AccountStatus } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findById(userId: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { userId } });
  }

  async findAll(
    page = 1,
    limit = 10,
    role?: string,
    accountStatus?: string,
  ): Promise<{ data: Partial<User>[]; page: number; limit: number; totalItems: number }> {
    const query = this.userRepository.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    if (accountStatus) {
      query.andWhere('user.accountStatus = :accountStatus', { accountStatus });
    }

    const [users, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.userId', 'ASC')
      .getManyAndCount();

    // Never return passwordHash
    const data = users.map(({ passwordHash, ...rest }) => rest);

    return { data, page, limit, totalItems: total };
  }

  async create(createUserDto: CreateUserDto): Promise<Partial<User>> {
    const existing = await this.findByUsername(createUserDto.username);
    if (existing) {
      throw new ConflictException({
        success: false,
        statusCode: 409,
        message: 'Username already exists.',
        errors: [`A user with username ${createUserDto.username} already exists.`],
        timestamp: new Date().toISOString(),
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    const user = this.userRepository.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      username: createUserDto.username,
      passwordHash,
      role: createUserDto.role,
      accountStatus: AccountStatus.ACTIVE,
    });

    const saved = await this.userRepository.save(user);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async update(userId: number, updateUserDto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: 'User not found.',
        errors: [`No user exists with ID ${userId}.`],
        timestamp: new Date().toISOString(),
      });
    }

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }
    if (updateUserDto.accountStatus !== undefined) {
      user.accountStatus = updateUserDto.accountStatus;
    }

    const saved = await this.userRepository.save(user);
    const { passwordHash: _, ...result } = saved;
    return result;
  }
}

