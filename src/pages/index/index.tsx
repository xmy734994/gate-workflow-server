import { useState, useEffect } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import Taro from '@tarojs/taro'
import { Settings, Plane, Clock, ClipboardList, ChevronDown, Bell } from 'lucide-react-taro'

// 时间选择器弹窗组件
interface TimePickerProps {
  visible: boolean
  title: string
  value: string
  onClose: () => void
  onConfirm: (value: string) => void
}

function TimePickerDialog({ visible, title, value, onClose, onConfirm }: TimePickerProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedHour, setSelectedHour] = useState('00')
  const [selectedMinute, setSelectedMinute] = useState('00')

  useEffect(() => {
    if (visible) {
      if (value) {
        const [date, time] = value.split(' ')
        const [hour, minute] = time.split(':')
        setSelectedDate(date)
        setSelectedHour(hour || '00')
        setSelectedMinute(minute || '00')
      } else {
        const now = new Date()
        now.setMinutes(now.getMinutes() + 60)
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        setSelectedDate(`${year}-${month}-${day}`)
        setSelectedHour(String(now.getHours()).padStart(2, '0'))
        setSelectedMinute(String(now.getMinutes()).padStart(2, '0'))
      }
    }
  }, [visible, value])

  const handleConfirm = () => {
    const result = `${selectedDate} ${selectedHour}:${selectedMinute}`
    onConfirm(result)
    onClose()
  }

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  // 生成未来7天的日期列表
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
  }

  const dateIndex = dates.indexOf(selectedDate)

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogTitle className="text-lg font-semibold text-gray-900 mb-4">{title}</DialogTitle>
        <View className="space-y-4">
          {/* 日期选择 */}
          <View>
            <Text className="block text-sm text-gray-600 mb-2">选择日期</Text>
            <View className="bg-gray-50 rounded-xl p-2">
              <Picker
                mode="selector"
                range={dates}
                onChange={(e: any) => setSelectedDate(dates[e.detail.value])}
                value={dateIndex >= 0 ? dateIndex : 0}
              >
                <View className="flex items-center justify-between px-3 py-3">
                  <Text className="text-gray-900">{selectedDate}</Text>
                  <ChevronDown size={16} color="#6b7280" />
                </View>
              </Picker>
            </View>
          </View>

          {/* 时间选择 */}
          <View className="flex gap-3">
            {/* 小时 */}
            <View className="flex-1">
              <Text className="block text-sm text-gray-600 mb-2">小时</Text>
              <View className="bg-gray-50 rounded-xl p-2">
                <Picker
                  mode="selector"
                  range={hours}
                  onChange={(e: any) => setSelectedHour(hours[e.detail.value])}
                  value={parseInt(selectedHour)}
                >
                  <View className="flex items-center justify-between px-3 py-3">
                    <Text className="text-gray-900">{selectedHour} 时</Text>
                    <ChevronDown size={16} color="#6b7280" />
                  </View>
                </Picker>
              </View>
            </View>

            {/* 分钟 */}
            <View className="flex-1">
              <Text className="block text-sm text-gray-600 mb-2">分钟</Text>
              <View className="bg-gray-50 rounded-xl p-2">
                <Picker
                  mode="selector"
                  range={minutes}
                  onChange={(e: any) => setSelectedMinute(minutes[e.detail.value])}
                  value={parseInt(selectedMinute)}
                >
                  <View className="flex items-center justify-between px-3 py-3">
                    <Text className="text-gray-900">{selectedMinute} 分</Text>
                    <ChevronDown size={16} color="#6b7280" />
                  </View>
                </Picker>
              </View>
            </View>
          </View>

          {/* 按钮 */}
          <View className="flex gap-3 pt-2">
            <View className="flex-1">
              <Button variant="outline" onClick={onClose}>取消</Button>
            </View>
            <View className="flex-1">
              <Button onClick={handleConfirm}>确认</Button>
            </View>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  )
}

