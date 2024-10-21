import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { Web3Module } from './web3/web3.module';

@Module({
  imports: [AiModule, Web3Module],
  controllers: [],
  providers: [],
})
export class AppModule {}
