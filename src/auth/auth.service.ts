import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async generateMessage(address: string): Promise<string> {
    const nonce = uuidv4();
    const timestamp = Date.now();

    const message = `Welcome to Ouf!\n\nPlease sign this message to verify your ownership of the address:\n${address}\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    this.logger.debug(`Generated message for address ${address}: ${message}`);
    return message;
  }

  async verifySignature(
    message: string,
    signature: string,
    address: string,
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

      this.logger.debug(
        `Signature verification result for ${address}: ${isValid}`,
      );
      this.logger.debug(`Recovered address: ${recoveredAddress}`);

      return isValid;
    } catch (error) {
      this.logger.error('Signature verification error:', error);
      return false;
    }
  }
}
