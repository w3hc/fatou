import { Module } from '@nestjs/common';
import { ApiKeyGuard } from './auth.guard';

@Module({
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class AuthModule {}
