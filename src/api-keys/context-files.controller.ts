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

  private async validateAdminAccess(
    walletAddress: string,
    contextId: string,
  ): Promise<void> {
    // Get all assistants and find the one matching the context ID
    const assistants = await this.apiKeysService.getAllAssistantDetails();
    const assistant = assistants.find((a) => a.contextId === contextId);

    if (!assistant) {
      throw new BadRequestException('Invalid context ID');
    }

    // Check if the wallet address matches the admin address
    if (walletAddress.toLowerCase() !== assistant.adminAddress.toLowerCase()) {
      throw new UnauthorizedException('Unauthorized access to context files');
    }
  }

  @Post('list-files')
  @ApiOperation({
    summary: 'List files in context directory',
    description:
      'Returns a list of markdown files in the specified context directory',
  })
  @ApiHeader({
    name: 'x-wallet-address',
    description: 'Wallet address for authentication',
    required: true,
  })
  async listFiles(
    @Headers('x-wallet-address') walletAddress: string,
    @Body() listFilesDto: ListFilesDto,
  ) {
    await this.validateAdminAccess(walletAddress, listFilesDto.id);

    const contextPath = join(
      process.cwd(),
      'data',
      'contexts',
      listFilesDto.id,
    );

    try {
      const files = await fs.readdir(contextPath);
      const markdownFiles = files.filter((file) => file.endsWith('.md'));

      return {
        id: listFilesDto.id,
        files: markdownFiles,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          id: listFilesDto.id,
          files: [],
        };
      }
      throw error;
    }
  }

  @Post('add-context')
  @ApiOperation({
    summary: 'Upload context file',
    description:
      'Upload a markdown file to be used as context. If a file with the same name exists, it will be replaced.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Markdown file to upload as context',
    type: UploadContextFileDto,
  })
  @ApiHeader({
    name: 'x-wallet-address',
    description: 'Wallet address for authentication',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Context file uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        filename: { type: 'string' },
        replaced: { type: 'boolean' },
      },
    },
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
    @Headers('x-wallet-address') walletAddress: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Find the assistant for this admin
    const assistants = await this.apiKeysService.getAllAssistantDetails();
    const adminAssistant = assistants.find(
      (a) => a.adminAddress.toLowerCase() === walletAddress.toLowerCase(),
    );

    if (!adminAssistant) {
      throw new UnauthorizedException('No assistant found for this admin');
    }

    try {
      const contextDir = join(
        process.cwd(),
        'data',
        'contexts',
        adminAssistant.contextId,
      );
      await fs.mkdir(contextDir, { recursive: true });

      const contextFilePath = join(contextDir, file.originalname);
      let fileExists = false;
      try {
        await fs.access(contextFilePath);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      if (fileExists) {
        await fs.unlink(contextFilePath);
      }

      await fs.copyFile(file.path, contextFilePath);
      await fs.unlink(file.path);

      return {
        message: fileExists
          ? 'Context file updated successfully'
          : 'Context file uploaded successfully',
        filename: file.originalname,
        replaced: fileExists,
      };
    } catch (error) {
      if (file?.path) {
        try {
          await fs.unlink(file.path);
        } catch {
          // Ignore cleanup errors
        }
      }
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
    name: 'x-wallet-address',
    description: 'Wallet address for authentication',
    required: true,
  })
  async deleteContext(
    @Headers('x-wallet-address') walletAddress: string,
    @Body() deleteFileDto: DeleteContextFileDto,
  ) {
    // Find the assistant for this admin
    const assistants = await this.apiKeysService.getAllAssistantDetails();
    const adminAssistant = assistants.find(
      (a) => a.adminAddress.toLowerCase() === walletAddress.toLowerCase(),
    );

    if (!adminAssistant) {
      throw new UnauthorizedException('No assistant found for this admin');
    }

    try {
      const filePath = join(
        process.cwd(),
        'data',
        'contexts',
        adminAssistant.contextId,
        deleteFileDto.filename,
      );

      try {
        await fs.access(filePath);
      } catch (error) {
        throw new BadRequestException('File not found');
      }

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
    name: 'x-wallet-address',
    description: 'Wallet address for authentication',
    required: true,
  })
  async downloadContext(
    @Headers('x-wallet-address') walletAddress: string,
    @Body() downloadFileDto: DownloadContextFileDto,
  ): Promise<StreamableFile> {
    // Find the assistant for this admin
    const assistants = await this.apiKeysService.getAllAssistantDetails();
    const adminAssistant = assistants.find(
      (a) => a.adminAddress.toLowerCase() === walletAddress.toLowerCase(),
    );

    if (!adminAssistant) {
      throw new UnauthorizedException('No assistant found for this admin');
    }

    try {
      const filePath = join(
        process.cwd(),
        'data',
        'contexts',
        adminAssistant.contextId,
        downloadFileDto.filename,
      );

      try {
        await fs.access(filePath);
      } catch (error) {
        throw new BadRequestException('File not found');
      }

      const file = createReadStream(filePath);

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
