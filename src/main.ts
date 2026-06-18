
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe — this is what activates every @IsString,
  // @IsIn, @IsUUID decorator in your DTOs at runtime.
  // Without this line, all DTO validation is completely silent and ignored.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strips unknown fields silently
      forbidNonWhitelisted: true, // rejects request if unknown fields present
      transform: true,            // auto-converts payloads to DTO class instances
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();