import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join } from 'path';

interface SignatureRecord {
  walletAddress: string;
  timestamp: string;
}

interface SignatureDatabase {
  signatures: {
    [walletAddress: string]: SignatureRecord;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly dbPath: string;
  private db: SignatureDatabase;

  constructor() {
    this.dbPath = join(process.cwd(), 'data', 'sigs.json');
    this.db = { signatures: {} };
  }

  async onModuleInit() {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    // Load or create the database file
    try {
      const content = await fs.readFile(this.dbPath, 'utf-8');
      this.db = JSON.parse(content);
    } catch (error) {
      this.logger.warn('No existing sigs.json found, creating new database');
      await this.saveDatabase();
    }
  }

  private async saveDatabase(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 2));
  }

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

      if (isValid) {
        // Store the signature record
        await this.storeSignature(address);
      }

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

  private async storeSignature(walletAddress: string): Promise<void> {
    // Create or update signature record
    this.db.signatures[walletAddress.toLowerCase()] = {
      walletAddress: walletAddress.toLowerCase(),
      timestamp: new Date().toISOString(),
    };

    await this.saveDatabase();
  }

  async getLastSignatureTimestamp(
    walletAddress: string,
  ): Promise<string | null> {
    const record = this.db.signatures[walletAddress.toLowerCase()];
    return record ? record.timestamp : null;
  }

  async isSignatureValid(
    walletAddress: string,
    validityPeriod: number = 24 * 60 * 60 * 1000,
  ): Promise<boolean> {
    const record = this.db.signatures[walletAddress.toLowerCase()];
    if (!record) return false;

    const lastSignature = new Date(record.timestamp).getTime();
    const now = Date.now();

    return now - lastSignature <= validityPeriod;
  }

  async clearExpiredSignatures(
    validityPeriod: number = 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const now = Date.now();
    const addresses = Object.keys(this.db.signatures);

    for (const address of addresses) {
      const lastSignature = new Date(
        this.db.signatures[address].timestamp,
      ).getTime();
      if (now - lastSignature > validityPeriod) {
        delete this.db.signatures[address];
      }
    }

    await this.saveDatabase();
  }
}
