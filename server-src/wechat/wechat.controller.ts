import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { WechatService } from './wechat.service'

@Controller('wechat')
export class WechatController {
  constructor(private readonly wechatService: WechatService) {}

  /**
   * 小程序获取 OpenID
   * 前端调用 wx.login() 获取 code，然后发送 code 到此接口
   */
  @Post('login')
  async login(@Body() body: { code: string }) {
    const { code } = body

    if (!code) {
      return { code: 400, msg: '缺少 code 参数', data: null }
    }

    const result = await this.wechatService.code2Session(code)

    if (result.openid) {
      return {
        code: 200,
        msg: 'success',
        data: {
          openid: result.openid,
          sessionKey: result.session_key,
        },
      }
    } else {
      return {
        code: 500,
        msg: result.errmsg || '获取 openid 失败',
        data: null,
      }
    }
  }

  /**
   * 保存用户订阅状态
   * 当用户在微信小程序中点击"订阅"按钮后，前端调用此接口
   */
  @Post('subscribe')
  async subscribe(@Body() body: { openid: string; templateId: string }) {
    const { openid, templateId } = body

    if (!openid || !templateId) {
      return { code: 400, msg: '缺少参数', data: null }
    }

    // 检查是否配置了微信
    if (!this.wechatService.isConfigured()) {
      return {
        code: 500,
        msg: '管理员未配置微信参数（AppID/AppSecret）',
        data: null,
      }
    }

    this.wechatService.saveUserSubscription(openid, templateId)
    return { code: 200, msg: '订阅成功', data: { success: true } }
  }

  /**
   * 获取微信配置信息（用于前端）
   */
  @Get('config')
  getConfig() {
    const appId = this.wechatService.getAppId()
    const templateId = this.wechatService.getTemplateId()

    return {
      code: 200,
      msg: 'success',
      data: {
        configured: this.wechatService.isConfigured(),
        appId: appId ? `${appId.substring(0, 8)}...` : null, // 只返回部分 appId
        templateId,
      },
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
      data: {
        configured: this.wechatService.isConfigured(),
        timestamp: Date.now(),
      },
    }
  }
}
