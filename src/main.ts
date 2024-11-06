import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Fatou')
    .setDescription(
      'Fatou is a Nest.js-based API that interacts with AI and Web3 services. ' +
        'All endpoints require authentication via API key unless marked as public.',
    )
    .setVersion('0.1')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Please enter your API key',
      },
      'api-key',
    )
    .addTag('AI', 'Artificial Intelligence related endpoints')
    .addTag('Web3', 'Web3 related endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      displayRequestDuration: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'Fatou API Documentation',
  });

  await app.listen(3000);
}
bootstrap();
