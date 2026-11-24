import { ApiErrorFilter } from './common/api-error.filter';
import { resolve } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global prefix matching the lab design
  app.setGlobalPrefix('api/v1');

  app.useStaticAssets(resolve(process.cwd(), 'public'));

  // Global validation pipe (class-validator)
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip non-decorated properties
      forbidNonWhitelisted: true,
      transform: true,           // auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, process.env.APP_HOST || '127.0.0.1');
  console.log(`🚀 POS Backend running on http://localhost:${port}/api/v1`);
}
bootstrap();



