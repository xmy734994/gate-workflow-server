/**
 * 订阅消息页面
 * 使用纯服务端方式获取 openid 并绑定个推，无需插件
 */
import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, CircleCheck, CircleX } from 'lucide-react-taro'
import { initJPush, getRegistrationId } from '@/lib/jpush'

// 提醒类型配置
const REMINDER_TYPES = [
  { key: 'wheelchair', label: '轮椅无陪信息确认', description: '登机前15分钟提醒' },
  { key: 'baggage_pre', label: '行李预拉确认', description: '起飞前20分钟提醒' },
  { key: 'comprehensive', label: '行李/舱单/货舱/交接确认', description: '起飞前17分钟提醒' },
  { key: 'baggage_pull', label: '行李拉下操作', description: '起飞前16分钟提醒' },
  { key: 'manifest_confirm', label: '舱单和货舱确认', description: '起飞前15分钟提醒' },
  { key: 'boarding_prep', label: '现场准备确认', description: '登机时间提醒' },
  { key: 'key_process', label: '关键流程复核', description: '登机前15分钟提醒' },
]

export default function SubscribePage() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [binding, setBinding] = useState(false)
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending')
  const [openid, setOpenid] = useState('')
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({})
  const isMiniApp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP || Taro.getEnv() === Taro.ENV_TYPE.TT

  useEffect(() => {
    if (isMiniApp) {
      // 检查本地保存的状态
      const savedOpenid = Taro.getStorageSync('user_openid')
      const savedEnabled = Taro.getStorageSync('push_enabled')
      const savedSubs = Taro.getStorageSync('push_subscriptions')
      
      if (savedOpenid) {
        setOpenid(savedOpenid)
        setPushEnabled(savedEnabled)
        setSubscriptions(savedSubs || {})
        setStatus('success')
      }
      
      // 初始化个推
      initJPush('u8Cmrscepa7c3seDiioF8')
    }
  }, [isMiniApp])

  const handleEnablePush = async () => {
    if (!isMiniApp) {
      Taro.showToast({ title: '仅支持小程序环境', icon: 'none' })
      return
    }

    setBinding(true)
    try {
      // 1. 调用 wx.login 获取 code
      const loginRes = await Taro.login()
      if (!loginRes.code) {
        Taro.showToast({ title: '获取登录凭证失败', icon: 'none' })
        setBinding(false)
        return
      }

      // 等待获取 Registration ID
      let registrationId = ''
      let retries = 0
      while (!registrationId && retries < 10) {
        registrationId = getRegistrationId()
        if (!registrationId) {
          await new Promise(resolve => setTimeout(resolve, 500))
          retries++
        }
      }
      
      console.log('[订阅] 获取到 RegistrationId:', registrationId)

      // 2. 发送到后端获取 openid 并绑定个推
      const res = await Network.request({
        url: '/api/jpush/wxlogin',
        method: 'POST',
        data: {
          code: loginRes.code,
          appId: 'u8Cmrscepa7c3seDiioF8',
          registrationId: registrationId
        }
      })

      console.log('后端返回:', res.data)

      if (res.data?.data?.openid) {
        const userOpenid = res.data.data.openid
        
        // 3. 保存到本地
        Taro.setStorageSync('user_openid', userOpenid)
        Taro.setStorageSync('push_enabled', true)
        Taro.setStorageSync('registration_id', registrationId)
        
        setOpenid(userOpenid)
        setPushEnabled(true)
        setStatus('success')
        
        Taro.showToast({ title: '开启推送成功', icon: 'success' })
      } else {
        Taro.showToast({ title: '开启推送失败，请重试', icon: 'none' })
        setStatus('failed')
      }
    } catch (err) {
      console.error('开启推送失败:', err)
      Taro.showToast({ title: '网络错误，请重试', icon: 'none' })
      setStatus('failed')
    } finally {
      setBinding(false)
    }
  }

  const toggleSubscription = async (key: string) => {
    const newSubs = { ...subscriptions, [key]: !subscriptions[key] }
    setSubscriptions(newSubs)
    Taro.setStorageSync('push_subscriptions', newSubs)

    // 保存到后端
    try {
      await Network.request({
        url: '/api/jpush/subscriptions',
        method: 'POST',
        data: {
          openid,
          subscriptions: newSubs
        }
      })
    } catch (err) {
      console.error('保存订阅设置失败:', err)
    }
  }

  const renderStatusIcon = () => {
    if (status === 'success') {
      return <CircleCheck size={24} color="#22c55e" />
    } else if (status === 'failed') {
      return <CircleX size={24} color="#ef4444" />
    }
    return null
  }

  return (
    <ScrollView className="min-h-screen bg-gray-50 pb-safe">
      <View className="p-4">
        {/* 页面标题 */}
        <View className="mb-6">
          <Text className="block text-2xl font-bold text-gray-900">推送设置</Text>
          <Text className="block text-sm text-gray-500 mt-1">
            开启推送接收登机口工作提醒
          </Text>
        </View>

        {/* 推送状态卡片 */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <View className="flex items-center gap-4">
              <View className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                <Bell size={24} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="block text-lg font-semibold text-gray-900">
                  推送通知 {renderStatusIcon()}
                </Text>
                {status === 'success' && openid && (
                  <Text className="block text-xs text-gray-500 mt-1">
                    已绑定用户: {openid.slice(0, 10)}...
                  </Text>
                )}
              </View>
            </View>
            
            <Button
              className="w-full mt-4"
              onClick={handleEnablePush}
              disabled={binding || (status === 'success')}
            >
              <Text>{binding ? '绑定中...' : status === 'success' ? '已开启' : '开启推送'}</Text>
            </Button>
          </CardContent>
        </Card>

        {/* 提醒类型列表 */}
        <Card>
          <CardHeader>
            <CardTitle>提醒类型</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {REMINDER_TYPES.map((item, index) => (
              <View
                key={item.key}
                className={`flex items-center justify-between p-4 ${index !== REMINDER_TYPES.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="flex-1">
                  <Text className="block font-medium text-gray-900">{item.label}</Text>
                  <Text className="block text-xs text-gray-500 mt-1">{item.description}</Text>
                </View>
                <View
                  onClick={() => pushEnabled && toggleSubscription(item.key)}
                  className={`w-12 h-7 rounded-full relative transition-colors ${
                    subscriptions[item.key] ? 'bg-blue-500' : 'bg-gray-300'
                  } ${!pushEnabled ? 'opacity-50' : ''}`}
                >
                  <View
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      subscriptions[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 说明 */}
        <View className="mt-6 p-4 bg-blue-50 rounded-xl">
          <Text className="block text-sm text-blue-800">
            <Text className="font-semibold">温馨提示：</Text>
            {'\n'}开启推送后，当有登机口工作提醒时，您将收到微信服务通知。请确保已在微信中允许通知权限。
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
