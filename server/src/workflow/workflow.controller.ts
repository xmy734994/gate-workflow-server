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
  create(@Body() body: { content: string; order?: number }) {
    if (!body.content || !body.content.trim()) {
      console.log(`[POST] /api/workflow/items - 内容不能为空`)
      return { code: 400, msg: '内容不能为空', data: null }
    }
    const item = this.workflowService.create({
      content: body.content.trim(),
      order: body.order
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
    @Body() body: Partial<{ content: string; order: number }>
  ) {
    if (body.content !== undefined && !body.content.trim()) {
      console.log(`[PUT] /api/workflow/items/${id} - 内容不能为空`)
      return { code: 400, msg: '内容不能为空', data: null }
    }
    const item = this.workflowService.update(id, body)
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
