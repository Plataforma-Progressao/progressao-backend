import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';
import { AppModule } from '../src/app.module';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';

const server = express();

let isInitialized = false;
let app: Awaited<ReturnType<typeof NestFactory.create>>;

async function bootstrap(): Promise<express.Express> {
  if (!isInitialized) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn'],
    });

    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders:
        'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-CSRF-Token,X-Api-Version',
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalInterceptors(new TransformResponseInterceptor());

    await app.init();
    isInitialized = true;
  }

  return server;
}

export default async function handler(
  req: Request,
  res: Response,
): Promise<void> {
  const expressApp = await bootstrap();
  expressApp(req, res);
}
