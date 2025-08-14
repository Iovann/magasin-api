import { Module } from '@nestjs/common';
import { TokenBlacklistService } from './token-blacklist.service';
import { CacheModule } from '../../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [TokenBlacklistService],
  exports: [TokenBlacklistService],
})
export class TokenBlacklistModule {}
