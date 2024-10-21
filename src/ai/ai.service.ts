import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  async askClaude(
    message: string,
    file?: Express.Multer.File,
  ): Promise<string> {
    this.logger.log(`Received message in service: ${message}`);

    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.error('Anthropic API key is not set');
      throw new HttpException(
        'Anthropic API key is not set',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      this.logger.log('Sending request to Claude API');

      let content = message;

      if (file && file.buffer) {
        this.logger.log(`Processing file: ${file.originalname}`);
        const fileContent = file.buffer.toString('utf-8');
        content += `\n\nHere's the content of the uploaded file ${file.originalname}:\n\n${fileContent}`;
      } else if (file) {
        this.logger.log(`File received but no buffer: ${file.originalname}`);
      } else {
        this.logger.log('No file uploaded');
      }

      const messages = [{ role: 'user', content }];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          messages: messages,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorMessage = `HTTP error! status: ${response.status}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      this.logger.log('Received response from Claude API');
      return data.content[0].text;
    } catch (error) {
      this.logger.error('Error communicating with Claude API:', error);
      throw new HttpException(
        'Error communicating with Claude API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
