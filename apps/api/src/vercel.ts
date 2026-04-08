import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './app.module';
import * as express from 'express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

const server = express();

let isInitialized = false;

async function bootstrap() {
  if (isInitialized) return;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  const config = app.get(
    (await import('@nestjs/config')).ConfigService,
  );

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: config.get('FRONTEND_URL') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  isInitialized = true;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  server(req, res);
}
