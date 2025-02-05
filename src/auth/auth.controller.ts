import { Controller, Post, Body, Logger, Header } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsString, IsEthereumAddress } from 'class-validator';
import { Public } from './public.decorator';

export class GetMessageDto {
  @IsEthereumAddress()
  address: string;
}

export class VerifySignatureDto {
  @IsString()
  message: string;

  @IsString()
  signature: string;

  @IsEthereumAddress()
  address: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('message')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type')
  async getMessage(
    @Body() { address }: GetMessageDto,
  ): Promise<{ message: string }> {
    this.logger.debug(`Generating message for address: ${address}`);
    const message = await this.authService.generateMessage(address);
    return { message };
  }

  @Public()
  @Post('verify')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type')
  async verify(
    @Body() { message, signature, address }: VerifySignatureDto,
  ): Promise<{
    verified: boolean;
    address?: string;
  }> {
    this.logger.debug(`Verifying signature for address: ${address}`);
    const isValid = await this.authService.verifySignature(
      message,
      signature,
      address,
    );

    if (isValid) {
      this.logger.debug(
        `Successfully verified signature for address: ${address}`,
      );
    } else {
      this.logger.warn(`Failed to verify signature for address: ${address}`);
    }

    return {
      verified: isValid,
      address: isValid ? address : undefined,
    };
  }
}
