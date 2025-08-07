import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Activer la validation globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Supprime les propriétés non définies dans le DTO
    forbidNonWhitelisted: true, // Lève une erreur si des propriétés non autorisées sont envoyées
    transform: true, // Transforme automatiquement les types
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
