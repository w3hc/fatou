import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    ConfigModule,
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
