import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiKey } from './types';
import * as crypto from 'crypto';
import { AssistantDetail } from './types';

interface AssistantDetails {
  slug?: string;
  assistantName?: string;
  introPhrase?: string;
  daoAddress?: string;
  daoNetwork?: string;
}

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
    // console.log('Saving API keys:', JSON.stringify(this.apiKeys, null, 2));
    await fs.writeFile(this.dbPath, JSON.stringify(this.apiKeys, null, 2));
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async verifySignatureTimestamp(
    walletAddress: string,
  ): Promise<boolean> {
    try {
      const sigsPath = join(process.cwd(), 'data', 'sigs.json');
      const sigsContent = await fs.readFile(sigsPath, 'utf-8');
      const sigsData = JSON.parse(sigsContent);

      const userSignature = sigsData.signatures[walletAddress.toLowerCase()];
      if (!userSignature) return false;

      const signatureTime = new Date(userSignature.timestamp).getTime();
      const currentTime = new Date().getTime();
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;

      return currentTime - signatureTime <= oneYearInMs;
    } catch (error) {
      this.logger.error('Error verifying signature timestamp:', error);
      return false;
    }
  }

  async createApiKey(
    walletAddress?: string,
    options: {
      slug?: string;
      assistantName?: string;
      introPhrase?: string;
      daoAddress?: string;
      daoNetwork?: string;
    } = {},
  ): Promise<ApiKey> {
    if (walletAddress) {
      const hasValidSignature =
        await this.verifySignatureTimestamp(walletAddress);
      if (!hasValidSignature) {
        throw new Error('Wallet must have logged in at least 1 year ago');
      }
    }

    const key = this.generateApiKey();
    const id = uuidv4();
    const apiKey: ApiKey = {
      id,
      key,
      ...(walletAddress && { walletAddress }),
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      isActive: true,
      slug: options.slug,
      assistantName: options.assistantName,
      introPhrase: options.introPhrase,
      daoAddress: options.daoAddress,
      daoNetwork: options.daoNetwork,
    };

    this.apiKeys[key] = apiKey;
    await this.saveData();

    const contextDir = join(process.cwd(), 'data', 'contexts', id);
    try {
      await fs.mkdir(contextDir, { recursive: true });
      this.logger.debug(`Created context directory for API key: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to create context directory for API key: ${id}`,
        error,
      );
    }

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
      .filter((key) => !walletAddress || key.walletAddress === walletAddress)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findApiKey(key: string): Promise<ApiKey | null> {
    const apiKey = this.apiKeys[key];
    return apiKey && apiKey.isActive ? apiKey : null;
  }

  async findApiKeyById(id: string): Promise<ApiKey | null> {
    const apiKey = Object.values(this.apiKeys).find((key) => key.id === id);
    return apiKey && apiKey.isActive ? apiKey : null;
  }

  async updateApiKey(
    key: string,
    details: Partial<AssistantDetails>,
  ): Promise<ApiKey | null> {
    const apiKey = this.apiKeys[key];
    if (!apiKey || !apiKey.isActive) return null;

    Object.assign(apiKey, details);
    await this.saveData();
    return apiKey;
  }

  async getAllAssistantDetails(): Promise<AssistantDetail[]> {
    return Object.values(this.apiKeys)
      .filter((key) => key.isActive)
      .map((key) => ({
        slug: key.slug || '',
        contextId: key.id || '',
        name: key.assistantName || '',
        introPhrase: key.introPhrase || '',
        daoAddress: key.daoAddress || '',
        daoNetwork: key.daoNetwork || '',
        adminAddress: key.walletAddress || '',
      }))
      .sort((a, b) => (a.slug || '').localeCompare(b.slug || ''));
  }
}
