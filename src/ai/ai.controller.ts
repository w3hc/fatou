import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Express } from 'express';
import { AiService } from './ai.service';
import { AskClaudeDto } from './askClaude.dto';
import { ClaudeResponse } from '../common/types';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file && !file.originalname.toLowerCase().endsWith('.md')) {
          cb(
            new BadRequestException('Only markdown (.md) files are supported'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiOperation({
    summary: 'Ask questions with or without application context',
    description:
      'Submit questions to Claude in two modes:\n\n' +
      '1. With Context: Attach a markdown (.md) file containing context (persona, knowledge base, etc). ' +
      'Claude will use this context to shape its responses.\n\n' +
      '2. General Questions: Without a file attachment, Claude will answer based on existing conversation history.\n\n' +
      'Use conversationId to continue an existing conversation in either mode.',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: true,
    example: 'your-api-key-here',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Question with optional context file and conversation ID',
    type: AskClaudeDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Response successful',
    schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          description: 'AI-generated response to the question',
        },
        usage: {
          type: 'object',
          properties: {
            costs: {
              type: 'object',
              properties: {
                inputCost: { type: 'number' },
                outputCost: { type: 'number' },
                totalCost: { type: 'number' },
                inputTokens: { type: 'number' },
                outputTokens: { type: 'number' },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        conversationId: {
          type: 'string',
          description: 'ID to use for continuing this conversation',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (bad file format, missing message)',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  @ApiResponse({
    status: 413,
    description: 'File too large (>5MB)',
  })
  async askClaude(
    @Body() askClaudeDto: AskClaudeDto,
    @UploadedFile() file?: Express.Multer.File,
    @Headers('x-api-key') apiKey?: string,
  ): Promise<{
    answer: string;
    usage: { costs: ClaudeResponse['costs']; timestamp: string };
    conversationId: string;
  }> {
    this.logger.debug({
      message: 'Processing AI request',
      questionText: askClaudeDto.message,
      conversationId: askClaudeDto.conversationId,
      fileName: file?.originalname,
      id: askClaudeDto.id,
      walletAddress: askClaudeDto.walletAddress,
    });

    const result = await this.aiService.askClaude(
      askClaudeDto.message,
      file,
      askClaudeDto.conversationId,
      apiKey,
      askClaudeDto.walletAddress,
      askClaudeDto.id,
    );

    return {
      answer: result.answer,
      usage: {
        costs: result.costs,
        timestamp: new Date().toISOString(),
      },
      conversationId: result.conversationId,
    };
  }
}
