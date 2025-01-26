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
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

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
  @ApiOperation({ summary: 'Create new API key' })
  @ApiHeader({ name: 'x-api-key', description: 'Master API key' })
  async createApiKey(
    @Body() body: { walletAddress: string },
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateMasterKey(apiKey);
    const newKey = await this.apiKeysService.createApiKey(body.walletAddress);
    return { key: newKey.key };
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
