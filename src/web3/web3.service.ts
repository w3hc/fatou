import { Injectable } from '@nestjs/common';

@Injectable()
export class Web3Service {
  getHello(): string {
    return 'Hello Web3!';
  }
}
