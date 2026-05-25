import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Taro from '@tarojs/taro'
import { Settings, Plane } from 'lucide-react-taro'

export default function Index() {
  const [flightNumber, setFlightNumber] = useState('')

  const handleStartWorkflow = () => {
    if (!flightNumber.trim()) {
      Taro.showToast({ title: '请输入航班号', icon: 'none' })
      return
    }
    const formattedFlight = flightNumber.trim().toUpperCase()
    Taro.navigateTo({
      url: `/pages/workflow/index?flightNumber=${encodeURIComponent(formattedFlight)}`
    })
  }

  const handleGoToManage = () => {
    Taro.navigateTo({ url: '/pages/manage/index' })
  }

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-8">
        <View className="flex items-center justify-center mb-4">
          <Plane size={48} color="#ffffff" />
        </View>
        <Text className="block text-center text-white text-2xl font-bold">
          登机口工作流程助手
        </Text>
        <Text className="block text-center text-blue-100 text-sm mt-2">
          助您高效完成每个登机环节
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-4 py-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Text className="block text-lg font-semibold text-gray-900 mb-2">
              请输入航班号
            </Text>
            <Text className="block text-sm text-gray-500 mb-4">
              例如：CA1234、MU5678
            </Text>
            
            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-6">
              <Input
                className="w-full text-lg text-center font-mono tracking-wider bg-transparent"
                placeholder="输入航班号"
                value={flightNumber}
                onInput={(e) => setFlightNumber(e.detail.value.toUpperCase())}
                maxlength={10}
              />
            </View>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-xl"
              onClick={handleStartWorkflow}
            >
              开始工作流程
            </Button>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <View className="mt-6">
          <Text className="block text-sm font-medium text-gray-700 mb-3">
            工作流程包含以下环节：
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="grid grid-cols-2 gap-2">
              {[
                '航前会确认',
                '设备准备',
                '登机口检查',
                '特殊旅客',
                '登机提醒',
                '复核操作',
                '行李管理',
                '航班交接'
              ].map((tip, index) => (
                <View key={index} className="flex items-center gap-2 py-1">
                  <View className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                  <Text className="block text-sm text-gray-600 truncate">{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <Button
          variant="ghost"
          className="w-full text-gray-600 hover:text-gray-900"
          onClick={handleGoToManage}
        >
          <Settings size={18} color="#4b5563" className="mr-2" />
          <Text className="block">内容管理</Text>
        </Button>
      </View>
    </View>
  )
}
