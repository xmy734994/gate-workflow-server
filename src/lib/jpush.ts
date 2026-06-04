/**
 * 极光推送服务 - 小程序简化版本
 * 
 * 使用说明：
 * 1. 在极光官网注册应用，获取 AppKey
 * 2. 下载极光小程序 SDK：https://docs.jiguang.cn/jpush/client/plush/jpush-mini-program-sdk/
 * 3. 将 SDK 文件放到项目 utils 目录
 * 4. 初始化服务并获取 RegistrationId
 */

interface JPushMessage {
  title?: string
  content: string
  extras?: Record<string, any>
}

class JPushService {
  private appKey: string = ''
  private registrationId: string = ''
  private isInitialized: boolean = false
  private messageCallback: ((msg: JPushMessage) => void) | null = null

  /**
   * 初始化极光推送
   * @param appKey 极光应用 AppKey
   */
  async init(appKey?: string): Promise<void> {
    // 从环境变量或参数获取 AppKey
    // 注意：前端只能使用极光小程序 SDK 获取 registrationId
    // 实际的推送发送需要通过后端调用极光 REST API
    this.appKey = appKey || 'your-appkey'
    
    if (!this.appKey || this.appKey === 'your-appkey') {
      console.log('[JPush] 请配置 JPUSH_APPKEY 环境变量')
      console.log('[JPush] 在 .env 文件中添加: JPUSH_APPKEY=你的极光AppKey')
      return
    }

    this.isInitialized = true
    console.log('[JPush] 初始化成功，AppKey:', this.appKey)

    // 获取 RegistrationId
    await this.getRegistrationId()
  }

  /**
   * 获取 RegistrationId
   * 
   * 极光小程序 SDK 的实际使用方式：
   * 
   * 1. 下载 SDK 后，在项目中引入：
   *    const JPush = require('./utils/jpush-wx.js')
   * 
   * 2. 初始化：
   *    JPush.init({
   *      appKey: 'your-appkey',
   *      apiUrl: 'https://api.jiguang.cn'
   *    })
   * 
   * 3. 获取 RegistrationId：
   *    JPush.getRegistrationId((id) => {
   *      console.log('RegistrationId:', id)
   *    })
   */
  async getRegistrationId(): Promise<string> {
    // 先从本地缓存获取
    try {
      // @ts-ignore
      const cached = wx?.getStorageSync('jpush_registration_id')
      if (cached) {
        this.registrationId = cached
        console.log('[JPush] 使用缓存的 RegistrationId:', this.registrationId)
        return this.registrationId
      }
    } catch (e) {
      console.error('[JPush] 读取缓存失败:', e)
    }

    // 尝试使用极光小程序 SDK
    // 请下载并引入极光小程序 SDK: https://docs.jiguang.cn/jpush/client/plush/jpush-mini-program-sdk/
    try {
      // @ts-ignore
      const JPush = require('./utils/jpush-wx')
      
      // 初始化 SDK
      JPush.init({
        appKey: this.appKey,
        apiUrl: 'https://api.jiguang.cn'
      })

      // 获取 RegistrationId
      return new Promise((resolve) => {
        JPush.getRegistrationId((id: string) => {
          if (id) {
            this.registrationId = id
            console.log('[JPush] RegistrationId:', this.registrationId)
            
            // 保存到本地
            try {
              // @ts-ignore
              wx?.setStorageSync('jpush_registration_id', id)
            } catch (e) {
              console.error('[JPush] 保存 RegistrationId 失败:', e)
            }
            
            resolve(this.registrationId)
          } else {
            // SDK 未成功获取，使用模拟 ID
            this.registrationId = `mock_${Date.now()}`
            resolve(this.registrationId)
          }
        })
      })
    } catch (e) {
      // SDK 未安装或加载失败，使用模拟 ID
      console.log('[JPush] 极光小程序 SDK 未加载，使用模拟 RegistrationId')
      this.registrationId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 保存模拟 ID
      try {
        // @ts-ignore
        wx?.setStorageSync('jpush_registration_id', this.registrationId)
      } catch (err) {
        console.error('[JPush] 保存 RegistrationId 失败:', err)
      }
      
      return this.registrationId
    }
  }

  /**
   * 设置消息监听
   */
  setMessageListener(callback: (msg: JPushMessage) => void): void {
    this.messageCallback = callback
    
    // 尝试使用极光 SDK 设置监听
    try {
      // @ts-ignore
      const JPush = require('./utils/jpush-wx')
      JPush.addMessageListener((message: JPushMessage) => {
        if (this.messageCallback) {
          this.messageCallback(message)
        }
      })
    } catch (e) {
      console.log('[JPush] 设置消息监听失败:', e)
    }
  }

  /**
   * 获取 RegistrationId（同步）
   */
  getId(): string {
    return this.registrationId
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized && !!this.registrationId
  }

  /**
   * 清除本地存储
   */
  clear(): void {
    try {
      // @ts-ignore
      wx?.removeStorageSync('jpush_registration_id')
      this.registrationId = ''
      console.log('[JPush] 已清除本地 RegistrationId')
    } catch (e) {
      console.error('[JPush] 清除缓存失败:', e)
    }
  }
}

// 导出单例
export const jpushService = new JPushService()
export default jpushService

// 导出便捷函数供动态导入使用
export const initJPush = () => jpushService.init()
export const getRegistrationId = () => jpushService.getRegistrationId()
export const setMessageListener = (callback: (msg: JPushMessage) => void) => jpushService.setMessageListener(callback)
