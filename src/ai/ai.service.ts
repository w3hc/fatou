import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  async askClaude(message: string): Promise<string> {
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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: message }],
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
