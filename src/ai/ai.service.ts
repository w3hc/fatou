import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  async askClaude(message: string, file: Express.Multer.File): Promise<string> {
    const apiKey = this.validateConfig();

    try {
      const content = await this.preparePrompt(message, file);
      const response = await this.callClaudeApi(content, apiKey);
      return response;
    } catch (error) {
      this.handleError(error);
    }
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
  ): Promise<string> {
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
    return data.content[0].text;
  }

  private handleError(error: any): never {
    this.logger.error('AI service error:', error);

    throw new HttpException(
      'Error processing AI analysis request',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
