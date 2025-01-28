import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiKey } from './types';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService implements OnModuleInit {
  private readonly logger = new Logger(ApiKeysService.name);
  private dbPath: string;
  private apiKeys: { [key: string]: ApiKey };

  constructor() {
    this.dbPath = join(process.cwd(), 'data', 'api-keys.json');
    this.apiKeys = {};
  }

  async onModuleInit() {
    const dataDir = join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    try {
      const content = await fs.readFile(this.dbPath, 'utf-8');
      this.apiKeys = JSON.parse(content);
      this.logger.debug(`Loaded keys: ${Object.keys(this.apiKeys).join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to load API keys:', error);
      await this.saveData();
    }
  }

  private async saveData(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.apiKeys, null, 2));
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createApiKey(walletAddress: string): Promise<ApiKey> {
    const key = this.generateApiKey();
    const apiKey: ApiKey = {
      id: uuidv4(),
      key,
      walletAddress,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      isActive: true,
    };

    this.apiKeys[key] = apiKey;
    await this.saveData();
    this.logger.debug(`Created new key: ${key}`);
    return apiKey;
  }

  async validateApiKey(key: string): Promise<boolean> {
    this.logger.debug(`Validating key: ${key}`);
    const apiKey = this.apiKeys[key];
    if (!apiKey || !apiKey.isActive) return false;

    apiKey.lastUsedAt = new Date().toISOString();
    await this.saveData();
    return true;
  }

  async revokeApiKey(key: string): Promise<boolean> {
    this.logger.debug(`Attempting to revoke key: ${key}`);
    this.logger.debug(
      `Available keys: ${Object.keys(this.apiKeys).join(', ')}`,
    );

    const apiKey = this.apiKeys[key];
    if (!apiKey) {
      this.logger.debug('Key not found');
      return false;
    }

    apiKey.isActive = false;
    await this.saveData();
    this.logger.debug('Key revoked successfully');
    return true;
  }

  async listApiKeys(walletAddress: string): Promise<ApiKey[]> {
    return Object.values(this.apiKeys)
      .filter((key) => key.walletAddress === walletAddress)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findApiKey(key: string): Promise<ApiKey | null> {
    const apiKey = this.apiKeys[key];
    if (!apiKey || !apiKey.isActive) {
      return null;
    }
    return apiKey;
  }
}
