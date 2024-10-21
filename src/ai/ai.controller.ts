import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  UseInterceptors,
  UploadedFile,
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

@ApiTags('AI')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Ask a question to Claude with optional markdown file',
  })
  @ApiResponse({ status: 200, description: 'Returns the response from Claude' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Message to Claude with optional file',
    type: AskClaudeDto,
  })
  async askClaude(
    @Body() askClaudeDto: AskClaudeDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ answer: string }> {
    this.logger.log(`Received message in controller: ${askClaudeDto.message}`);
    this.logger.log(`Received file: ${file?.originalname}`);
    const answer = await this.aiService.askClaude(askClaudeDto.message, file);
    return { answer };
  }
}