export default function Index() {
  const [flightNumber, setFlightNumber] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [boardingTime, setBoardingTime] = useState('')
  const [showDeparturePicker, setShowDeparturePicker] = useState(false)
  const [showBoardingPicker, setShowBoardingPicker] = useState(false)

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

  const handleGoToSubscribe = () => {
    Taro.navigateTo({ url: '/pages/subscribe/index' })
  }

  const handleGoToRecords = () => {
    Taro.navigateTo({ url: '/pages/records/index' })
  }

  const handleDepartureConfirm = (value: string) => {
    setDepartureTime(value)
  }

  const handleBoardingConfirm = (value: string) => {
    setBoardingTime(value)
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
            <View 
              className="bg-gray-50 rounded-xl px-4 py-4 mb-4"
              onClick={() => setShowDeparturePicker(true)}
            >
              <View className="flex items-center justify-between">
                <Text className={departureTime ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
                  {departureTime || '请选择起飞时间'}
                </Text>
                <ChevronDown size={20} color="#9ca3af" />
              </View>
            </View>

            {/* 登机时间 */}
            <Text className="block text-base font-medium text-gray-700 mb-2">
              计划登机时间
            </Text>
            <View 
              className="bg-gray-50 rounded-xl px-4 py-4 mb-6"
              onClick={() => setShowBoardingPicker(true)}
            >
              <View className="flex items-center justify-between">
                <Text className={boardingTime ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
                  {boardingTime || '请选择登机时间'}
                </Text>
                <ChevronDown size={20} color="#9ca3af" />
              </View>
            </View>

            {/* 开始按钮 */}
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4"
              onClick={handleStartPlan}
            >
              <Plane size={20} color="#ffffff" className="mr-2" />
              <Text>开始提醒</Text>
            </Button>
          </CardContent>
        </Card>

        {/* 提醒说明 */}
        <Card className="mt-4 shadow-sm">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-gray-700 mb-3">
              提醒时间节点
            </Text>
            <View className="space-y-2">
              <View className="flex items-start">
                <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0" />
                <Text className="block text-sm text-gray-600">登机前15分钟：轮椅无陪信息确认</Text>
              </View>
              <View className="flex items-start">
                <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0" />
                <Text className="block text-sm text-gray-600">起飞前20分钟：行李预拉确认</Text>
              </View>
              <View className="flex items-start">
                <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0" />
                <Text className="block text-sm text-gray-600">起飞前17分钟：行李、舱单、货舱、交接确认</Text>
              </View>
              <View className="flex items-start">
                <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0" />
                <Text className="block text-sm text-gray-600">起飞前16分钟：行李拉下操作</Text>
              </View>
              <View className="flex items-start">
                <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0" />
                <Text className="block text-sm text-gray-600">起飞前15分钟：舱单和货舱确认</Text>
              </View>
              <View className="flex items-start">
                <View className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-2 flex-shrink-0" />
                <Text className="block text-sm text-gray-600">登机时间：现场准备确认</Text>
              </View>
              <View className="flex items-start">
                <View className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-2 flex-shrink-0" />
                <Text className="block text-sm text-gray-600">登机前15分钟：关键流程复核</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部导航 */}
      <View className="bg-white border-t border-gray-200 px-4 py-3 flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleGoToRecords}
        >
          <ClipboardList size={18} color="#1890ff" className="mr-2" />
          <Text>操作记录</Text>
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleGoToManage}
        >
          <Settings size={18} color="#1890ff" className="mr-2" />
          <Text>内容管理</Text>
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleGoToSubscribe}
        >
          <Bell size={18} color="#1890ff" className="mr-2" />
          <Text>通知订阅</Text>
        </Button>
      </View>

      {/* 时间选择弹窗 */}
      <TimePickerDialog
        visible={showDeparturePicker}
        title="选择起飞时间"
        value={departureTime}
        onClose={() => setShowDeparturePicker(false)}
        onConfirm={handleDepartureConfirm}
      />
      
      <TimePickerDialog
        visible={showBoardingPicker}
        title="选择登机时间"
        value={boardingTime}
        onClose={() => setShowBoardingPicker(false)}
        onConfirm={handleBoardingConfirm}
      />
    </View>
  )
}
