/**
 * Simple seed script to create a default Admin user.
 * Run with: npx ts-node src/seed.ts
 * (Make sure the database is running and .env is configured)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { UserRole } from './users/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const password = process.env.POS_ADMIN_PASSWORD;
    if (!password || password.length < 8) throw new Error('Set POS_ADMIN_PASSWORD to at least 8 characters.');
    const existing = await usersService.findByUsername('admin');
    if (existing) {
      console.log('Admin user already exists.');
    } else {
      await usersService.create({
        firstName: 'System',
        lastName: 'Admin',
        username: 'admin',
        password,
        role: UserRole.ADMIN,
      });
      console.log('✅ Default Admin created successfully!');
      console.log('   Username: admin');

    }
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();

