import { Controller, Post, Body, Get, Inject } from '@nestjs/common'
import { JpushService, PushPayload } from './jpush.service'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

@Controller('jpush')
export class JpushController {
  constructor(
    private readonly jpushService: JpushService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 注册设备
   */
  @Post('register')
  async register(@Body() body: { registrationId: string; platform: string }) {
    console.log('[JPush] 设备注册:', body)
    return {
      code: 200,
      msg: 'success',
      data: { registrationId: body.registrationId },
    }
  }

  /**
   * 发送推送（供内部调用）
   */
  @Post('send')
  async send(@Body() payload: PushPayload) {
    const result = await this.jpushService.sendPush(payload)
    return {
      code: result.success ? 200 : 500,
      msg: result.success ? 'success' : 'failed',
      data: result,
    }
  }

  /**
   * 微信小程序登录，获取个推 clientid
   */
  @Post('wxlogin')
  async wxLogin(@Body() body: { code: string; appId: string }) {
    try {
      const { code, appId } = body
      
      // 调用微信接口获取 openid
      const appId2 = this.configService.get<string>('WECHAT_APP_ID') || 'wxabcdef1234567890'
      const appSecret = this.configService.get<string>('WECHAT_APP_SECRET') || 'your_app_secret'
      
      const wxResponse = await axios.get(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${appId2}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
      )
      
      if (wxResponse.data.openid) {
        const openid = wxResponse.data.openid
        
        // 注册到个推获取 clientid
        const getuiAppId = this.configService.get<string>('GETUI_APP_ID') || 'u8Cmrscepa7c3seDiioF8'
        const getuiAppKey = this.configService.get<string>('GETUI_APP_KEY') || 'mYUB4VjCKF9VkS5BA0E5I'
        const getuiMasterSecret = this.configService.get<string>('GETUI_MASTER_SECRET') || '0KiFN0zvAB7eRYiamQQFIA'
        
        const clientid = await this.jpushService.registerUser(openid, appId, getuiAppId, getuiAppKey, getuiMasterSecret)
        
        console.log('[JPush] 用户注册成功:', { openid, clientid })
        
        return {
          code: 200,
          msg: 'success',
          data: { clientid, openid },
        }
      } else {
        console.error('[JPush] 微信登录失败:', wxResponse.data)
        return {
          code: 500,
          msg: '微信登录失败',
          data: null,
        }
      }
    } catch (error) {
      console.error('[JPush] 微信登录异常:', error)
      return {
        code: 500,
        msg: '登录异常',
        data: null,
      }
    }
  }

  /**
   * 保存订阅设置
   */
  @Post('subscriptions')
  async saveSubscriptions(@Body() body: { clientid: string; subscriptions: Record<string, boolean> }) {
    console.log('[JPush] 保存订阅设置:', body)
    return {
      code: 200,
      msg: 'success',
      data: { saved: true },
    }
  }

  /**
   * 健康检查
   */
  @Get('health')
  health() {
    return {
      code: 200,
      msg: 'success',
      data: { status: 'ok' },
    }
  }
}
