import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskClaudeDto {
  @ApiProperty({
    description: 'The message to send to Claude',
    example: 'Who are you? (in 1 word)',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Optional markdown file for additional context',
  })
  @IsOptional()
  file?: any;

  @ApiProperty({
    description: 'ID of the conversation to continue',
    required: false,
    example: '',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
