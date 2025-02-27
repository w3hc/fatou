import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DatabaseModule } from '../database/database.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ApiKeysModule,

    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
