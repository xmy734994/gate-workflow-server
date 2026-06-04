import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Taro from '@tarojs/taro'
import { Bell, Smartphone, CircleCheck, CircleX, RefreshCw } from 'lucide-react-taro'
import { Network } from '@/network'
import { initJPush, getRegistrationId } from '@/lib/jpush'

export default function AppPush() {
  const [registrationId, setRegistrationId] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredAt, setRegisteredAt] = useState<string | null>(null)

  useEffect(() => {
    // 初始化极光推送
    initJPush()
    
    // 检查本地存储的 registrationId
    const savedRegId = Taro.getStorageSync('jpush_registration_id')
    const savedTime = Taro.getStorageSync('jpush_registered_time')
    
    if (savedRegId) {
      setRegistrationId(savedRegId)
      setIsRegistered(true)
      setRegisteredAt(savedTime || null)
    }
  }, [])

  const handleRegister = async () => {
    setIsLoading(true)
    setError('')

    try {
      // 获取 registrationId
      let regId = await getRegistrationId()
      
      if (!regId) {
        // 如果没获取到，等待一下再试
        await new Promise(resolve => setTimeout(resolve, 2000))
        regId = await getRegistrationId()
        if (!regId) {
          setError('无法获取设备码，请确保在APP环境中运行')
          setIsLoading(false)
          return
        }
      }
      
      setRegistrationId(regId)

      // 保存到后端
      const res = await Network.request({
        url: '/api/jpush/register',
        method: 'POST',
        data: {
          registrationId: regId,
          platform: Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? 'weapp' : 'app'
        }
      })

      console.log('[AppPush] 注册结果:', res)

      // 保存到本地
      Taro.setStorageSync('jpush_registration_id', regId)
      Taro.setStorageSync('jpush_registered_time', new Date().toLocaleString())
      
      setIsRegistered(true)
      setRegisteredAt(new Date().toLocaleString())
      
      Taro.showToast({
        title: '注册成功',
        icon: 'success'
      })
    } catch (err: any) {
      console.error('[AppPush] 注册失败:', err)
      setError(err?.message || '注册失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnregister = () => {
    Taro.removeStorageSync('jpush_registration_id')
    Taro.removeStorageSync('jpush_registered_time')
    setRegistrationId('')
    setIsRegistered(false)
    setRegisteredAt(null)
    Taro.showToast({
      title: '已取消注册',
      icon: 'success'
    })
  }

  const handleTestPush = async () => {
    if (!registrationId) {
      Taro.showToast({ title: '请先注册', icon: 'none' })
      return
    }

    try {
      await Network.request({
        url: '/api/jpush/send',
        method: 'POST',
        data: {
          registrationId,
          title: '测试推送',
          content: '这是一条测试推送消息'
        }
      })
      Taro.showToast({
        title: '测试推送已发送',
        icon: 'success'
      })
    } catch (err) {
      Taro.showToast({
        title: '发送失败',
        icon: 'none'
      })
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      {/* 头部说明 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} color="#1890ff" />
            <Text>APP推送设置</Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="block text-sm text-gray-600">
            开启APP推送后，系统会在提醒时间到达时向您的手机发送推送通知。
            即使手机息屏或APP在后台运行，也能收到提醒。
          </Text>
        </CardContent>
      </Card>

      {/* 当前状态 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone size={20} color="#1890ff" />
            <Text>设备状态</Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 状态指示 */}
          <View className="flex items-center justify-between">
            <Text className="block text-sm text-gray-600">推送状态</Text>
            <Badge variant={isRegistered ? 'default' : 'secondary'}>
              <View className="flex items-center gap-1">
                {isRegistered ? (
                  <>
                    <CircleCheck size={14} color="#22c55e" />
                    <Text>已注册</Text>
                  </>
                ) : (
                  <>
                    <CircleX size={14} color="#ef4444" />
                    <Text>未注册</Text>
                  </>
                )}
              </View>
            </Badge>
          </View>

          {/* RegistrationId */}
          {registrationId && (
            <View className="space-y-1">
              <Text className="block text-xs text-gray-500">设备码</Text>
              <View className="bg-gray-100 rounded-lg p-2 break-all">
                <Text className="block text-xs text-gray-700 font-mono">
                  {registrationId}
                </Text>
              </View>
            </View>
          )}

          {/* 注册时间 */}
          {registeredAt && (
            <View className="flex items-center gap-2">
              <Text className="block text-xs text-gray-500">注册时间</Text>
              <Text className="block text-xs text-gray-700">{registeredAt}</Text>
            </View>
          )}

          {/* 错误信息 */}
          {error && (
            <View className="bg-red-50 rounded-lg p-3">
              <Text className="block text-sm text-red-600">{error}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          {!isRegistered ? (
            <Button
              className="w-full bg-primary"
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <View className="flex items-center gap-2">
                  <RefreshCw size={16} color="#ffffff" className="animate-spin" />
                  <Text>注册中...</Text>
                </View>
              ) : (
                <View className="flex items-center gap-2">
                  <Bell size={16} color="#ffffff" />
                  <Text>开启推送通知</Text>
                </View>
              )}
            </Button>
          ) : (
            <View className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleTestPush}
              >
                <View className="flex items-center gap-2">
                  <Bell size={16} color="#1890ff" />
                  <Text>发送测试推送</Text>
                </View>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full text-red-500"
                onClick={handleUnregister}
              >
                <Text>取消推送通知</Text>
              </Button>
            </View>
          )}
        </CardContent>
      </Card>

      {/* 注意事项 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">注意事项</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="space-y-2 text-xs text-gray-500">
            <View className="flex items-start gap-2">
              <Text>1.</Text>
              <Text>请确保手机设置中允许该APP发送通知</Text>
            </View>
            <View className="flex items-start gap-2">
              <Text>2.</Text>
              <Text>推送通知需要在手机设置中开启&ldquo;允许通知&ldquo;权限</Text>
            </View>
            <View className="flex items-start gap-2">
              <Text>3.</Text>
              <Text>部分手机需要在电池优化中设置允许后台运行</Text>
            </View>
            <View className="flex items-start gap-2">
              <Text>4.</Text>
              <Text>APP推送不限制发送次数，可以收到所有提醒</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
