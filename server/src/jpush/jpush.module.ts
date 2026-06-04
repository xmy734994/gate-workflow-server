import { Module, Global } from '@nestjs/common'
import { JpushService } from './jpush.service'
import { JpushController } from './jpush.controller'

@Global()
@Module({
  controllers: [JpushController],
  providers: [JpushService],
  exports: [JpushService],
})
export class JpushModule {}
