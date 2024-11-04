import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

interface UserCosts {
  totalCosts: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
  };
  requests: {
    timestamp: string;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
    message: string;
    conversationId: string;
  }[];
}

interface CostDatabase {
  users: {
    [walletAddress: string]: UserCosts;
  };
  global: {
    totalInputCost: number;
    totalOutputCost: number;
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalRequests: number;
    lastUpdated: string;
  };
}

@Injectable()
export class CostTrackingService implements OnModuleInit {
  private dbPath: string;
  private data: CostDatabase;

  constructor() {
    this.dbPath = join(process.cwd(), 'data', 'costs.json');
    this.data = {
      users: {},
      global: {
        totalInputCost: 0,
        totalOutputCost: 0,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalRequests: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  async onModuleInit() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = join(process.cwd(), 'data');
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      // Initialize or load existing database
      try {
        await fs.access(this.dbPath);
        const content = await fs.readFile(this.dbPath, 'utf-8');
        this.data = JSON.parse(content);
      } catch (error) {
        // If file doesn't exist or is invalid, create with default data
        await this.saveData();
      }
    } catch (error) {
      console.error('Failed to initialize cost tracking database:', error);
      throw error;
    }
  }

  private async saveData(): Promise<void> {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save cost tracking database:', error);
      throw error;
    }
  }

  async trackRequest(
    walletAddress: string,
    costs: {
      inputCost: number;
      outputCost: number;
      totalCost: number;
      inputTokens: number;
      outputTokens: number;
    },
    message: string,
    conversationId: string,
  ): Promise<void> {
    // Initialize user data if it doesn't exist
    if (!this.data.users[walletAddress]) {
      this.data.users[walletAddress] = {
        totalCosts: {
          inputCost: 0,
          outputCost: 0,
          totalCost: 0,
          inputTokens: 0,
          outputTokens: 0,
        },
        requests: [],
      };
    }

    // Update user totals
    const user = this.data.users[walletAddress];
    user.totalCosts.inputCost += costs.inputCost;
    user.totalCosts.outputCost += costs.outputCost;
    user.totalCosts.totalCost += costs.totalCost;
    user.totalCosts.inputTokens += costs.inputTokens;
    user.totalCosts.outputTokens += costs.outputTokens;

    // Add request to user history
    user.requests.push({
      timestamp: new Date().toISOString(),
      ...costs,
      message,
      conversationId,
    });

    // Update global totals
    this.data.global.totalInputCost += costs.inputCost;
    this.data.global.totalOutputCost += costs.outputCost;
    this.data.global.totalCost += costs.totalCost;
    this.data.global.totalInputTokens += costs.inputTokens;
    this.data.global.totalOutputTokens += costs.outputTokens;
    this.data.global.totalRequests += 1;
    this.data.global.lastUpdated = new Date().toISOString();

    await this.saveData();
  }

  async getUserStats(walletAddress: string): Promise<UserCosts | null> {
    return this.data.users[walletAddress] || null;
  }

  async getGlobalStats() {
    return this.data.global;
  }

  async getUserList(): Promise<
    Array<{ walletAddress: string; totalCost: number; requestCount: number }>
  > {
    return Object.entries(this.data.users).map(([walletAddress, userData]) => ({
      walletAddress,
      totalCost: userData.totalCosts.totalCost,
      requestCount: userData.requests.length,
    }));
  }

  async clearUserHistory(walletAddress: string): Promise<void> {
    if (this.data.users[walletAddress]) {
      // Subtract user totals from global totals
      const userTotals = this.data.users[walletAddress].totalCosts;
      this.data.global.totalInputCost -= userTotals.inputCost;
      this.data.global.totalOutputCost -= userTotals.outputCost;
      this.data.global.totalCost -= userTotals.totalCost;
      this.data.global.totalInputTokens -= userTotals.inputTokens;
      this.data.global.totalOutputTokens -= userTotals.outputTokens;
      this.data.global.totalRequests -=
        this.data.users[walletAddress].requests.length;

      // Remove user data
      delete this.data.users[walletAddress];
      await this.saveData();
    }
  }
}
