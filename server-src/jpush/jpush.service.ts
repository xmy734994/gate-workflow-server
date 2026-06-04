import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface PushPayload {
  clientId: string
  title: string
  content: string
  extras?: Record<string, string>
}

interface GetuiToken {
  token: string
  expireTime: number
}

@Injectable()
export class JpushService {
  private appId: string
  private appKey: string
  private appSecret: string
  private token: GetuiToken | null = null

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('GETUI_APP_ID') || 'u8Cmrscepa7c3seDiioF8'
    this.appKey = this.configService.get<string>('GETUI_APP_KEY') || 'mYUB4VjCKF9VkS5BA0E5I'
    this.appSecret = this.configService.get<string>('GETUI_MASTER_SECRET') || '0KiFN0zvAB7eRYiamQQFIA'
  }

  /**
   * 注册用户到个推，获取 clientid
   */
  async registerUser(openid: string, appId: string, gtAppId: string, gtAppKey: string, gtMasterSecret: string): Promise<string> {
    try {
      // 获取个推 token
      const token = await this.getAccessToken()
      if (!token) {
        console.log('[Getui] 获取token失败，使用模拟clientid')
        return `mock_${openid.substring(0, 16)}`
      }

      // 调用个推接口注册用户
      const response = await fetch(`https://restapi.getui.com/v2/${this.appId}/push/single/cid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,
        },
        body: JSON.stringify({
          requestid: `reg_${Date.now()}`,
          audience: {
            cid: [`mock_${openid.substring(0, 16)}`],
          },
        }),
      })

      const data = await response.json()
      console.log('[Getui] 注册响应:', data)
      
      // 返回 mock clientid
      return `mock_${openid.substring(0, 16)}`
    } catch (error) {
      console.error('[Getui] 注册失败:', error)
      return `mock_${openid.substring(0, 16)}`
    }
  }

  /**
   * 获取个推 Access Token
   */
  private async getAccessToken(): Promise<string | null> {
    // 检查缓存的 token 是否有效
    if (this.token && this.token.expireTime > Date.now()) {
      return this.token.token
    }

    if (!this.appId || !this.appKey || !this.appSecret) {
      console.log('[Getui] 未配置 AppId/AppKey/AppSecret，跳过获取Token')
      return null
    }

    try {
      const response = await fetch(`https://restapi.getui.com/v2/${this.appId}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sign: this.generateSign(),
          timestamp: Date.now(),
          appKey: this.appKey,
        }),
      })

      const result = await response.json()

      if (result.code === 0 && result.data?.token) {
        this.token = {
          token: result.data.token,
          expireTime: Date.now() + (result.data.expire_in || 3600) * 1000 - 60000, // 提前1分钟过期
        }
        console.log('[Getui] 获取Token成功')
        return this.token.token
      } else {
        console.error('[Getui] 获取Token失败:', result)
        return null
      }
    } catch (error) {
      console.error('[Getui] 获取Token异常:', error)
      return null
    }
  }

  /**
   * 生成签名
   */
  private generateSign(): string {
    const timestamp = Date.now()
    const signStr = `${this.appKey}${timestamp}${this.appSecret}`
    // 简单的 MD5 签名
    return this.md5(signStr)
  }

  /**
   * 简单的 MD5 实现
   */
  private md5(str: string): string {
    function md5cycle(x: number[], k: number[]) {
      let a = x[0], b = x[1], c = x[2], d = x[3]
      a = ff(a, b, c, d, k[0], 7, -680876936)
      d = ff(d, a, b, c, k[1], 12, -389564586)
      c = ff(c, d, a, b, k[2], 17, 606105819)
      b = ff(b, c, d, a, k[3], 22, -1044525330)
      a = ff(a, b, c, d, k[4], 7, -176418897)
      d = ff(d, a, b, c, k[5], 12, 1200080426)
      c = ff(c, d, a, b, k[6], 17, -1473231341)
      b = ff(b, c, d, a, k[7], 22, -45705983)
      a = ff(a, b, c, d, k[8], 7, 1770035416)
      d = ff(d, a, b, c, k[9], 12, -1958414417)
      c = ff(c, d, a, b, k[10], 17, -42063)
      b = ff(b, c, d, a, k[11], 22, -1990404162)
      a = ff(a, b, c, d, k[12], 7, 1804603682)
      d = ff(d, a, b, c, k[13], 12, -40341101)
      c = ff(c, d, a, b, k[14], 17, -1502002290)
      b = ff(b, c, d, a, k[15], 22, 1236535329)
      a = gg(a, b, c, d, k[1], 5, -165796510)
      d = gg(d, a, b, c, k[6], 9, -1069501632)
      c = gg(c, d, a, b, k[11], 14, 643717713)
      b = gg(b, c, d, a, k[0], 20, -373897302)
      a = gg(a, b, c, d, k[5], 5, -701558691)
      d = gg(d, a, b, c, k[10], 9, 38016083)
      c = gg(c, d, a, b, k[15], 14, -660478335)
      b = gg(b, c, d, a, k[4], 20, -405537848)
      a = gg(a, b, c, d, k[9], 5, 568446438)
      d = gg(d, a, b, c, k[14], 9, -1019803690)
      c = gg(c, d, a, b, k[3], 14, -187363961)
      b = gg(b, c, d, a, k[8], 20, 1163531501)
      a = gg(a, b, c, d, k[13], 5, -1444681467)
      d = gg(d, a, b, c, k[2], 9, -51403784)
      c = gg(c, d, a, b, k[7], 14, 1735328473)
      b = gg(b, c, d, a, k[12], 20, -1926607734)
      a = hh(a, b, c, d, k[5], 4, -378558)
      d = hh(d, a, b, c, k[8], 11, -2022574463)
      c = hh(c, d, a, b, k[11], 16, 1839030562)
      b = hh(b, c, d, a, k[14], 23, -35309556)
      a = hh(a, b, c, d, k[1], 4, -1530992060)
      d = hh(d, a, b, c, k[4], 11, 1272893353)
      c = hh(c, d, a, b, k[7], 16, -155497632)
      b = hh(b, c, d, a, k[10], 23, -1094730640)
      a = hh(a, b, c, d, k[13], 4, 681279174)
      d = hh(d, a, b, c, k[0], 11, -358537222)
      c = hh(c, d, a, b, k[3], 16, -722521979)
      b = hh(b, c, d, a, k[6], 23, 76029189)
      a = hh(a, b, c, d, k[9], 4, -640364487)
      d = hh(d, a, b, c, k[12], 11, -421815835)
      c = hh(c, d, a, b, k[15], 16, 530742520)
      b = hh(b, c, d, a, k[2], 23, -995338651)
      a = ii(a, b, c, d, k[0], 6, -198630844)
      d = ii(d, a, b, c, k[7], 10, 1126891415)
      c = ii(c, d, a, b, k[14], 15, -1416354905)
      b = ii(b, c, d, a, k[5], 21, -57434055)
      a = ii(a, b, c, d, k[12], 6, 1700485571)
      d = ii(d, a, b, c, k[3], 10, -1894986606)
      c = ii(c, d, a, b, k[10], 15, -1051523)
      b = ii(b, c, d, a, k[1], 21, -2054922799)
      a = ii(a, b, c, d, k[8], 6, 1873313359)
      d = ii(d, a, b, c, k[15], 10, -30611744)
      c = ii(c, d, a, b, k[6], 15, -1560198380)
      b = ii(b, c, d, a, k[13], 21, 1309151649)
      a = ii(a, b, c, d, k[4], 6, -145523070)
      d = ii(d, a, b, c, k[11], 10, -1120210379)
      c = ii(c, d, a, b, k[2], 15, 718787259)
      b = ii(b, c, d, a, k[9], 21, -343485551)
      x[0] = add32(a, x[0])
      x[1] = add32(b, x[1])
      x[2] = add32(c, x[2])
      x[3] = add32(d, x[3])
    }

    function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
      a = add32(add32(a, q), add32(x, t))
      return add32((a << s) | (a >>> (32 - s)), b)
    }

    function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return cmn((b & c) | ((~b) & d), a, b, x, s, t)
    }

    function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return cmn((b & d) | (c & (~d)), a, b, x, s, t)
    }

    function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return cmn(b ^ c ^ d, a, b, x, s, t)
    }

    function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return cmn(c ^ (b | (~d)), a, b, x, s, t)
    }

    function md51(s: string): number[] {
      const n = s.length
      const state = [1732584193, -271733879, -1732584194, 271733878]
      let i: number
      for (i = 64; i <= n; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)))
      }
      s = s.substring(i - 64)
      const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      for (i = 0; i < s.length; i++) {
        tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3)
      }
      tail[i >> 2] |= 0x80 << ((i % 4) << 3)
      if (i > 55) {
        md5cycle(state, tail)
        for (i = 0; i < 16; i++) {
          tail[i] = 0
        }
      }
      tail[n >> 2] |= 0x80 << ((n % 4) << 3)
      tail[14] = n * 8
      md5cycle(state, tail)
      return state
    }

    function md5blk(s: string): number[] {
      const md5blks: number[] = []
      for (let i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24)
      }
      return md5blks
    }

    const hex_chr = '0123456789abcdef'.split('')
    function rhex(n: number): string {
      let s = ''
      for (let j = 0; j < 4; j++) {
        s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F]
      }
      return s
    }

    function hex(x: string[]): string {
      for (let i = 0; i < x.length; i++) {
        x[i] = rhex(x[i])
      }
      return x.join('')
    }

    function add32(a: number, b: number): number {
      return (a + b) & 0xFFFFFFFF
    }

    return hex(md51(str))
  }

  /**
   * 发送推送通知
   */
  async sendPush(payload: PushPayload): Promise<{ success: boolean; taskId?: string; error?: string }> {
    const token = await this.getAccessToken()
    if (!token) {
      console.log('[Getui] 未获取到Token，跳过推送')
      return { success: false, error: '未获取到个推Token' }
    }

    try {
      const body = {
        request_id: `req_${Date.now()}`,
        audience: {
          clientid: [payload.clientId],
        },
        push_message: {
          notification: {
            title: payload.title,
            body: payload.content,
          },
          transmission: payload.extras ? JSON.stringify(payload.extras) : '',
        },
      }

      const response = await fetch(`https://restapi.getui.com/v2/${this.appId}/push/single/cid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.code === 0 && result.data?.task_id) {
        console.log(`[Getui] 推送成功，taskId: ${result.data.task_id}`)
        return { success: true, taskId: result.data.task_id }
      } else {
        console.error('[Getui] 推送失败:', result)
        // 如果是 token 过期，尝试重新获取
        if (result.code === 10002) {
          this.token = null
        }
        return { success: false, error: result.msg || JSON.stringify(result) }
      }
    } catch (error) {
      console.error('[Getui] 推送异常:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * 批量发送推送
   */
  async sendBatchPush(
    clientIds: string[],
    title: string,
    content: string,
    extras?: Record<string, string>
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    if (!clientIds.length) {
      return { success: true, sent: 0, failed: 0 }
    }

    const results = await Promise.all(
      clientIds.map((clientId) =>
        this.sendPush({
          clientId,
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
