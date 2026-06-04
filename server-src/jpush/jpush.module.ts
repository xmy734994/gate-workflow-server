import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JpushService } from './jpush.service'
import { JpushController } from './jpush.controller'

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [JpushController],
  providers: [JpushService],
  exports: [JpushService],
})
export class JpushModule {}
