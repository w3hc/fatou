import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class Web3Service {
  private readonly provider: ethers.Provider;
  private readonly tokenContract: ethers.Contract;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('BASE_RPC_URL'),
    );

    const tokenAddress = this.configService.get<string>('BASE_TOKEN_ADDRESS');
    this.tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address owner) view returns (uint256)'],
      this.provider,
    );
  }

  async generateMessageToSign(walletAddress: string): Promise<string> {
    const timestamp = Date.now();
    const nonce = uuidv4();
    return `zhankai_auth_${walletAddress.toLowerCase()}_${timestamp}_${nonce}`;
  }

  async verifySignature(
    message: string,
    signature: string,
    walletAddress: string,
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  async checkTokenBalance(walletAddress: string): Promise<boolean> {
    try {
      const balance = await this.tokenContract.balanceOf(walletAddress);
      const minRequired = ethers.parseUnits('1', 18);
      return balance >= minRequired;
    } catch (error) {
      return false;
    }
  }

  generateApiKey(): string {
    const apiKey = this.configService.get<string>('API_KEY');
    return apiKey;
  }
}
