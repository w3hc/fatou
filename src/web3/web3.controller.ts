import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';
import { Web3Service } from './web3.service';
import { Public } from '../auth/public.decorator';

export class GetMessageDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977',
  })
  @IsEthereumAddress()
  walletAddress: string;
}

export class VerifySignatureDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977',
  })
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Message that was signed',
    example:
      'zhankai_auth_0xd8a394e7d7894bdf2c57139ff17e5cbaa29dd977_1729772340442_caa3334b-2dec-4f4e-8aa4-0415f2eb3e71',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Signature hash obtained from Etherscan',
    example: '0x123...abc',
  })
  @IsNotEmpty()
  @IsString()
  signature: string;
}

export class VerifyResponseDto {
  @ApiProperty({
    description: 'Generated API key for accessing protected endpoints',
    example: '歡迎來到倉鼠宇宙',
  })
  apiKey: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly web3Service: Web3Service) {}

  @Public()
  @Post('get-message')
  @ApiOperation({
    summary: 'Get message to sign',
    description:
      'Returns a unique message that needs to be signed using Etherscan to prove wallet ownership',
  })
  @ApiBody({ type: GetMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated message to sign',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Sign this message to authenticate with Zhankai\nWallet: 0x742d...\nTimestamp: 1698123456789\nNonce: abc-123',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Ethereum address provided',
  })
  async getMessage(@Body() body: GetMessageDto) {
    const message = await this.web3Service.generateMessageToSign(
      body.walletAddress,
    );
    return { message };
  }

  @Public()
  @Post('verify')
  @ApiOperation({
    summary: 'Verify signature and check token balance',
    description:
      'Verifies the signature from Etherscan and checks if the wallet holds the required token balance. If successful, returns an API key.',
  })
  @ApiBody({ type: VerifySignatureDto })
  @ApiResponse({
    status: 200,
    description: 'Signature verified and token balance sufficient',
    type: VerifyResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid signature or insufficient token balance',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid signature or Insufficient token balance',
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body format',
  })
  async verify(@Body() body: VerifySignatureDto): Promise<VerifyResponseDto> {
    const isValidSignature = await this.web3Service.verifySignature(
      body.message,
      body.signature,
      body.walletAddress,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    const hasTokens = await this.web3Service.checkTokenBalance(
      body.walletAddress,
    );

    if (!hasTokens) {
      throw new UnauthorizedException('Insufficient token balance');
    }

    const apiKey = await this.web3Service.generateApiKey(body.walletAddress);
    return { apiKey };
  }
}
