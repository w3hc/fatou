import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Express } from 'express';
import { AiService } from './ai.service';
import { AskClaudeDto } from './askClaude.dto';
import { ClaudeResponse } from '../common/types';

@ApiTags('AI')
@Controller('ai')
@ApiSecurity('api-key')
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
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  @ApiOperation({
    summary: 'Ask questions with conversation context',
    description:
      'Submit questions while maintaining conversation context. Include conversationId to continue an existing conversation. ' +
      'Optionally attach a markdown file for additional context.',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: true,
    example: 'your-api-key-here',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Question with optional file and conversation ID',
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
  async askClaude(
    @Body() askClaudeDto: AskClaudeDto,
    @UploadedFile() file?: Express.Multer.File,
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
    });

    const result = await this.aiService.askClaude(
      askClaudeDto.message,
      file,
      askClaudeDto.conversationId,
    );

    this.logger.debug({
      message: 'AI response completed',
      conversationId: result.conversationId,
      responseLength: result.answer.length,
      costs: result.costs,
    });

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
