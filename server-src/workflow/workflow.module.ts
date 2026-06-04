import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { WorkflowController, FlightPlanController } from './workflow.controller'
import { WorkflowService } from './workflow.service'

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [WorkflowController, FlightPlanController],
  providers: [WorkflowService],
  exports: [WorkflowService]
})
export class WorkflowModule {
  constructor(private workflowService: WorkflowService) {
    // WorkflowService 会自动初始化定时任务
  }
}
