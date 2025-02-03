import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ApiKeysService } from './api-keys.service';

// DTO for the request body
export class ListFilesDto {
  @ApiProperty({
    description: 'Context directory ID',
    example: '2c9326c2-ee02-4227-be6d-a42866de8bcc',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

// DTO for the response
export class ListFilesResponseDto {
  @ApiProperty({
    description: 'Context directory ID',
    example: '2c9326c2-ee02-4227-be6d-a42866de8bcc',
  })
  id: string;

  @ApiProperty({
    description: 'Array of markdown files in the context directory',
    example: ['context1.md', 'context2.md'],
  })
  files: string[];
}

@ApiTags('API Keys')
@Controller('context-files')
export class ContextFilesController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('list-files')
  @ApiOperation({
    summary: 'List files in context directory',
    description:
      'Returns a list of markdown files in the specified context directory',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'List of files retrieved successfully',
    type: ListFilesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  async listFiles(
    @Headers('x-api-key') apiKey: string,
    @Body() listFilesDto: ListFilesDto,
  ): Promise<ListFilesResponseDto> {
    // Validate API key
    const apiKeyData = await this.apiKeysService.findApiKey(apiKey);
    if (!apiKeyData) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Construct path to context directory
    const contextPath = join(
      process.cwd(),
      'data',
      'contexts',
      listFilesDto.id,
    );

    try {
      // Try to read the directory
      const files = await fs.readdir(contextPath);

      // Filter for markdown files
      const markdownFiles = files.filter((file) => file.endsWith('.md'));

      return {
        id: listFilesDto.id,
        files: markdownFiles,
      };
    } catch (error) {
      // If directory doesn't exist, return empty list
      if (error.code === 'ENOENT') {
        return {
          id: listFilesDto.id,
          files: [],
        };
      }

      // For any other error, rethrow it
      throw error;
    }
  }
}
