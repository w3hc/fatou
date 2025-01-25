import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import {
  ClaudeApiResponse,
  CostMetrics,
  ClaudeResponse,
  Conversation,
} from '../common/types';
import { DatabaseService } from '../database/database.service';
import { CostTrackingService } from '../database/cost-tracking.service';

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
  ) {}

  async askClaude(
    message: string,
    file: Express.Multer.File | undefined,
    conversationId?: string,
  ): Promise<ClaudeResponse> {
    const apiKey = this.validateConfig();

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

        this.logger.debug({
          message: 'Created new conversation',
          conversationId,
          fileName: file?.originalname,
          hasFileContent: !!file,
        });
      }

      // Prepare prompt with conversation history
      const content = await this.preparePrompt(message, conversation);

      // Log prompt for debugging (excluding sensitive data)
      this.logger.debug({
        message: 'Prepared prompt',
        promptLength: content.length,
        conversationId,
        hasFileContent: !!conversation?.fileContent,
        messageCount: conversation?.messages.length,
      });

      // Call Claude API
      const response = await this.callClaudeApi(content, apiKey);
      const costs = this.calculateCosts(response.usage);

      await this.costTrackingService.trackRequest(
        '0x',
        costs,
        message,
        conversationId,
      );

      // Store the interaction in conversation history
      await this.databaseService.addMessage(conversationId, {
        role: 'user',
        content: message,
      });
      await this.databaseService.addMessage(conversationId, {
        role: 'assistant',
        content: response.content[0].text,
      });

      this.logger.debug({
        message: 'Added messages to conversation',
        conversationId,
        messageCount: 2,
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
  ): Promise<string> {
    let prompt = '';

    if (conversation) {
      // Add file content if it exists (now treated as context)
      if (conversation.fileContent) {
        prompt += `${conversation.fileContent}\n\n`;
      }

      if (conversation.messages.length > 0) {
        const recentMessages = conversation.messages.slice(
          -this.MAX_CONTEXT_MESSAGES,
        );
        prompt += 'Previous conversation:\n\n';
        for (const msg of recentMessages) {
          prompt += `${msg.content}\n\n`;
        }
      }
    }

    // Add current question without Human: prefix
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
