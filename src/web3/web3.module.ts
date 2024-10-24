import { Module } from '@nestjs/common';
import { AuthController } from './web3.controller';
import { Web3Service } from './web3.service';

@Module({
  controllers: [AuthController],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class Web3Module {}
