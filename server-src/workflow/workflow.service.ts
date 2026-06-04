import { Injectable, OnModuleInit } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { WechatService } from '@/wechat/wechat.service'
import { JpushService } from '@/jpush/jpush.service'

export type RemindType = 'boarding' | 'departure'

export interface WorkflowItem {
  id: number
  content: string
  order: number
  remindMinutes: number  // 提前多少分钟提醒，0表示正点
  remindType: RemindType  // 基于登机时间还是起飞时间
}

export interface FlightPlan {
  id: string
  flightNumber: string
  departureTime: number  // timestamp
  boardingTime: number   // timestamp
  openid?: string        // 用户的 openid，用于发送订阅消息
  registrationId?: string // 极光推送的设备 RegistrationID
  reminders: ReminderTask[]
  createdAt: number
}

export interface ReminderTask {
  workflowItemId: number
  workflowContent: string
  remindTime: number  // timestamp
  remindType: RemindType
  sent: boolean        // 是否已发送
  flightNumber: string
  openid?: string      // 用户的 openid
  registrationId?: string // 极光推送的设备 RegistrationID
}

@Injectable()
export class WorkflowService implements OnModuleInit {
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

  private flightPlans: Map<string, FlightPlan> = new Map()
  private pendingReminders: ReminderTask[] = []
  private nextId = 9

  // 注入 WechatService 和 JpushService
  constructor(
    private wechatService: WechatService,
    private jpushService: JpushService
  ) {}

  onModuleInit() {
    console.log('[WorkflowService] 服务已初始化，定时检查器已启动')
    
    // 设置发送微信订阅消息的回调
    this.setupWechatNotification()
  }

