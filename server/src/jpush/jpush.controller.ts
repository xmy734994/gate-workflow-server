import { Controller, Post, Body, Get, Inject } from '@nestjs/common'
import { JpushService, PushPayload } from './jpush.service'

@Controller('jpush')
export class JpushController {
  constructor(private readonly jpushService: JpushService) {}

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
