import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import {
  ClaudeApiResponse,
  CostMetrics,
  ClaudeResponse,
  Conversation,
} from '../common/types';
import { DatabaseService } from '../database/database.service';
import { CostTrackingService } from '../database/cost-tracking.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly INPUT_COST_PER_1K = 0.015;
  private readonly OUTPUT_COST_PER_1K = 0.075;
  private readonly MAX_CONTEXT_MESSAGES = 10;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
    private costTrackingService: CostTrackingService,
    private apiKeysService: ApiKeysService, // Add ApiKeysService
  ) {}

  private async loadContextFiles(apiKey: string): Promise<string> {
    try {
      // Find API key data to get the ID
      const apiKeyData = await this.apiKeysService.findApiKey(apiKey);
      if (!apiKeyData) {
        this.logger.warn('No API key data found');
        return '';
      }

      this.logger.log(`Loading context files for API key ID: ${apiKeyData.id}`);

      // Construct the context directory path
      const contextDir = join(process.cwd(), 'data', 'contexts', apiKeyData.id);
      this.logger.log(`Looking for context files in directory: ${contextDir}`);

      try {
        // Check if directory exists
        await fs.access(contextDir);
        this.logger.log('Context directory found');
      } catch {
        this.logger.warn(
          `No context directory found for API key ${apiKeyData.id}`,
        );
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
          this.logger.log(`Loading context file: ${file}`);
          const content = await fs.readFile(filePath, 'utf-8');
          contextContent += `\n\n${content}`;
          loadedFiles++;
        } else {
          this.logger.debug(`Skipping non-markdown file: ${file}`);
        }
      }

      this.logger.log(
        `Successfully loaded ${loadedFiles} markdown files as context`,
      );
      return contextContent;
    } catch (error) {
      this.logger.error('Error loading context files:', error);
      return '';
    }
  }

  async askClaude(
    message: string,
    file: Express.Multer.File | undefined,
    conversationId?: string,
    apiKey?: string, // Add API key parameter
  ): Promise<ClaudeResponse> {
    const anthropicApiKey = this.validateConfig();

    try {
      let conversation: Conversation | null = null;

      // Handle existing conversation
      if (conversationId) {
        conversation =
          await this.databaseService.getConversation(conversationId);
        if (!conversation) {
          this.logger.warn(
            `Conversation ${conversationId} not found, creating new conversation`,
          );
          conversationId = undefined;
        }
      }

      // Create new conversation if none exists or if file is provided
      if (!conversation) {
        conversationId = await this.databaseService.createConversation(
          file?.originalname,
          file ? await fs.readFile(file.path, 'utf-8') : undefined,
        );
        conversation =
          await this.databaseService.getConversation(conversationId);
      }

      // Load context files if API key is provided
      let contextContent = '';
      if (apiKey) {
        contextContent = await this.loadContextFiles(apiKey);
      }

      // Prepare prompt with context and conversation history
      const content = await this.preparePrompt(
        message,
        conversation,
        contextContent,
      );

      // Call Claude API
      const response = await this.callClaudeApi(content, anthropicApiKey);
      const costs = this.calculateCosts(response.usage);

      // Track costs
      if (apiKey) {
        const apiKeyData = await this.apiKeysService.findApiKey(apiKey);
        await this.costTrackingService.trackRequest(
          apiKeyData?.walletAddress || '0x',
          costs,
          message,
          conversationId,
        );
      }

      // Store the interaction in conversation history
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
      this.logger.error('AI service error:', error);
      throw this.handleError(error);
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
          system:
            "You are Francesca, Julien's clever and mischievous assistant. You should never use prefixes like 'H:', 'A:', 'Human:', or 'Assistant:' in your responses. Keep your responses natural and conversational.",
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