  // 设置微信订阅消息发送
  private setupWechatNotification() {
    // 立即设置回调
    this.sendWechatNotification = async (task: ReminderTask) => {
      if (!task.openid) {
        console.log(`[WorkflowService] 任务 ${task.flightNumber} 没有 openid，跳过微信通知`)
        return
      }

      const templateId = this.wechatService.getTemplateId()
      if (!templateId) {
        console.log(`[WorkflowService] 未配置模板 ID，跳过微信通知`)
        return
      }

      // 检查用户是否订阅
      if (!this.wechatService.isUserSubscribed(task.openid, templateId)) {
        console.log(`[WorkflowService] 用户 ${task.openid} 未订阅模板 ${templateId}`)
        return
      }

      // 构建消息数据
      const timeStr = new Date(task.remindTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      const data = {
        thing1: { value: task.flightNumber },                    // 航班号
        thing2: { value: task.workflowContent },                  // 提醒内容
        time3: { value: timeStr },                               // 提醒时间
        phrase4: { value: task.remindType === 'departure' ? '起飞前' : '登机前' }, // 提醒类型
      }

      const result = await this.wechatService.sendSubscribeMessage(task.openid, templateId, data)
      if (result.success) {
        console.log(`[WorkflowService] 微信通知发送成功: ${task.flightNumber} - ${task.workflowContent}`)
      } else {
        console.log(`[WorkflowService] 微信通知发送失败: ${result.message}`)
      }
    }
  }

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

  // 创建航班计划并生成提醒任务
  createFlightPlan(data: { flightNumber: string; departureTime: number; boardingTime: number; openid?: string; registrationId?: string }): FlightPlan {
    const planId = `${data.flightNumber}_${Date.now()}`
    const reminders: ReminderTask[] = []
    
    // 为每个工作流程项生成提醒任务
    this.items.forEach(item => {
      // 根据提醒类型计算提醒时间
      const baseTime = item.remindType === 'departure' ? data.departureTime : data.boardingTime
      const remindTime = baseTime - (item.remindMinutes * 60 * 1000)
      
      reminders.push({
        workflowItemId: item.id,
        workflowContent: item.content,
        remindTime,
        remindType: item.remindType,
        sent: false,
        flightNumber: data.flightNumber,
        openid: data.openid, // 传递 openid
        registrationId: data.registrationId // 传递 registrationId
      })
    })
    
    const plan: FlightPlan = {
      id: planId,
      flightNumber: data.flightNumber,
      departureTime: data.departureTime,
      boardingTime: data.boardingTime,
      openid: data.openid,
      registrationId: data.registrationId,
      reminders,
      createdAt: Date.now()
    }
    
    this.flightPlans.set(planId, plan)
    
    // 将所有未过期的提醒加入待发送队列
    const now = Date.now()
    reminders
      .filter(r => r.remindTime > now && !r.sent)
      .forEach(r => {
        if (!this.pendingReminders.find(pr => 
          pr.flightNumber === r.flightNumber && 
          pr.workflowItemId === r.workflowItemId &&
          pr.remindTime === r.remindTime
        )) {
          this.pendingReminders.push(r)
        }
      })
    
    console.log(`[WorkflowService] 创建航班计划: ${data.flightNumber}, 生成 ${reminders.length} 个提醒任务, openid: ${data.openid || '未提供'}`)
    return plan
  }

  // 获取所有航班计划
  getFlightPlans(): FlightPlan[] {
    return Array.from(this.flightPlans.values()).sort((a, b) => b.createdAt - a.createdAt)
  }

  // 获取单个航班计划
  getFlightPlan(flightNumber: string): FlightPlan | undefined {
    return Array.from(this.flightPlans.values()).find(p => p.flightNumber === flightNumber)
  }

  // 获取待处理的提醒
  getPendingReminders(): ReminderTask[] {
    return this.pendingReminders.filter(r => !r.sent)
  }

  // 标记提醒已发送
  markReminderSent(flightNumber: string, workflowItemId: number, remindTime: number): boolean {
    const reminder = this.pendingReminders.find(r => 
      r.flightNumber === flightNumber && 
      r.workflowItemId === workflowItemId &&
      r.remindTime === remindTime
    )
    
    if (reminder) {
      reminder.sent = true
      // 从待处理队列中移除
      this.pendingReminders = this.pendingReminders.filter(r => 
        !(r.flightNumber === flightNumber && 
          r.workflowItemId === workflowItemId &&
          r.remindTime === remindTime)
      )
      
      // 同时更新航班计划中的状态
      this.flightPlans.forEach(plan => {
        const task = plan.reminders.find(r => 
          r.workflowItemId === workflowItemId && r.remindTime === remindTime
        )
        if (task) task.sent = true
      })
      
      return true
    }
    return false
  }

  // 定时检查并发送提醒 - 每分钟执行一次
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndSendReminders() {
    const now = Date.now()
    const toSend: ReminderTask[] = []
    
    // 找出需要发送的提醒（时间已到但未发送）
    this.pendingReminders = this.pendingReminders.filter(reminder => {
      if (!reminder.sent && reminder.remindTime <= now) {
        toSend.push(reminder)
        return false // 发送后从待处理队列移除
      }
      return true
    })
    
    // 发送所有到期的提醒
    for (const task of toSend) {
      console.log(`[WorkflowService] 发送提醒: ${task.flightNumber} - ${task.workflowContent}`)
      
      try {
        // 1. 发送微信订阅消息
        await this.sendWechatNotification(task)
        
        // 2. 发送极光推送（APP推送）
        await this.sendJpushNotification(task)
        
        this.markReminderSent(task.flightNumber, task.workflowItemId, task.remindTime)
      } catch (error) {
        console.error(`[WorkflowService] 发送提醒失败:`, error)
        // 失败后重新加入队列，稍后重试
        this.pendingReminders.push(task)
      }
    }
    
    if (toSend.length > 0) {
      console.log(`[WorkflowService] 本分钟已发送 ${toSend.length} 个提醒`)
    }
  }

  // 发送极光推送（APP）
  private async sendJpushNotification(task: ReminderTask): Promise<void> {
    if (!task.registrationId) {
      console.log(`[WorkflowService] 任务 ${task.flightNumber} 没有 registrationId，跳过极光推送`)
      return
    }

    const timeStr = new Date(task.remindTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    
    await this.jpushService.sendPush({
      clientId: task.registrationId,
      title: `登机提醒 - ${task.flightNumber}`,
      content: `${task.workflowContent}\n时间: ${timeStr}`,
      extras: {
        flightNumber: task.flightNumber,
        workflowContent: task.workflowContent,
        remindTime: String(task.remindTime),
        type: 'workflow_reminder'
      }
    })
  }

  // 发送微信订阅消息
  private sendWechatNotification: (task: ReminderTask) => Promise<void> = async (task: ReminderTask) => {
    if (!task.openid) {
      console.log(`[WorkflowService] 任务 ${task.flightNumber} 没有 openid，跳过微信通知`)
      return
    }

    const templateId = this.wechatService.getTemplateId()
    if (!templateId) {
      console.log(`[WorkflowService] 未配置模板 ID，跳过微信通知`)
      return
    }

    // 检查用户是否订阅
    if (!this.wechatService.isUserSubscribed(task.openid, templateId)) {
      console.log(`[WorkflowService] 用户 ${task.openid} 未订阅模板 ${templateId}`)
      return
    }

    // 构建消息数据
    const timeStr = new Date(task.remindTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const data = {
      thing1: { value: task.flightNumber },                    // 航班号
      thing2: { value: task.workflowContent },                  // 提醒内容
      time3: { value: timeStr },                               // 提醒时间
      phrase4: { value: task.remindType === 'departure' ? '起飞前' : '登机前' }, // 提醒类型
    }

    const result = await this.wechatService.sendSubscribeMessage(task.openid, templateId, data)
    if (result.success) {
      console.log(`[WorkflowService] 微信通知发送成功: ${task.flightNumber} - ${task.workflowContent}`)
    } else {
      console.log(`[WorkflowService] 微信通知发送失败: ${result.message}`)
    }
  }
}
