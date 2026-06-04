import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface WechatConfig {
  appId: string
  appSecret: string
  subscribeTemplateId: string
}

interface UserSubscription {
  openid: string
  subscribed: boolean
  subscribedAt: Date
  templateIds: string[]
}

interface PendingReminder {
  id: string
  openid: string
  templateId: string
  data: Record<string, { value: string; color?: string }>
  scheduledTime: number
  sent: boolean
}

@Injectable()
export class WechatService implements OnModuleInit {
  private config: WechatConfig | null = null
  private accessToken: string | null = null
  private accessTokenExpire: number = 0
  private userSubscriptions: Map<string, UserSubscription> = new Map()
  private pendingReminders: Map<string, PendingReminder[]> = new Map()

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // 从环境变量读取微信配置
    const appId = this.configService.get<string>('WECHAT_APP_ID')
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET')
    const templateId = this.configService.get<string>('WECHAT_SUBSCRIBE_TEMPLATE_ID') || 'YOUR_TEMPLATE_ID'

    if (appId && appSecret) {
      this.config = {
        appId,
        appSecret,
        subscribeTemplateId: templateId,
      }
      console.log('[WechatService] 微信配置已加载')
    } else {
      console.log('[WechatService] 未配置微信环境变量 (WECHAT_APP_ID, WECHAT_APP_SECRET)')
    }
  }

  setConfig(config: WechatConfig) {
    this.config = config
  }

  isConfigured(): boolean {
    return this.config !== null && 
           !!this.config.appId && 
           !!this.config.appSecret
  }

  getAppId(): string | null {
    return this.config?.appId || null
  }

  getTemplateId(): string | null {
    return this.config?.subscribeTemplateId || null
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.config) {
      console.log('[WechatService] 未配置微信参数')
      return null
    }

    // 如果已有有效 token，直接返回
    if (this.accessToken && Date.now() < this.accessTokenExpire) {
      return this.accessToken
    }

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.config.appId}&secret=${this.config.appSecret}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.access_token) {
        this.accessToken = data.access_token
        // 提前5分钟过期
        this.accessTokenExpire = Date.now() + (data.expires_in - 300) * 1000
        console.log('[WechatService] Access token 获取成功')
        return this.accessToken
      } else {
        console.error('[WechatService] Access token 获取失败:', data)
        return null
      }
    } catch (error) {
      console.error('[WechatService] Access token 请求失败:', error)
      return null
    }
  }

  async code2Session(code: string): Promise<{ openid?: string; session_key?: string; errcode?: number; errmsg?: string }> {
    if (!this.config) {
      return { errcode: -1, errmsg: '未配置微信参数' }
    }

    try {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.config.appId}&secret=${this.config.appSecret}&js_code=${code}&grant_type=authorization_code`
      const response = await fetch(url)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('[WechatService] code2session 请求失败:', error)
      return { errcode: -1, errmsg: '请求失败' }
    }
  }

  // 保存用户订阅信息
  saveUserSubscription(openid: string, templateId: string) {
    const key = `${openid}_${templateId}`
    this.userSubscriptions.set(key, {
      openid,
      subscribed: true,
      subscribedAt: new Date(),
      templateIds: [templateId],
    })
    console.log(`[WechatService] 用户 ${openid} 订阅了模板 ${templateId}`)
  }

  // 检查用户是否订阅
  isUserSubscribed(openid: string, templateId: string): boolean {
    const key = `${openid}_${templateId}`
    return this.userSubscriptions.has(key)
  }

  // 添加待发送的提醒
  addPendingReminder(id: string, openid: string, templateId: string, data: Record<string, { value: string; color?: string }>, scheduledTime: number) {
    if (!this.pendingReminders.has(openid)) {
      this.pendingReminders.set(openid, [])
    }
    this.pendingReminders.get(openid)!.push({
      id,
      openid,
      templateId,
      data,
      scheduledTime,
      sent: false,
    })
    console.log(`[WechatService] 添加提醒任务: ${id}, 计划时间: ${new Date(scheduledTime).toLocaleString()}`)
  }

  // 获取待发送的提醒
  getPendingReminders(openid?: string): PendingReminder[] {
    if (openid) {
      return this.pendingReminders.get(openid) || []
    }
    const all: PendingReminder[] = []
    this.pendingReminders.forEach((reminders) => {
      all.push(...reminders)
    })
    return all
  }

  // 标记提醒已发送
  markReminderSent(id: string, openid: string) {
    const reminders = this.pendingReminders.get(openid)
    if (reminders) {
      const reminder = reminders.find((r) => r.id === id)
      if (reminder) {
        reminder.sent = true
      }
    }
  }

  // 发送订阅消息
  async sendSubscribeMessage(
    openid: string,
    templateId: string,
    data: Record<string, { value: string; color?: string }>,
    page?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      return { success: false, message: '未配置微信参数' }
    }

    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      return { success: false, message: '获取 access_token 失败' }
    }

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`
      const payload = {
        touser: openid,
        template_id: templateId,
        page,
        data,
      }

      console.log('[WechatService] 发送订阅消息:', JSON.stringify(payload))
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (result.errcode === 0) {
        console.log(`[WechatService] 消息发送成功 to ${openid}`)
        return { success: true, message: '发送成功' }
      } else {
        console.error(`[WechatService] 消息发送失败:`, result)
        return { success: false, message: result.errmsg || '发送失败' }
      }
    } catch (error) {
      console.error('[WechatService] 发送消息请求失败:', error)
      return { success: false, message: '请求失败' }
    }
  }
}
