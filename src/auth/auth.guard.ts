import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
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

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header('api-key');
    const masterKey = this.configService.get<string>('MASTER_KEY');

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Check master key first
    if (apiKey === masterKey) {
      return true;
    }

    // Validate against registered API keys
    const isValidApiKey = await this.apiKeysService.validateApiKey(apiKey);
    if (!isValidApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
