import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiProperty,
  ApiResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IsEthereumAddress, IsOptional } from 'class-validator';

class CreateApiKeyDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977',
    required: false,
  })
  @IsEthereumAddress()
  @IsOptional()
  walletAddress?: string;
}

@ApiTags('API Keys')
@Controller('api-keys')
export class ApiKeysController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly configService: ConfigService,
  ) {}

  private validateMasterKey(apiKey: string | undefined): void {
    const masterKey = this.configService.get<string>('MASTER_KEY');
    if (!apiKey || apiKey !== masterKey) {
      throw new UnauthorizedException('Invalid master key');
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create new API key',
    description:
      'Creates a new API key for the specified wallet address. Requires master API key authentication. The wallet must have logged in at least 1 year ago.',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'Master API key required for authentication',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'The newly created API key',
          example: 'abc123def456',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized - Invalid master key or wallet has not met login requirements',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Wallet must have logged in at least 1 year ago',
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid wallet address format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid wallet address format' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async createApiKey(
    @Body() body: CreateApiKeyDto,
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateMasterKey(apiKey);
    try {
      const newKey = await this.apiKeysService.createApiKey(body.walletAddress);
      return { key: newKey.key };
    } catch (error) {
      if (error.message.includes('Wallet must have logged in')) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Revoke API key' })
  @ApiHeader({ name: 'x-api-key', description: 'Master API key' })
  async revokeApiKey(
    @Param('key') key: string,
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateMasterKey(apiKey);
    const success = await this.apiKeysService.revokeApiKey(key);
    return { success };
  }

  @Get('wallet/:address')
  @ApiOperation({ summary: 'List API keys for wallet' })
  async listApiKeys(@Param('address') address: string) {
    return this.apiKeysService.listApiKeys(address);
  }
}
