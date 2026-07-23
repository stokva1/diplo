import {ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from "@nestjs/platform-express";
import {AppModule} from './app.module';

async function bootstrap() {
    const app =
        await NestFactory.create<NestExpressApplication>(AppModule);

    if (process.env.NODE_ENV === "production") {
        app.set("trust proxy", 1);
    }

    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
        credentials: true,
    });

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();