import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { WorkflowModule } from '@/workflow/workflow.module'
import { RecordModule } from '@/record/record.module'
import { WechatModule } from '@/wechat/wechat.module'
import { JpushModule } from '@/jpush/jpush.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WorkflowModule,
    RecordModule,
    WechatModule,
    JpushModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
