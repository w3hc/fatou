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
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { Express } from 'express';
import { AskClaudeDto } from './askClaude.dto';
import { diskStorage } from 'multer';
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
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  @ApiOperation({
    summary:
      'Analyze application description file and answer related questions',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns AI analysis, response, and usage costs',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or missing required parameters',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Question about the application with accompanying description file',
    type: AskClaudeDto,
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

    if (!file.originalname.toLowerCase().endsWith('.md')) {
      throw new BadRequestException('Only markdown (.md) files are supported');
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
