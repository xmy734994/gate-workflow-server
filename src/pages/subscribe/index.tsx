import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import Taro from '@tarojs/taro'
import { Bell, Smartphone, CircleCheck, CircleAlert } from 'lucide-react-taro'

// 订阅提醒项配置
const SUBSCRIPTION_ITEMS = [
  {
    id: 'boarding_wheelchair',
    title: '轮椅无陪确认',
    desc: '登机前15分钟提醒确认轮椅无陪旅客信息',
    templateId: 'BOARDING_WHEELCHAIR'
  },
  {
    id: 'departure_luggage',
    title: '行李预拉确认',
    desc: '起飞前20分钟提醒行李预拉操作',
    templateId: 'DEPARTURE_LUGGAGE'
  },
  {
    id: 'departure_comprehensive',
    title: '综合确认提醒',
    desc: '起飞前17分钟：行李、舱单、货舱、交 接情况',
    templateId: 'DEPARTURE_COMPREHENSIVE'
  },
  {
    id: 'departure_luggage_pull',
    title: '行李拉下操作',
    desc: '起飞前16分钟提醒完成行李拉下操作',
    templateId: 'DEPARTURE_LUGGAGE_PULL'
  },
  {
    id: 'departure_cabin_cargo',
    title: '舱单货舱确认',
    desc: '起飞前15分钟提醒舱单和货舱确认',
    templateId: 'DEPARTURE_CABIN_CARGO'
  },
  {
    id: 'boarding_prep',
    title: '登机现场准备',
    desc: '登机时间提醒：设备、系统、门禁、栏杆等',
    templateId: 'BOARDING_PREP'
  },
  {
    id: 'boarding_key流程',
    title: '关键流程复核',
    desc: '登机前15分钟：八个一、三复核、登机系统',
    templateId: 'BOARDING_KEY_CHECK'
  }
]

export default function SubscribePage() {
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const isMiniApp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP || Taro.getEnv() === Taro.ENV_TYPE.TT

  useEffect(() => {
    // 从本地存储加载已保存的订阅状态
    const savedSubs = Taro.getStorageSync('user_subscriptions') || {}
    const initialSubs: Record<string, boolean> = {}
    SUBSCRIPTION_ITEMS.forEach(item => {
      initialSubs[item.id] = savedSubs[item.id] || false
    })
    setSubscriptions(initialSubs)
  }, [])

  const handleToggle = (id: string, checked: boolean) => {
    if (!isMiniApp) {
      Taro.showToast({ title: '仅支持微信/抖音小程序', icon: 'none' })
      return
    }
    setSubscriptions(prev => ({ ...prev, [id]: checked }))
    setSaved(false)
  }

  const handleRequestSubscription = async (item: typeof SUBSCRIPTION_ITEMS[0]) => {
    if (!isMiniApp) {
      Taro.showToast({ title: '仅支持微信/抖音小程序', icon: 'none' })
      return
    }

    try {
      // 调用订阅消息 API
      const result = await new Promise<boolean>((resolve) => {
        if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
          // 微信小程序
          ;(Taro as any).requestSubscribeMessage({
            tmplIds: [item.templateId],
            success: (res: any) => {
              resolve(res[item.templateId] === 'accept')
            },
            fail: () => resolve(false)
          })
        } else if (Taro.getEnv() === Taro.ENV_TYPE.TT) {
          // 抖音小程序
          (Taro as any).subscribeMsg({
            msgType: 1,
            templateId: item.templateId,
            success: () => resolve(true),
            fail: () => resolve(false)
          })
        } else {
          resolve(false)
        }
      })

      if (result) {
        setSubscriptions(prev => ({ ...prev, [item.id]: true }))
        Taro.showToast({ title: '订阅成功', icon: 'success' })
      } else {
        setSubscriptions(prev => ({ ...prev, [item.id]: false }))
        Taro.showToast({ title: '您已拒绝订阅', icon: 'none' })
      }
    } catch (err) {
      console.error('订阅失败:', err)
      Taro.showToast({ title: '订阅失败', icon: 'none' })
    }
  }

  const handleSave = () => {
    Taro.setStorageSync('user_subscriptions', subscriptions)
    setSaved(true)
    Taro.showToast({ title: '保存成功', icon: 'success' })
  }

  const handleEnableAll = () => {
    if (!isMiniApp) {
      Taro.showToast({ title: '仅支持微信/抖音小程序', icon: 'none' })
      return
    }
    
    const newSubs: Record<string, boolean> = {}
    SUBSCRIPTION_ITEMS.forEach(item => {
      newSubs[item.id] = true
    })
    setSubscriptions(newSubs)
    setSaved(false)
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      {/* 提示信息 */}
      <Card className="mb-4 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <View className="flex items-start gap-3">
            <CircleAlert size={24} color="#1890ff" className="flex-shrink-0 mt-1" />
            <View>
              <Text className="block text-sm font-medium text-blue-800 mb-1">
                如何接收通知？
              </Text>
              <Text className="block text-xs text-blue-600">
                开启订阅后，当对应的提醒时间到达时，系统会通过服务通知推送消息到您的微信。您需要点击“订阅”按钮进行授权。
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 非小程序提示 */}
      {!isMiniApp && (
        <Card className="mb-4 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <View className="flex items-start gap-3">
              <Smartphone size={24} color="#f59e0b" className="flex-shrink-0 mt-1" />
              <View>
                <Text className="block text-sm font-medium text-amber-800 mb-1">
                  当前为 H5 预览模式
                </Text>
                <Text className="block text-xs text-amber-600">
                  订阅消息功能需要在微信小程序或抖音小程序中才能使用。请在真机上体验完整功能。
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 订阅项列表 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} color="#1890ff" />
            <Text className="block text-base">提醒通知设置</Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {SUBSCRIPTION_ITEMS.map((item, index) => (
            <View 
              key={item.id}
              className={`p-4 ${index < SUBSCRIPTION_ITEMS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <View className="flex items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="block text-sm font-medium text-gray-900 mb-1">
                    {item.title}
                  </Text>
                  <Text className="block text-xs text-gray-500">
                    {item.desc}
                  </Text>
                </View>
                {isMiniApp ? (
                  <Button 
                    size="sm"
                    variant={subscriptions[item.id] ? 'default' : 'outline'}
                    onClick={() => handleRequestSubscription(item)}
                    className={subscriptions[item.id] ? 'bg-green-500' : ''}
                  >
                    {subscriptions[item.id] ? (
                      <>
                        <CircleCheck size={14} color="#ffffff" className="mr-1" />
                        <Text>已订阅</Text>
                      </>
                    ) : (
                      <Text>订阅</Text>
                    )}
                  </Button>
                ) : (
                  <Switch 
                    checked={subscriptions[item.id]} 
                    onCheckedChange={(checked) => handleToggle(item.id, checked)}
                  />
                )}
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <View className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleEnableAll}
        >
          <Text>全部开启</Text>
        </Button>
        <Button 
          className="flex-1"
          onClick={handleSave}
        >
          <Text>{saved ? '已保存' : '保存设置'}</Text>
        </Button>
      </View>

      {/* 底部说明 */}
      <View className="mt-6 p-4 bg-gray-100 rounded-xl">
        <Text className="block text-xs text-gray-500 text-center">
          提示：您可以随时在此页面修改订阅设置。{'\n'}
          服务通知由微信官方推送，请确保微信版本为最新。
        </Text>
      </View>
    </View>
  )
}
