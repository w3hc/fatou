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
        if (!file.originalname.toLowerCase().endsWith('.md')) {
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
    summary:
      'Analyze application description file and answer related questions',
    description:
      'Submit a markdown file containing application description and ask questions about it. ' +
      'The AI will analyze the file and provide detailed responses based on the content.',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: true,
    example: 'your-api-key-here',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Question about the application with accompanying description file',
    type: AskClaudeDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis successful',
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
                inputCost: {
                  type: 'number',
                  description: 'Cost for input tokens',
                },
                outputCost: {
                  type: 'number',
                  description: 'Cost for output tokens',
                },
                totalCost: {
                  type: 'number',
                  description: 'Total cost of the request',
                },
                inputTokens: {
                  type: 'number',
                  description: 'Number of input tokens',
                },
                outputTokens: {
                  type: 'number',
                  description: 'Number of output tokens',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of the request',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid file format or missing required parameters',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Only markdown (.md) files are supported',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing API key',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid API key' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 413,
    description: 'Payload Too Large - File size exceeds limit',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 413 },
        message: { type: 'string', example: 'File size exceeds the 5MB limit' },
        error: { type: 'string', example: 'Payload Too Large' },
      },
    },
  })
  async askClaude(
    @Body() askClaudeDto: AskClaudeDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{
    answer: string;
    usage: { costs: ClaudeResponse['costs']; timestamp: string };
  }> {
    if (!file) {
      throw new BadRequestException('Application description file is required');
    }

    this.logger.debug({
      message: 'Processing AI analysis request',
      questionText: askClaudeDto.message,
      fileName: file.originalname,
      fileSize: file.size,
    });

    const result = await this.aiService.askClaude(askClaudeDto.message, file);

    this.logger.debug({
      message: 'AI analysis completed',
      questionText: askClaudeDto.message,
      responseLength: result.answer.length,
      costs: result.costs,
    });

    return {
      answer: result.answer,
      usage: {
        costs: result.costs,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
