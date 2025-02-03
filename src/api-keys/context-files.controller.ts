import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Headers,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiResponse,
  ApiProperty,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ApiKeysService } from './api-keys.service';
import { diskStorage } from 'multer';
import { StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';

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

class UploadContextFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Markdown file to upload as context',
  })
  file: any;
}

class DeleteContextFileDto {
  @ApiProperty({
    description: 'Name of the file to delete',
    example: 'context.md',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;
}

export class DownloadContextFileDto {
  @ApiProperty({
    description: 'Name of the file to download',
    example: 'context.md',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;
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
  @Post('add-context')
  @ApiOperation({
    summary: 'Upload context file',
    description: 'Upload a markdown file to be used as context for the API key',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Markdown file to upload as context',
    type: UploadContextFileDto,
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: true,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file && !file.originalname.toLowerCase().endsWith('.md')) {
          cb(
            new BadRequestException('Only markdown (.md) files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async addContext(
    @Headers('x-api-key') apiKey: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Validate API key and get API key data
    const apiKeyData = await this.apiKeysService.findApiKey(apiKey);
    if (!apiKeyData) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Construct the path to the context directory for this API key
      const contextDir = join(process.cwd(), 'data', 'contexts', apiKeyData.id);

      // Ensure the directory exists
      await fs.mkdir(contextDir, { recursive: true });

      // Copy file from uploads to context directory
      const contextFilePath = join(contextDir, file.originalname);
      await fs.copyFile(file.path, contextFilePath);

      // Clean up the uploaded file
      await fs.unlink(file.path);

      return {
        message: 'Context file uploaded successfully',
        filename: file.originalname,
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to save context file: ' + error.message,
      );
    }
  }

  @Delete('delete-context')
  @ApiOperation({
    summary: 'Delete context file',
    description: 'Delete a specific markdown file from the context directory',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: true,
  })
  async deleteContext(
    @Headers('x-api-key') apiKey: string,
    @Body() deleteFileDto: DeleteContextFileDto,
  ) {
    // Validate API key and get API key data
    const apiKeyData = await this.apiKeysService.findApiKey(apiKey);
    if (!apiKeyData) {
      throw new UnauthorizedException('Invalid API key');
    }

    try {
      // Construct the path to the file
      const filePath = join(
        process.cwd(),
        'data',
        'contexts',
        apiKeyData.id,
        deleteFileDto.filename,
      );

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new BadRequestException('File not found');
      }

      // Delete the file
      await fs.unlink(filePath);

      return {
        message: 'Context file deleted successfully',
        filename: deleteFileDto.filename,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to delete context file: ' + error.message,
      );
    }
  }

  @Post('download-context')
  @ApiOperation({
    summary: 'Download context file',
    description: 'Download a specific markdown file from the context directory',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: true,
  })
  @ApiBody({ type: DownloadContextFileDto })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'File not found or invalid request',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  async downloadContext(
    @Headers('x-api-key') apiKey: string,
    @Body() downloadFileDto: DownloadContextFileDto,
  ): Promise<StreamableFile> {
    // Validate API key and get API key data
    const apiKeyData = await this.apiKeysService.findApiKey(apiKey);
    if (!apiKeyData) {
      throw new UnauthorizedException('Invalid API key');
    }

    try {
      // Construct the path to the file
      const filePath = join(
        process.cwd(),
        'data',
        'contexts',
        apiKeyData.id,
        downloadFileDto.filename,
      );

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new BadRequestException('File not found');
      }

      // Create a read stream from the file
      const file = createReadStream(filePath);

      // Return the streamable file with appropriate headers
      return new StreamableFile(file, {
        disposition: `attachment; filename="${downloadFileDto.filename}"`,
        type: 'text/markdown',
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to download context file: ' + error.message,
      );
    }
  }
}
