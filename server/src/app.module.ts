import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { WorkflowModule } from '@/workflow/workflow.module';
import { RecordModule } from '@/record/record.module';

@Module({
  imports: [WorkflowModule, RecordModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
