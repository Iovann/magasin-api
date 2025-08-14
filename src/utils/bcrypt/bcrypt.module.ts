import { Module } from '@nestjs/common';
import { BcryptService } from './bcrypt.service';

@Module({
  providers: [BcryptService],
  exports: [BcryptService], // Export BcryptService
})
export class BcryptModule {}
