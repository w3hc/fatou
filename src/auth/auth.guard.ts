import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
// import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const apiKey = request.header('x-api-key');
    const contextId = request.header('x-context-id');
    const walletAddress = request.header('x-wallet-address');
    const masterKey = this.configService.get<string>('MASTER_KEY');

    if (apiKey) {
      if (apiKey === masterKey) return true;
      const isValidApiKey = await this.apiKeysService.validateApiKey(apiKey);
      if (isValidApiKey) return true;
      throw new UnauthorizedException('Invalid API key');
    }

    if (contextId && walletAddress) {
      const apiKeyData = await this.apiKeysService.findApiKeyById(contextId);
      if (!apiKeyData) throw new UnauthorizedException('Invalid context ID');
      return true;
    }

    throw new UnauthorizedException(
      'Authentication required - provide either API key or context-id/wallet-address headers',
    );
  }
}
