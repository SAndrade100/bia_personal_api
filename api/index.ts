import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';

let cachedApp: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  cachedApp = await NestFactory.create(AppModule, { logger: false });
  cachedApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  cachedApp.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  });
  await cachedApp.init();
  return cachedApp;
}

export default async (req: any, res: any) => {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
};
