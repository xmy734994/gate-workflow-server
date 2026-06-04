import Taro from '@tarojs/taro'

// 个推服务实例
let jpushService: any = null

// 初始化个推
export const initJPush = (appid: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('[个推] 开始初始化, appid:', appid)
    
    try {
      // @ts-ignore
      const gtPush = require('./getui/GETUI_MINIPROGRAM_SDK_2.0.4/WxMini/gtpush-min.js')
      
      jpushService = gtPush.init({
        appid,
        onClientId: (res: { cid: string }) => {
          console.log('[个推] 获取到 clientId:', res.cid)
          Taro.setStorageSync('jpush_cid', res.cid)
        },
        onlineState: (res: { online: boolean }) => {
          console.log('[个推] 在线状态:', res.online)
        },
        onPushMsg: (res: { message: string }) => {
          console.log('[个推] 收到推送消息:', res.message)
        }
      })
      
      resolve('初始化成功')
    } catch (error) {
      console.error('[个推] 初始化失败:', error)
      reject(error)
    }
  })
}

// 获取客户端ID
export const getRegistrationId = (): string => {
  return jpushService?.getRegistrationId() || Taro.getStorageSync('jpush_cid') || ''
}

// 检查是否已初始化
export const isJPushReady = (): boolean => {
  return jpushService !== null
}
