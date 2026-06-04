/**
 * APP推送设置页面
 * 用于极光推送集成
 */

import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { jpushService } from '@/lib/jpush'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

interface PushState {
  isEnabled: boolean
  registrationId: string
  isConnected: boolean
}

export default function AppPushPage() {
  const [pushState, setPushState] = useState<PushState>({
    isEnabled: false,
    registrationId: '',
    isConnected: false,
  })
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    // 检查存储的推送设置
    try {
      const enabled = Taro.getStorageSync('push_enabled')
      const regId = Taro.getStorageSync('jpush_registration_id')
      
      setPushState({
        isEnabled: !!enabled,
        registrationId: regId || '',
        isConnected: !!regId,
      })
    } catch (e) {
      console.error('读取推送设置失败:', e)
    }
  }, [])

  /**
   * 初始化并获取 RegistrationId
   */
  const handleEnablePush = async () => {
    setRegistering(true)
    
    try {
      // 初始化极光推送
      await jpushService.init()
      
      // 获取 RegistrationId
      const regId = await jpushService.getRegistrationId()
      
      // 保存到本地
      Taro.setStorageSync('push_enabled', true)
      Taro.setStorageSync('jpush_registration_id', regId)
      
      // 同步到后端
      await syncRegistrationId(regId)
      
      setPushState({
        isEnabled: true,
        registrationId: regId,
        isConnected: true,
      })
      
      Taro.showToast({
        title: '推送已启用',
        icon: 'success'
      })
    } catch (error) {
      console.error('启用推送失败:', error)
      Taro.showToast({
        title: '启用失败',
        icon: 'none'
      })
    } finally {
      setRegistering(false)
    }
  }

  /**
   * 禁用推送
   */
  const handleDisablePush = () => {
    jpushService.clear()
    Taro.removeStorageSync('push_enabled')
    
    setPushState({
      isEnabled: false,
      registrationId: '',
      isConnected: false,
    })
    
    Taro.showToast({
      title: '推送已禁用',
      icon: 'success'
    })
  }

  /**
   * 同步 RegistrationId 到后端
   */
  const syncRegistrationId = async (registrationId: string) => {
    try {
      await Network.request({
        url: '/api/jpush/register',
        method: 'POST',
        data: {
          registrationId,
          platform: 'weapp',
          enabled: true,
        }
      })
      console.log('RegistrationId 已同步到后端')
    } catch (error) {
      console.error('同步 RegistrationId 失败:', error)
    }
  }

  /**
   * 刷新 RegistrationId
   */
  const handleRefresh = async () => {
    setLoading(true)
    
    try {
      // 清除旧的
      jpushService.clear()
      
      // 重新获取
      const regId = await jpushService.getRegistrationId()
      
      Taro.setStorageSync('jpush_registration_id', regId)
      Taro.setStorageSync('push_enabled', true)
      
      // 同步到后端
      await syncRegistrationId(regId)
      
      setPushState({
        isEnabled: true,
        registrationId: regId,
        isConnected: true,
      })
      
      Taro.showToast({
        title: '已刷新',
        icon: 'success'
      })
    } catch (error) {
      console.error('刷新失败:', error)
      Taro.showToast({
        title: '刷新失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* 头部 */}
      <View className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 rounded-b-3xl shadow-lg">
        <Text className="block text-white text-sm opacity-90 mb-1">登机提醒推送设置</Text>
        <Text className="block text-white text-2xl font-bold">APP推送配置</Text>
        <Text className="block text-white text-sm opacity-80 mt-2">
          启用推送后，可通过极光通道接收登机提醒通知
        </Text>
      </View>

      {/* 内容区域 */}
      <View className="px-4 -mt-4">
        {/* 状态卡片 */}
        <Card className="bg-white rounded-2xl shadow-md mb-4">
          <CardContent className="p-5">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-3">
                <View className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  pushState.isConnected ? 'bg-green-100' : 'bg-gray-100'
                }`}
                >
                  <Text className={`text-2xl ${pushState.isConnected ? '' : 'opacity-50'}`}>
                    {pushState.isConnected ? '🔔' : '🔕'}
                  </Text>
                </View>
                <View>
                  <Text className="block text-lg font-semibold text-gray-800">
                    {pushState.isConnected ? '推送已启用' : '推送未启用'}
                  </Text>
                  <Text className="block text-sm text-gray-500">
                    {pushState.isConnected ? '正在接收提醒通知' : '点击下方按钮启用'}
                  </Text>
                </View>
              </View>
              <View className={`px-3 py-1 rounded-full text-xs font-medium ${
                pushState.isConnected 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}
              >
                {pushState.isConnected ? '已连接' : '未连接'}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* RegistrationId */}
        {pushState.registrationId && (
          <Card className="bg-white rounded-2xl shadow-md mb-4">
            <CardContent className="p-5">
              <Text className="block text-sm font-medium text-gray-700 mb-2">
                设备 RegistrationId
              </Text>
              <View className="bg-gray-50 rounded-xl p-3 break-all">
                <Text className="block text-xs text-gray-600 font-mono">
                  {pushState.registrationId}
                </Text>
              </View>
              <Text className="block text-xs text-gray-400 mt-2">
                用于标识当前设备的唯一ID
              </Text>
            </CardContent>
          </Card>
        )}

        {/* 操作按钮 */}
        <Card className="bg-white rounded-2xl shadow-md mb-4">
          <CardContent className="p-5">
            <View className="space-y-3">
              {!pushState.isEnabled ? (
                <Button
                  onClick={handleEnablePush}
                  disabled={registering}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl"
                >
                  <Text className="block">
                    {registering ? '正在启用...' : '启用推送通知'}
                  </Text>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl"
                  >
                    <Text className="block">
                      {loading ? '正在刷新...' : '刷新 RegistrationId'}
                    </Text>
                  </Button>
                  <Button
                    onClick={handleDisablePush}
                    variant="outline"
                    className="w-full py-4 rounded-xl border-gray-200"
                  >
                    <Text className="block text-gray-600">禁用推送</Text>
                  </Button>
                </>
              )}
            </View>
          </CardContent>
        </Card>

        {/* 说明 */}
        <Card className="bg-white rounded-2xl shadow-md mb-6">
          <CardContent className="p-5">
            <Text className="block text-sm font-semibold text-gray-700 mb-3">
              推送功能说明
            </Text>
            <View className="space-y-2">
              <View className="flex items-start gap-2">
                <Text className="block text-green-500 mt-1">✓</Text>
                <Text className="block text-sm text-gray-600">
                  启用后可在小程序后台或前台收到提醒
                </Text>
              </View>
              <View className="flex items-start gap-2">
                <Text className="block text-green-500 mt-1">✓</Text>
                <Text className="block text-sm text-gray-600">
                  配合系统设置可实现更好的推送效果
                </Text>
              </View>
              <View className="flex items-start gap-2">
                <Text className="block text-amber-500 mt-1">!</Text>
                <Text className="block text-sm text-gray-600">
                  小程序被完全关闭后可能无法收到推送
                </Text>
              </View>
              <View className="flex items-start gap-2">
                <Text className="block text-amber-500 mt-1">!</Text>
                <Text className="block text-sm text-gray-600">
                  建议保持小程序在后台运行
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 配置说明 */}
        <Card className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl shadow-md">
          <CardContent className="p-5">
            <Text className="block text-sm font-semibold text-white mb-3">
              极光配置说明
            </Text>
            <View className="space-y-2">
              <Text className="block text-xs text-slate-300">
                1. 在极光官网注册应用获取 AppKey
              </Text>
              <Text className="block text-xs text-slate-300">
                2. 下载极光小程序 SDK 并引入项目
              </Text>
              <Text className="block text-xs text-slate-300">
                3. 在 .env 文件配置 JPUSH_APPKEY
              </Text>
              <Text className="block text-xs text-slate-300">
                4. 后端配置 JPUSH_MASTER_SECRET
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
