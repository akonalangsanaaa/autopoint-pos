import { IsEnum, IsOptional } from 'class-validator';
import { UserRole, AccountStatus } from '../user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}
