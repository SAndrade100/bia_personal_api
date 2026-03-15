import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3001', 'http://localhost:3000'];

  app.enableCors({ origin: allowedOrigins, credentials: true });

  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
