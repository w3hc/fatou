import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ethers } from 'ethers';
import {
  ClaudeApiResponse,
  CostMetrics,
  ClaudeResponse,
  Conversation,
} from '../common/types';
import { DatabaseService } from '../database/database.service';
import { CostTrackingService } from '../database/cost-tracking.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

// Basic ERC20Votes ABI for minting
const OUF_TOKEN_ABI = [
  'function mint(address to, uint256 amount)',
  'function owner() view returns (address)',
  'function decimals() view returns (uint8)',
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly INPUT_COST_PER_1K = 0.015;
  private readonly OUTPUT_COST_PER_1K = 0.075;
  private readonly MAX_CONTEXT_MESSAGES = 10;
  private provider: ethers.JsonRpcProvider;
  private tokenContract: ethers.Contract;
  private signer: ethers.Wallet;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
    private costTrackingService: CostTrackingService,
    private apiKeysService: ApiKeysService,
  ) {
    // Initialize Web3 provider and contract
    const rpcUrl = this.configService.get<string>('ARBITRUM_RPC_URL');
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const tokenAddress = this.configService.get<string>('OUF_TOKEN_ADDRESS');

    if (rpcUrl && privateKey && tokenAddress) {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.tokenContract = new ethers.Contract(
        tokenAddress,
        OUF_TOKEN_ABI,
        this.signer,
      );
      this.logger.log('Web3 provider and token contract initialized');
    } else {
      this.logger.warn(
        'Missing Web3 configuration. Token minting will be disabled.',
      );
    }
  }

  async loadContextFiles(contextId: string): Promise<string> {
    try {
      // Construct the context directory path directly from contextId
      this.logger.log(`Given context id: ${contextId}`);

      const contextDir = join(process.cwd(), 'data', 'contexts', contextId);
      this.logger.log(`Looking for context files in directory: ${contextDir}`);

      let dirExists = false;
      try {
        const stat = await fs.stat(contextDir);
        dirExists = stat.isDirectory();
      } catch {
        dirExists = false;
      }

      if (!dirExists) {
        this.logger.warn(`No context directory found for ID ${contextId}`);
        return '';
      }

      // Read all files in the context directory
      const files = await fs.readdir(contextDir);
      this.logger.log(`Found ${files.length} files in context directory`);

      let contextContent = '';
      let loadedFiles = 0;

      // Read and concatenate content from each file
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = join(contextDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          contextContent += `\n\n${content}`;
          loadedFiles++;
        }
      }

      this.logger.log(`Successfully loaded ${loadedFiles} markdown files`);
      return contextContent;
    } catch (error) {
      this.logger.error('Error loading context files:', error);
      return '';
    }
  }

  private async mintTokens(to: string, cost: number): Promise<void> {
    try {
      if (!this.tokenContract || !this.signer) {
        throw new Error('Token contract not initialized');
      }

      // Get token decimals
      const decimals = await this.tokenContract.decimals();

      // Convert cost to token amount (1:1 ratio with cost)
      const tokenAmount = ethers.parseUnits(cost.toString(), decimals);

      // Verify owner
      const owner = await this.tokenContract.owner();
      if (owner.toLowerCase() !== this.signer.address.toLowerCase()) {
        throw new Error('Signer is not the token owner');
      }

      // Mint tokens
      const tx = await this.tokenContract.mint(to, tokenAmount);
      this.logger.debug(`Transaction hash: ${tx.hash}`);
      await tx.wait();

      this.logger.log(`Successfully minted ${cost} OUF tokens to ${to}`);
    } catch (error) {
      this.logger.error('Error minting tokens:', error);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  async askClaude(
    message: string,
    file: Express.Multer.File | undefined,
    conversationId?: string,
    apiKey?: string,
    walletAddress?: string,
    contextId?: string,
  ): Promise<ClaudeResponse> {
    const anthropicApiKey = this.validateConfig();

    try {
      let conversation: Conversation | null = null;
      let contextContent = '';

      // Handle existing conversation
      if (conversationId) {
        conversation =
          await this.databaseService.getConversation(conversationId);
        if (!conversation) {
          conversationId = undefined;
        }
      }

      // Create new conversation if needed
      if (!conversation) {
        conversationId = await this.databaseService.createConversation(
          file?.originalname,
          file ? await fs.readFile(file.path, 'utf-8') : undefined,
        );
        conversation =
          await this.databaseService.getConversation(conversationId);
      }

      // Load context based on auth method
      if (apiKey) {
        const apiKeyData = await this.apiKeysService.findApiKey(apiKey);
        if (apiKeyData) {
          contextContent = await this.loadContextFiles(apiKeyData.id);
        }
      } else if (contextId) {
        contextContent = await this.loadContextFiles(contextId);
      }

      // Process request
      const content = await this.preparePrompt(
        message,
        conversation,
        contextContent,
      );
      const response = await this.callClaudeApi(content, anthropicApiKey);
      const costs = this.calculateCosts(response.usage);

      // Handle costs and tokens
      if (apiKey) {
        const apiKeyData = await this.apiKeysService.findApiKey(apiKey);
        if (apiKeyData?.walletAddress) {
          await this.costTrackingService.trackRequest(
            apiKeyData.walletAddress,
            costs,
            message,
            conversationId,
          );
        }
      }

      // Mint tokens if wallet address is provided
      this.logger.debug('walletAddress:', walletAddress);
      if (walletAddress) {
        await this.mintTokens(walletAddress, costs.totalCost).catch((error) => {
          this.logger.error('Token minting failed:', error);
        });
      }

      // Save conversation history
      await this.databaseService.addMessage(conversationId, {
        role: 'user',
        content: message,
      });
      await this.databaseService.addMessage(conversationId, {
        role: 'assistant',
        content: response.content[0].text,
      });

      return {
        answer: response.content[0].text,
        costs,
        conversationId,
      };
    } catch (error) {
      this.logger.error('AI service error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      if (error.message.includes('Claude API error')) {
        throw new HttpException(
          `Error from Claude API: ${error.message}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException(
        error.message || 'Error processing AI request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async preparePrompt(
    message: string,
    conversation: Conversation | null,
    contextContent: string = '',
  ): Promise<string> {
    let prompt = '';
    this.logger.log('Preparing prompt with following components:');

    // Add context content if available
    if (contextContent) {
      this.logger.log('- Adding context content from context files');
      prompt += `${contextContent}\n\n`;
    }

    if (conversation) {
      // Add file content if it exists
      if (conversation.fileContent) {
        this.logger.log('- Adding uploaded file content');
        prompt += `${conversation.fileContent}\n\n`;
      }

      if (conversation.messages.length > 0) {
        const recentMessages = conversation.messages.slice(
          -this.MAX_CONTEXT_MESSAGES,
        );
        this.logger.log(
          `- Adding ${recentMessages.length} recent messages from conversation history`,
        );
        prompt += 'Previous conversation:\n\n';
        for (const msg of recentMessages) {
          prompt += `${msg.content}\n\n`;
        }
      }
    }

    this.logger.log('- Adding current user message');
    prompt += `${message}\n\n`;

    return prompt;
  }

  private calculateCosts(usage: {
    input_tokens: number;
    output_tokens: number;
  }): CostMetrics {
    const inputCost = (usage.input_tokens / 1000) * this.INPUT_COST_PER_1K;
    const outputCost = (usage.output_tokens / 1000) * this.OUTPUT_COST_PER_1K;

    return {
      inputCost: Number(inputCost.toFixed(4)),
      outputCost: Number(outputCost.toFixed(4)),
      totalCost: Number((inputCost + outputCost).toFixed(4)),
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
    };
  }

  private validateConfig(): string {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new HttpException(
        'Anthropic API key is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return apiKey;
  }

  private async callClaudeApi(
    content: string,
    apiKey: string,
  ): Promise<ClaudeApiResponse> {
    this.logger.debug('Initiating Claude API request');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content }],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text}`);
      }

      if (!response.ok) {
        throw new Error(
          `Claude API error: ${response.status} - ${JSON.stringify(data)}`,
        );
      }

      return data;
    } catch (error) {
      this.logger.error('Error calling Claude API:', error);
      throw new HttpException(
        error.message || 'Error communicating with Claude API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private handleError(error: any): never {
    this.logger.error('AI service error:', error);

    if (error instanceof HttpException) {
      throw error;
    }

    throw new HttpException(
      'Error processing AI analysis request',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
