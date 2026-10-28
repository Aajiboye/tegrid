// `tsc` does not rewrite the `src/*` path alias, so the compiled output in `dist` needs
// module-alias to resolve imports written as `src/...` at runtime. In development we run through
// ts-node, where `tsconfig-paths/register` already maps `src/*` to the TypeScript sources; if
// module-alias were registered there too it would load duplicate compiled copies from `dist`
// (e.g. two different `JobTypeRepository` classes), which breaks Nest dependency injection.
// So only register it when executing the compiled `.js` output.
if (__filename.endsWith('.js')) {
  require('module-alias/register');
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { AdminService } from './domain/identity/services/admin.service';
import { CurrencyMiddleware } from './shared/middleware/currency.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const options = new DocumentBuilder()
    .setTitle('TradeExpertGrid API')
    .setDescription('TradeExpertGrid API DOC')
    .setVersion('1.0')
    .addServer(`http://localhost:${port}/`, 'Local environment')
    .addServer('https://staging.yourapi.com/', 'Staging')
    .addServer('https://production.yourapi.com/', 'Production')
    .addTag('TradeExpertGrid API')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  // Swagger UI at /docs
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Raw OpenAPI JSON at /docs-json
  app.use('/docs-json', (_req, res) => res.json(document));

  // Global ValidationPipe with options
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Remove properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are found
      exceptionFactory: (errors) => {
        return new BadRequestException(errors);
      },
    }),
  );
  app.enableCors();
  app.use(new CurrencyMiddleware().use);

  await app.listen(port);
  Logger.log(`~ Application is running on: ${await app.getUrl()}`);

  // Ensure root admin exists (run after app boot to avoid module init ordering issues)
  try {
    const adminService = app.get(AdminService);
    if (adminService && typeof adminService.createRootAdminIfNotExists === 'function') {
      await adminService.createRootAdminIfNotExists('admin@tradeexpertgrid.com', 'Password@123');
      Logger.log('Root admin ensured');
    }
  } catch (err) {
    Logger.error('Failed to ensure root admin', err as any);
  }
}
bootstrap();
