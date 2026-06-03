import { Module, Global } from '@nestjs/common'
import { WechatController } from './wechat.controller'
import { WechatService } from './wechat.service'

@Global()
@Module({
  controllers: [WechatController],
  providers: [WechatService],
  exports: [WechatService],
})
export class WechatModule {}
