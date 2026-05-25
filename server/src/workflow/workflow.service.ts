import { Injectable } from '@nestjs/common'

export interface WorkflowItem {
  id: number
  content: string
  order: number
}

@Injectable()
export class WorkflowService {
  private items: WorkflowItem[] = [
    { id: 1, content: '航前会开好了吗？', order: 1 },
    { id: 2, content: '登机设备带好了吗？', order: 2 },
    { id: 3, content: '登机口设备和系统都打开了吗？', order: 3 },
    { id: 4, content: '门禁打开了吗？栏杆摆放好了吗？', order: 4 },
    { id: 5, content: '确认轮椅无陪的信息', order: 5 },
    { id: 6, content: '确认有没有特殊行李机长通知单', order: 6 },
    { id: 7, content: '有没有登机口变更？贴告示了没有？', order: 7 },
    { id: 8, content: '航班开始登机注意站位', order: 8 },
    { id: 9, content: '八个一做了吗？', order: 9 },
    { id: 10, content: '三复核做了吗？', order: 10 },
    { id: 11, content: '登机系统按照流程操作了吗？', order: 11 },
    { id: 12, content: '行李提前20分钟预拉', order: 12 },
    { id: 13, content: '行李确认拉下要在登机系统里点击拉下', order: 13 },
    { id: 14, content: '舱单确认了吗？', order: 14 },
    { id: 15, content: '货舱通知关了吗？', order: 15 },
    { id: 16, content: '特殊情况和机长交接了吗？', order: 16 }
  ]

  private nextId = 17

  findAll(): WorkflowItem[] {
    return this.items.sort((a, b) => a.order - b.order)
  }

  findOne(id: number): WorkflowItem | undefined {
    return this.items.find(item => item.id === id)
  }

  create(data: { content: string; order?: number }): WorkflowItem {
    const order = data.order ?? this.items.length + 1
    const newItem: WorkflowItem = {
      id: this.nextId++,
      content: data.content,
      order
    }
    this.items.push(newItem)
    return newItem
  }

  update(id: number, data: Partial<{ content: string; order: number }>): WorkflowItem | null {
    const index = this.items.findIndex(item => item.id === id)
    if (index === -1) return null
    
    if (data.content !== undefined) {
      this.items[index].content = data.content
    }
    if (data.order !== undefined) {
      this.items[index].order = data.order
    }
    return this.items[index]
  }

  remove(id: number): boolean {
    const index = this.items.findIndex(item => item.id === id)
    if (index === -1) return false
    
    this.items.splice(index, 1)
    // Re-order remaining items
    this.items.forEach((item, idx) => {
      item.order = idx + 1
    })
    return true
  }

  batchUpdate(items: WorkflowItem[]): WorkflowItem[] {
    items.forEach(updateItem => {
      const index = this.items.findIndex(item => item.id === updateItem.id)
      if (index !== -1) {
        this.items[index] = updateItem
      }
    })
    // Sort by order
    return this.items.sort((a, b) => a.order - b.order)
  }
}
