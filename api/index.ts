import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

let cachedApp: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  cachedApp = await NestFactory.create(AppModule, { logger: false });
  cachedApp.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
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
