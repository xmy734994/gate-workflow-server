import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { WorkflowModule } from '@/workflow/workflow.module';
import { RecordModule } from '@/record/record.module';
import { WechatModule } from '@/wechat/wechat.module';

@Module({
  imports: [WorkflowModule, RecordModule, WechatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
