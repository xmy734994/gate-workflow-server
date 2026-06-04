/**
 * 极光推送服务
 * 用于 APP 原生推送
 */

// 极光推送的 React Native 模块
let JPushModule: any = null

// 尝试获取极光推送模块
try {
  // @ts-ignore
  JPushModule = require('jpush-react-native').JPushModule
} catch (e) {
  console.log('[JPush] 模块未加载（非APP环境）')
}

class JPushService {
  private registrationId: string = ''
  private isInitialized: boolean = false

  /**
   * 初始化极光推送
   */
  async init(): Promise<void> {
    if (!JPushModule) {
      console.log('[JPush] 非APP环境，跳过初始化')
      return
    }

    try {
      // 初始化
      JPushModule.init()
      this.isInitialized = true
      console.log('[JPush] 初始化成功')

      // 获取 registrationId
      this.getRegistrationId()
    } catch (error) {
      console.error('[JPush] 初始化失败:', error)
    }
  }

  /**
   * 获取设备 RegistrationId
   */
  async getRegistrationId(): Promise<string> {
    if (!JPushModule) {
      console.log('[JPush] 非APP环境')
      return ''
    }

    return new Promise((resolve) => {
      JPushModule.getRegistrationID((result: { registerID: string }) => {
        if (result && result.registerID) {
          this.registrationId = result.registerID
          console.log('[JPush] RegistrationID:', this.registrationId)
          resolve(this.registrationId)
        } else {
          console.log('[JPush] 未获取到 RegistrationID')
          resolve('')
        }
      })
    })
  }

  /**
   * 设置推送监听
   */
  setPushListener(callback: (message: any) => void): void {
    if (!JPushModule) {
      console.log('[JPush] 非APP环境，跳过监听设置')
      return
    }

    // @ts-ignore
    const { JPushEventReceiveMessage, JPushEventOpenMessage } = require('jpush-react-native')

    // 收到消息
    JPushEventReceiveMessage.addListener((message: any) => {
      console.log('[JPush] 收到消息:', message)
      callback(message)
    })

    // 点击消息
    JPushEventOpenMessage.addListener((message: any) => {
      console.log('[JPush] 点击消息:', message)
      callback(message)
    })
  }

  /**
   * 设置标签（用于分组推送）
   */
  async setTags(tags: string[]): Promise<void> {
    if (!JPushModule) return

    try {
      JPushModule.setTags(tags)
      console.log('[JPush] 标签设置成功:', tags)
    } catch (error) {
      console.error('[JPush] 标签设置失败:', error)
    }
  }

  /**
   * 获取当前的 RegistrationId
   */
  getCurrentRegistrationId(): string {
    return this.registrationId
  }

  /**
   * 检查是否是APP环境
   */
  isAPP(): boolean {
    return !!JPushModule && this.isInitialized
  }
}

export const jpushService = new JPushService()

// 导出便捷方法
export const initJPush = () => jpushService.init()
export const getRegistrationId = () => jpushService.getRegistrationId()
export const setPushListener = (callback: (message: any) => void) => jpushService.setPushListener(callback)
