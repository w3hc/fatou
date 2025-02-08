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
    const walletAddress = request.header('x-wallet-address');
    const masterKey = this.configService.get<string>('MASTER_KEY');

    // Check master key first
    if (apiKey === masterKey) return true;

    // If API key provided, validate it
    if (apiKey) {
      const isValidApiKey = await this.apiKeysService.validateApiKey(apiKey);
      if (isValidApiKey) return true;
    }

    // If wallet address provided, check if it's associated with any API key
    if (walletAddress) {
      const apiKeys = await this.apiKeysService.listApiKeys(walletAddress);
      if (apiKeys.some((key) => key.isActive)) {
        // Store the found API key in the request for later use
        request.apiKey = apiKeys.find((key) => key.isActive);
        return true;
      }
    }

    throw new UnauthorizedException(
      'Authentication required - provide either API key or wallet address',
    );
  }
}
