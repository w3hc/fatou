import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';

class MessageDto {
  message: string;
}

@ApiTags('AI')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  @HttpCode(200)
  @ApiOperation({ summary: 'Ask a question to Claude' })
  @ApiResponse({ status: 200, description: 'Returns the response from Claude' })
  @ApiBody({
    type: MessageDto,
    description: 'The message to send to Claude',
    examples: {
      example1: {
        summary: "Ask about Ghana's capital",
        value: {
          message: "Hello! What's the capital of Ghana, please?",
        },
      },
    },
  })
  async askClaude(@Body() messageDto: MessageDto): Promise<{ answer: string }> {
    this.logger.log(`Received message in controller: ${messageDto.message}`);
    const answer = await this.aiService.askClaude(messageDto.message);
    return { answer };
  }
}
