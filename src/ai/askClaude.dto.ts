import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEthereumAddress,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskClaudeDto {
  @ApiProperty({
    description: 'The message to send to Claude',
    example: 'Who are you?',
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
    description: 'ID of the context directory',
    required: false,
    example: '2c9326c2-ee02-4227-be6d-a42866de8bcc',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'ID of the conversation to continue',
    required: false,
    example: 'abc123-def456',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({
    description: 'Ethereum wallet address',
    required: false,
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  })
  @IsOptional()
  @IsEthereumAddress()
  walletAddress?: string;
}
