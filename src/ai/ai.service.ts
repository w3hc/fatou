import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import {
  ClaudeApiResponse,
  CostMetrics,
  ClaudeResponse,
} from '../common/types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  // Claude 3 Opus pricing per 1K tokens (as of March 2024)
  private readonly INPUT_COST_PER_1K = 0.015;
  private readonly OUTPUT_COST_PER_1K = 0.075;

  constructor(private configService: ConfigService) {}

  async askClaude(
    message: string,
    file: Express.Multer.File,
  ): Promise<ClaudeResponse> {
    const apiKey = this.validateConfig();

    try {
      const content = await this.preparePrompt(message, file);
      const response = await this.callClaudeApi(content, apiKey);
      const costs = this.calculateCosts(response.usage);

      this.logger.log({
        message: 'Claude API request completed',
        costs,
        timestamp: new Date().toISOString(),
      });

      return {
        answer: response.content[0].text,
        costs,
      };
    } catch (error) {
      this.handleError(error);
    }
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

  private async preparePrompt(
    message: string,
    file: Express.Multer.File,
  ): Promise<string> {
    this.logger.debug('Preparing analysis prompt');

    try {
      const fileContent = await fs.readFile(file.path, 'utf-8');

      return `Here's the content of the application description file ${file.originalname}:

${fileContent}

Based on this application description, please address the following question:
${message}

Please provide a detailed and specific answer that directly relates to the code and architecture shown in the description file.`;
    } catch (error) {
      this.logger.error('Error reading file:', error);
      throw new HttpException(
        'Error reading uploaded file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async callClaudeApi(
    content: string,
    apiKey: string,
  ): Promise<ClaudeApiResponse> {
    this.logger.debug('Initiating Claude API request');

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  private handleError(error: any): never {
    this.logger.error('AI service error:', error);

    throw new HttpException(
      'Error processing AI analysis request',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
