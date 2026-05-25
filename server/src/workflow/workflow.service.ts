import { Injectable } from '@nestjs/common'

export type RemindType = 'boarding' | 'departure'

export interface WorkflowItem {
  id: number
  content: string
  order: number
  remindMinutes: number  // 提前多少分钟提醒，0表示正点
  remindType: RemindType  // 基于登机时间还是起飞时间
}

@Injectable()
export class WorkflowService {
  private items: WorkflowItem[] = [
    { id: 1, content: '轮椅无陪信息确认', order: 1, remindMinutes: 15, remindType: 'boarding' },
    { id: 2, content: '行李预拉确认', order: 2, remindMinutes: 20, remindType: 'departure' },
    { id: 3, content: '行李、舱单、货舱、交接综合确认', order: 3, remindMinutes: 17, remindType: 'departure' },
    { id: 4, content: '行李拉下操作确认', order: 4, remindMinutes: 16, remindType: 'departure' },
    { id: 5, content: '舱单和货舱确认', order: 5, remindMinutes: 15, remindType: 'departure' },
    { id: 6, content: '登机口设备、系统、门禁及栏杆等现场准备', order: 6, remindMinutes: 0, remindType: 'boarding' },
    { id: 7, content: '特殊行李预告单和登机口变更告示确认', order: 7, remindMinutes: 0, remindType: 'boarding' },
    { id: 8, content: '八个一、三复核、登机系统流程复核', order: 8, remindMinutes: 15, remindType: 'boarding' }
  ]

  private nextId = 9

  findAll(): WorkflowItem[] {
    return this.items.sort((a, b) => a.order - b.order)
  }

  findOne(id: number): WorkflowItem | undefined {
    return this.items.find(item => item.id === id)
  }

  create(data: { content: string; order?: number; remindMinutes?: number; remindType?: RemindType }): WorkflowItem {
    const order = data.order ?? this.items.length + 1
    const newItem: WorkflowItem = {
      id: this.nextId++,
      content: data.content,
      order,
      remindMinutes: data.remindMinutes ?? 15,
      remindType: data.remindType ?? 'departure'
    }
    this.items.push(newItem)
    return newItem
  }

  update(id: number, data: Partial<{ content: string; order: number; remindMinutes: number; remindType: RemindType }>): WorkflowItem | null {
    const index = this.items.findIndex(item => item.id === id)
    if (index === -1) return null
    
    if (data.content !== undefined) {
      this.items[index].content = data.content
    }
    if (data.order !== undefined) {
      this.items[index].order = data.order
    }
    if (data.remindMinutes !== undefined) {
      this.items[index].remindMinutes = data.remindMinutes
    }
    if (data.remindType !== undefined) {
      this.items[index].remindType = data.remindType
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
