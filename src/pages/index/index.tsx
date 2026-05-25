import { useState } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Taro from '@tarojs/taro'
import { Settings, Plane, Clock, ClipboardList } from 'lucide-react-taro'

export default function Index() {
  const [flightNumber, setFlightNumber] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [boardingTime, setBoardingTime] = useState('')

  // 获取当前时间用于默认值
  const getDefaultDateTime = (addMinutes: number = 60) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() + addMinutes)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const handleStartPlan = () => {
    if (!flightNumber.trim()) {
      Taro.showToast({ title: '请输入航班号', icon: 'none' })
      return
    }
    if (!departureTime) {
      Taro.showToast({ title: '请选择起飞时间', icon: 'none' })
      return
    }
    if (!boardingTime) {
      Taro.showToast({ title: '请选择登机时间', icon: 'none' })
      return
    }

    // 验证时间逻辑
    const departure = new Date(departureTime.replace(' ', 'T'))
    const boarding = new Date(boardingTime.replace(' ', 'T'))

    if (boarding >= departure) {
      Taro.showToast({ title: '登机时间必须早于起飞时间', icon: 'none' })
      return
    }

    const formattedFlight = flightNumber.trim().toUpperCase()
    const planData = {
      flightNumber: formattedFlight,
      departureTime,
      boardingTime
    }

    Taro.navigateTo({
      url: `/pages/timeline/index?data=${encodeURIComponent(JSON.stringify(planData))}`
    })
  }

  const handleGoToManage = () => {
    Taro.navigateTo({ url: '/pages/manage/index' })
  }

  const handleGoToRecords = () => {
    Taro.navigateTo({ url: '/pages/records/index' })
  }

  // 处理时间选择
  const handleDepartureTimeChange = (e: any) => {
    const selected = e.detail.value
    // 格式: YYYY-MM-DDTHH:mm
    const formatted = selected.replace('T', ' ')
    setDepartureTime(formatted)
  }

  const handleBoardingTimeChange = (e: any) => {
    const selected = e.detail.value
    const formatted = selected.replace('T', ' ')
    setBoardingTime(formatted)
  }

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-8">
        <View className="flex items-center justify-center mb-4">
          <Clock size={48} color="#ffffff" />
        </View>
        <Text className="block text-center text-white text-2xl font-bold">
          登机口时间提醒助手
        </Text>
        <Text className="block text-center text-blue-100 text-sm mt-2">
          多时间点提醒，确保每个环节准时完成
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-4 py-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            {/* 航班号 */}
            <Text className="block text-base font-medium text-gray-700 mb-2">
              航班号
            </Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <Input
                className="w-full text-lg text-center font-mono tracking-wider bg-transparent"
                placeholder="例如：CA1234"
                value={flightNumber}
                onInput={(e) => setFlightNumber(e.detail.value.toUpperCase())}
                maxlength={10}
              />
            </View>

            {/* 起飞时间 */}
            <Text className="block text-base font-medium text-gray-700 mb-2">
              计划起飞时间
            </Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <View className="flex items-center">
                <Text className="block text-gray-400 mr-3">选择时间</Text>
                <View className="flex-1">
                  <Picker
                    // @ts-ignore
                    mode="datetime"
                    onChange={handleDepartureTimeChange}
                    value={departureTime ? departureTime.replace(' ', 'T') : ''}
                    start={getDefaultDateTime(-30)}
                    end={getDefaultDateTime(720)}
                  >
                    <View className="py-1">
                      <Text className={departureTime ? 'text-gray-900' : 'text-gray-400'}>
                        {departureTime || '请选择起飞时间'}
                      </Text>
                    </View>
                  </Picker>
                </View>
              </View>
            </View>

            {/* 登机时间 */}
            <Text className="block text-base font-medium text-gray-700 mb-2">
              计划登机时间
            </Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-6">
              <View className="flex items-center">
                <Text className="block text-gray-400 mr-3">选择时间</Text>
                <View className="flex-1">
                  <Picker
                    // @ts-ignore
                    mode="datetime"
                    onChange={handleBoardingTimeChange}
                    value={boardingTime ? boardingTime.replace(' ', 'T') : ''}
                    start={getDefaultDateTime(-30)}
                    end={departureTime ? departureTime.replace(' ', 'T') : getDefaultDateTime(720)}
                  >
                    <View className="py-1">
                      <Text className={boardingTime ? 'text-gray-900' : 'text-gray-400'}>
                        {boardingTime || '请选择登机时间'}
                      </Text>
                    </View>
                  </Picker>
                </View>
              </View>
            </View>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-xl"
              onClick={handleStartPlan}
            >
              <Plane size={24} color="#ffffff" className="mr-2" />
              <Text className="block">开始提醒</Text>
            </Button>
          </CardContent>
        </Card>

        {/* 提醒说明 */}
        <View className="mt-6">
          <Text className="block text-sm font-medium text-gray-700 mb-3">
            提醒时间节点：
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="space-y-3">
              {[
                { time: '登机前15分钟', task: '确认轮椅无陪信息' },
                { time: '起飞前20分钟', task: '确认行李预拉' },
                { time: '起飞前17分钟', task: '舱单确认、货舱通知、交接' },
                { time: '起飞前16分钟', task: '完成行李拉下操作' },
                { time: '起飞前15分钟', task: '舱单和货舱确认' },
                { time: '登机时间', task: '现场准备确认' },
                { time: '登机前15分钟', task: '关键流程复核' }
              ].map((item, index) => (
                <View key={index} className="flex items-start gap-3">
                  <View className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                  <View className="flex-1">
                    <Text className="block text-sm text-gray-600">{item.time}</Text>
                    <Text className="block text-sm text-gray-900">{item.task}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <View className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 text-gray-600 hover:text-gray-900"
            onClick={handleGoToManage}
          >
            <Settings size={18} color="#4b5563" className="mr-2" />
            <Text className="block">内容管理</Text>
          </Button>
          <Button
            variant="ghost"
            className="flex-1 text-gray-600 hover:text-gray-900"
            onClick={handleGoToRecords}
          >
            <ClipboardList size={18} color="#4b5563" className="mr-2" />
            <Text className="block">操作记录</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
