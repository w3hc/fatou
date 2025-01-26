import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AiModule } from './ai/ai.module';
import { ApiKeyGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { Web3Module } from './web3/web3.module';
import { DatabaseModule } from './database/database.module';
import { ApiKeysModule } from './api-keys/api-keys.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AiModule,
    AuthModule,
    Web3Module,
    DatabaseModule,
    ApiKeysModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
