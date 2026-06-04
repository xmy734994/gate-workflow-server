import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { WechatController } from './wechat.controller'
import { WechatService } from './wechat.service'

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [WechatController],
  providers: [WechatService],
  exports: [WechatService],
})
export class WechatModule {}
