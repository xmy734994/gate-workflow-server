import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common'
import { WorkflowService, WorkflowItem } from './workflow.service'

@Controller('workflow/items')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  findAll() {
    const items = this.workflowService.findAll()
    console.log(`[GET] /api/workflow/items - 返回 ${items.length} 条记录`)
    return {
      code: 200,
      msg: 'success',
      data: items
    }
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const item = this.workflowService.findOne(id)
    if (!item) {
      console.log(`[GET] /api/workflow/items/${id} - 未找到`)
      return { code: 404, msg: '未找到该记录', data: null }
    }
    console.log(`[GET] /api/workflow/items/${id} - 找到: ${item.content}`)
    return {
      code: 200,
      msg: 'success',
      data: item
    }
  }

  @Post()
  create(@Body() body: { content: string; order?: number; remindMinutes?: number; remindType?: string }) {
    if (!body.content || !body.content.trim()) {
      console.log(`[POST] /api/workflow/items - 内容不能为空`)
      return { code: 400, msg: '内容不能为空', data: null }
    }
    const item = this.workflowService.create({
      content: body.content.trim(),
      order: body.order,
      remindMinutes: body.remindMinutes,
      remindType: body.remindType as any
    })
    console.log(`[POST] /api/workflow/items - 创建: ${item.content}`)
    return {
      code: 200,
      msg: 'success',
      data: item
    }
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{ content: string; order: number; remindMinutes: number; remindType: string }>
  ) {
    if (body.content !== undefined && !body.content.trim()) {
      console.log(`[PUT] /api/workflow/items/${id} - 内容不能为空`)
      return { code: 400, msg: '内容不能为空', data: null }
    }
    const item = this.workflowService.update(id, {
      ...body,
      remindType: body.remindType as any
    })
    if (!item) {
      console.log(`[PUT] /api/workflow/items/${id} - 未找到`)
      return { code: 404, msg: '未找到该记录', data: null }
    }
    console.log(`[PUT] /api/workflow/items/${id} - 更新: ${item.content}`)
    return {
      code: 200,
      msg: 'success',
      data: item
    }
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    const success = this.workflowService.remove(id)
    if (!success) {
      console.log(`[DELETE] /api/workflow/items/${id} - 未找到`)
      return { code: 404, msg: '未找到该记录', data: null }
    }
    console.log(`[DELETE] /api/workflow/items/${id} - 删除成功`)
    return {
      code: 200,
      msg: 'success',
      data: { deleted: true }
    }
  }

  @Put('batch')
  batchUpdate(@Body() body: { items: WorkflowItem[] }) {
    if (!body.items || !Array.isArray(body.items)) {
      console.log(`[PUT] /api/workflow/items/batch - 参数错误`)
      return { code: 400, msg: '参数错误', data: null }
    }
    const items = this.workflowService.batchUpdate(body.items)
    console.log(`[PUT] /api/workflow/items/batch - 批量更新 ${items.length} 条`)
    return {
      code: 200,
      msg: 'success',
      data: items
    }
  }
}

// 航班计划控制器
@Controller('workflow/flights')
export class FlightPlanController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  createFlightPlan(@Body() body: { flightNumber: string; departureTime: number; boardingTime: number }) {
    if (!body.flightNumber || !body.departureTime || !body.boardingTime) {
      return { code: 400, msg: '参数不完整', data: null }
    }
    
    const plan = this.workflowService.createFlightPlan({
      flightNumber: body.flightNumber.toUpperCase(),
      departureTime: body.departureTime,
      boardingTime: body.boardingTime
    })
    
    console.log(`[POST] /api/workflow/flights - 创建航班计划: ${plan.flightNumber}`)
    return {
      code: 200,
      msg: 'success',
      data: plan
    }
  }

  @Get()
  getFlightPlans() {
    const plans = this.workflowService.getFlightPlans()
    return {
      code: 200,
      msg: 'success',
      data: plans
    }
  }

  @Get(':flightNumber')
  getFlightPlan(@Param('flightNumber') flightNumber: string) {
    const plan = this.workflowService.getFlightPlan(flightNumber)
    if (!plan) {
      return { code: 404, msg: '未找到该航班计划', data: null }
    }
    return {
      code: 200,
      msg: 'success',
      data: plan
    }
  }

  @Get('pending/reminders')
  getPendingReminders() {
    const reminders = this.workflowService.getPendingReminders()
    return {
      code: 200,
      msg: 'success',
      data: reminders
    }
  }

  @Post('reminders/:flightNumber/:workflowItemId/:remindTime/mark-sent')
  markReminderSent(
    @Param('flightNumber') flightNumber: string,
    @Param('workflowItemId', ParseIntPipe) workflowItemId: number,
    @Param('remindTime', ParseIntPipe) remindTime: number
  ) {
    const success = this.workflowService.markReminderSent(flightNumber, workflowItemId, remindTime)
    return {
      code: success ? 200 : 400,
      msg: success ? 'success' : '标记失败',
      data: { success }
    }
  }
}
