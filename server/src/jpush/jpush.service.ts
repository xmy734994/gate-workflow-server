import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface PushPayload {
  registrationId: string
  title: string
  content: string
  extras?: Record<string, string>
}

@Injectable()
export class JpushService {
  private appKey: string
  private masterSecret: string
  private apiUrl = 'https://api.jpush.cn/v3/push'

  constructor(private configService: ConfigService) {
    this.appKey = this.configService.get<string>('JPUSH_APP_KEY') || ''
    this.masterSecret = this.configService.get<string>('JPUSH_MASTER_SECRET') || ''
  }

  /**
   * 发送推送通知
   */
  async sendPush(payload: PushPayload): Promise<{ success: boolean; msgId?: string; error?: string }> {
    if (!this.appKey || !this.masterSecret) {
      console.log('[JPush] 未配置 AppKey 或 MasterSecret，跳过推送')
      return { success: false, error: '未配置 JPush 环境变量' }
    }

    try {
      const auth = Buffer.from(`${this.appKey}:${this.masterSecret}`).toString('base64')

      const body: Record<string, unknown> = {
        platform: 'all',
        audience: {
          registration_id: [payload.registrationId],
        },
        notification: {
          android: {
            alert: payload.content,
            title: payload.title,
            build_id: 1,
          },
          ios: {
            alert: {
              title: payload.title,
              body: payload.content,
            },
            sound: 'default',
            'content-available': 1,
          },
        },
        options: {
          time_to_live: 86400,
          apns_production: process.env.NODE_ENV === 'production',
        },
      }

      if (payload.extras) {
        body.message = {
          title: payload.title,
          msg_content: payload.content,
          extras: payload.extras,
        }
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (response.ok && result.msg_id) {
        console.log(`[JPush] 推送成功，msgId: ${result.msg_id}`)
        return { success: true, msgId: result.msg_id }
      } else {
        console.error('[JPush] 推送失败:', result)
        return { success: false, error: result.error?.message || JSON.stringify(result) }
      }
    } catch (error) {
      console.error('[JPush] 推送异常:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * 批量发送推送
   */
  async sendBatchPush(
    registrations: string[],
    title: string,
    content: string,
    extras?: Record<string, string>
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    if (!registrations.length) {
      return { success: true, sent: 0, failed: 0 }
    }

    const results = await Promise.all(
      registrations.map((regId) =>
        this.sendPush({
          registrationId: regId,
          title,
          content,
          extras,
        })
      )
    )

    const sent = results.filter((r) => r.success).length
    const failed = results.length - sent

    return { success: failed === 0, sent, failed }
  }
}
