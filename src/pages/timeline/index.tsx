import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { 
  CircleCheck, 
  Circle, 
  Plane, 
  ArrowLeft,
  Bell,
  Luggage,
  ClipboardCheck,
  Settings,
  Users,
  FileText
} from 'lucide-react-taro'

interface TimelineItem {
  id: number
  title: string
  description: string
  time: Date
  timeLabel: string
  type: string
  icon: string
  confirmed: boolean
  confirmedAt?: Date
}

interface FlightPlan {
  flightNumber: string
  departureTime: string
  boardingTime: string
}

export default function Timeline() {
  const [flightPlan, setFlightPlan] = useState<FlightPlan | null>(null)
  const [departureDate, setDepartureDate] = useState<Date | null>(null)
  const [boardingDate, setBoardingDate] = useState<Date | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [alertItem, setAlertItem] = useState<TimelineItem | null>(null)
  const notifiedItems = useRef<Set<number>>(new Set())
  const isMiniApp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP || Taro.getEnv() === Taro.ENV_TYPE.TT

  // 初始化数据
  useEffect(() => {
    // @ts-ignore - 微信小程序特有 API
    const eventChannel = Taro.getOpenerEventChannel?.()
    if (eventChannel && (eventChannel as any).onData) {
      (eventChannel as any).onData((data: FlightPlan) => {
        if (data) {
          setFlightPlan(data)
          const depDate = new Date(data.departureTime.replace(' ', 'T'))
          const boardDate = new Date(data.boardingTime.replace(' ', 'T'))
          setDepartureDate(depDate)
          setBoardingDate(boardDate)
        }
      })
    }

    // 从 URL 参数获取数据
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any)?.options || {}
    
    if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data)) as FlightPlan
        setFlightPlan(data)
        const depDate = new Date(data.departureTime.replace(' ', 'T'))
        const boardDate = new Date(data.boardingTime.replace(' ', 'T'))
        setDepartureDate(depDate)
        setBoardingDate(boardDate)
      } catch (e) {
        console.error('解析航班数据失败', e)
      }
    }
  }, [])

  // 生成时间线数据
  useEffect(() => {
    if (departureDate && boardingDate) {
      const items = generateTimeline(boardingDate, departureDate)
      setTimeline(items)
    }
  }, [departureDate, boardingDate])

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 检查并触发提醒
  const checkReminders = useCallback(async () => {
    if (timeline.length === 0) return

    for (const item of timeline) {
      if (item.confirmed || notifiedItems.current.has(item.id)) continue

      const diff = item.time.getTime() - currentTime.getTime()
      const threeMinutes = 3 * 60 * 1000

      // 提醒时机：时间到达前3分钟到时间点后1分钟
      if (diff <= threeMinutes && diff >= -1 * 60 * 1000) {
        notifiedItems.current.add(item.id)
        setAlertItem(item)
        setShowAlert(true)

        // 触发订阅消息（仅小程序端）
        if (isMiniApp && flightPlan) {
          try {
            // 获取用户订阅状态
            const subscriptions = Taro.getStorageSync('user_subscriptions') || {}
            if (subscriptions[item.type]) {
              // 调用订阅消息 API
              await triggerSubscribeMessage(item, flightPlan)
            }
          } catch (err) {
            console.error('触发订阅消息失败', err)
          }
        }

        // 播放提示音（小程序端）
        if (isMiniApp) {
          try {
            const innerAudioContext = Taro.createInnerAudioContext()
            innerAudioContext.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
            innerAudioContext.play()
          } catch (err) {
            console.error('播放提示音失败', err)
          }
        }

        break // 一次只弹一个提醒
      }
    }
  }, [timeline, currentTime, flightPlan, isMiniApp])

  // 触发订阅消息
  const triggerSubscribeMessage = async (item: TimelineItem, plan: FlightPlan) => {
    try {
      // 微信订阅消息模板
      if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
        ;(Taro as any).requestSubscribeMessage({
          tmplIds: ['BOARDING_REMINDER'], // 需要在微信后台配置模板
          success: (res: any) => {
            if (res['BOARDING_REMINDER'] === 'accept') {
              // 可以发送订阅消息给用户
              console.log('用户同意了订阅')
            }
          }
        })
      }
      
      // 同时记录到后端，用于后台发送消息
      await Network.request({
        url: '/api/records',
        method: 'POST',
        data: {
          flightNumber: plan.flightNumber,
          action: 'reminder_sent',
          detail: `发送提醒: ${item.title}`,
          planTime: item.time.toISOString()
        }
      })
    } catch (err) {
      console.error('订阅消息API调用失败', err)
    }
  }

  // 每秒检查提醒
  useEffect(() => {
    checkReminders()
  }, [checkReminders])

  // 生成时间线
  const generateTimeline = (boarding: Date, departure: Date): TimelineItem[] => {
    const items: TimelineItem[] = []

    // 1. 登机前15分钟 - 轮椅无陪
    const wheelchairTime = new Date(boarding.getTime() - 15 * 60 * 1000)
    items.push({
      id: 1,
      title: '轮椅无陪信息确认',
      description: '请确认是否有需要轮椅服务的无陪旅客',
      time: wheelchairTime,
      timeLabel: `登机前15分钟 (${formatTime(wheelchairTime)})`,
      type: 'wheelchair',
      icon: 'Users',
      confirmed: false
    })

    // 2. 起飞前20分钟 - 行李预拉
    const luggagePreTime = new Date(departure.getTime() - 20 * 60 * 1000)
    items.push({
      id: 2,
      title: '行李预拉确认',
      description: '确认行李预拉准备工作已完成',
      time: luggagePreTime,
      timeLabel: `起飞前20分钟 (${formatTime(luggagePreTime)})`,
      type: 'luggage',
      icon: 'Luggage',
      confirmed: false
    })

    // 3. 起飞前17分钟 - 综合确认
    const comprehensiveTime = new Date(departure.getTime() - 17 * 60 * 1000)
    items.push({
      id: 3,
      title: '综合确认',
      description: '行李预拉确认、舱单确认、货舱通知关闭、特殊情况与机长交接',
      time: comprehensiveTime,
      timeLabel: `起飞前17分钟 (${formatTime(comprehensiveTime)})`,
      type: 'comprehensive',
      icon: 'ClipboardCheck',
      confirmed: false
    })

    // 4. 起飞前16分钟 - 行李拉下
    const luggageDropTime = new Date(departure.getTime() - 16 * 60 * 1000)
    items.push({
      id: 4,
      title: '行李拉下操作',
      description: '完成行李拉下操作，并在系统中确认',
      time: luggageDropTime,
      timeLabel: `起飞前16分钟 (${formatTime(luggageDropTime)})`,
      type: 'luggage-drop',
      icon: 'Luggage',
      confirmed: false
    })

    // 5. 起飞前15分钟 - 舱单和货舱确认
    const cargoConfirmTime = new Date(departure.getTime() - 15 * 60 * 1000)
    items.push({
      id: 5,
      title: '舱单和货舱确认',
      description: '确认舱单和货舱通知已关闭',
      time: cargoConfirmTime,
      timeLabel: `起飞前15分钟 (${formatTime(cargoConfirmTime)})`,
      type: 'cargo',
      icon: 'FileText',
      confirmed: false
    })

    // 6. 登机时间 - 现场准备
    items.push({
      id: 6,
      title: '现场准备确认',
      description: '确认登机口设备、系统、门禁及栏杆等现场准备；特殊行李预告单和登机口变更告示情况',
      time: boarding,
      timeLabel: `登机时间 (${formatTime(boarding)})`,
      type: 'site-prep',
      icon: 'Settings',
      confirmed: false
    })

    // 7. 登机前15分钟 - 关键流程
    const keyProcessTime = new Date(boarding.getTime() - 15 * 60 * 1000)
    items.push({
      id: 7,
      title: '关键流程复核',
      description: '"八个一做了吗？"、"三复核做了吗？"、"一刻登机系统流程操作了吗？"',
      time: keyProcessTime,
      timeLabel: `登机前15分钟 (${formatTime(keyProcessTime)})`,
      type: 'key-process',
      icon: 'ClipboardCheck',
      confirmed: false
    })

    // 按时间排序
    items.sort((a, b) => a.time.getTime() - b.time.getTime())
    return items
  }

  // 格式化时间
  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 获取状态
  const getStatus = useCallback((item: TimelineItem) => {
    if (item.confirmed) return 'completed'
    const diff = item.time.getTime() - currentTime.getTime()
    if (diff < -5 * 60 * 1000) return 'overdue'  // 超过5分钟未确认
    if (diff < 0) return 'due'  // 即将到期（5分钟内）
    return 'pending'  // 未到时间
  }, [currentTime])

  // 获取图标
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users size={20} color="#4b5563" />
      case 'Luggage': return <Luggage size={20} color="#4b5563" />
      case 'ClipboardCheck': return <ClipboardCheck size={20} color="#4b5563" />
      case 'Settings': return <Settings size={20} color="#4b5563" />
      case 'FileText': return <FileText size={20} color="#4b5563" />
      default: return <Circle size={20} color="#4b5563" />
    }
  }

  // 确认操作
  const handleConfirm = async (item: TimelineItem) => {
    if (loading) return
    setLoading(true)
    
    try {
      // 记录操作
      await Network.request({
        url: '/api/records',
        method: 'POST',
        data: {
          flightNumber: flightPlan?.flightNumber,
          action: 'confirm',
          detail: `确认: ${item.title}`,
          planTime: item.time.toISOString()
        }
      })

      // 更新本地状态
      setTimeline(prev => prev.map(i => 
        i.id === item.id ? { ...i, confirmed: true, confirmedAt: new Date() } : i
      ))

      // 展开详情
      setExpandedId(item.id)

      Taro.showToast({ title: '已确认', icon: 'success' })
    } catch (error) {
      console.error('确认失败', error)
      Taro.showToast({ title: '确认失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 完成所有
  const handleComplete = async () => {
    if (loading) return
    setLoading(true)

    try {
      // 记录完成
      await Network.request({
        url: '/api/records',
        method: 'POST',
        data: {
          flightNumber: flightPlan?.flightNumber,
          action: 'complete',
          detail: '所有流程已完成',
          planTime: new Date().toISOString()
        }
      })

      Taro.showToast({ title: '流程已完成', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('完成失败', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 返回
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 计算进度
  const completedCount = timeline.filter(item => item.confirmed).length
  const progress = timeline.length > 0 ? (completedCount / timeline.length) * 100 : 0

  // 下一项待确认
  const nextItem = timeline.find(item => !item.confirmed)

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-4">
        <View className="flex items-center gap-3 mb-3">
          <View onClick={handleBack} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white text-lg font-semibold">
              时间线提醒
            </Text>
            {flightPlan && (
              <Text className="block text-blue-100 text-sm">
                {flightPlan.flightNumber}
              </Text>
            )}
          </View>
        </View>

        {/* 进度条 */}
        <View className="mt-3">
          <View className="flex justify-between text-xs text-blue-100 mb-1">
            <Text className="block">已完成 {completedCount}/{timeline.length}</Text>
            <Text className="block">{Math.round(progress)}%</Text>
          </View>
          <Progress value={progress} className="h-2 bg-blue-400" />
        </View>
      </View>

      {/* 航班信息 */}
      {flightPlan && (
        <View className="px-4 py-3 bg-white border-b border-gray-100">
          <View className="flex justify-around text-center">
            <View>
              <Text className="block text-xs text-gray-500">登机时间</Text>
              <Text className="block text-base font-semibold text-gray-900">
                {formatTime(boardingDate!)}
              </Text>
            </View>
            <View className="flex items-center">
              <Plane size={20} color="#2563eb" />
            </View>
            <View>
              <Text className="block text-xs text-gray-500">起飞时间</Text>
              <Text className="block text-base font-semibold text-gray-900">
                {formatTime(departureDate!)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 时间线列表 */}
      <View className="flex-1 px-4 py-4 overflow-auto pb-24">
        {/* 下一项提醒 */}
        {nextItem && (
          <View className="mb-4">
            <View className="flex items-center gap-2 mb-2">
              <Bell size={16} color="#f59e0b" />
              <Text className="block text-sm font-medium text-amber-600">
                下一项提醒
              </Text>
            </View>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <View className="flex items-start gap-3">
                  <View className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    {getIcon(nextItem.icon)}
                  </View>
                  <View className="flex-1">
                    <Text className="block text-base font-semibold text-gray-900">
                      {nextItem.title}
                    </Text>
                    <Text className="block text-sm text-gray-500 mt-1">
                      {nextItem.timeLabel}
                    </Text>
                    <Text className="block text-sm text-gray-600 mt-2">
                      {nextItem.description}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* 完整时间线 */}
        <View className="space-y-3">
          {timeline.map((item, index) => {
            const status = getStatus(item)
            const isExpanded = expandedId === item.id

            return (
              <View key={item.id}>
                {/* 时间线节点 */}
                <View 
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  {/* 连接线 */}
                  <View className="flex flex-col items-center">
                    <View 
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.confirmed ? 'bg-green-500' : 
                        status === 'overdue' ? 'bg-red-500' :
                        status === 'due' ? 'bg-amber-500' : 'bg-gray-200'
                      }`}
                    >
                      {item.confirmed ? (
                        <CircleCheck size={20} color="#ffffff" />
                      ) : (
                        getIcon(item.icon)
                      )}
                    </View>
                    {index < timeline.length - 1 && (
                      <View className={`w-1 h-8 ${
                        item.confirmed ? 'bg-green-300' : 'bg-gray-200'
                      }`}
                      />
                    )}
                  </View>

                  {/* 内容 */}
                  <View className="flex-1 pb-4">
                    <View className="flex items-center gap-2">
                      <Text className={`block text-base font-medium ${
                        item.confirmed ? 'text-green-600' : 'text-gray-900'
                      }`}
                      >
                      {item.title}
                    </Text>
                      {status === 'overdue' && !item.confirmed && (
                        <View className="px-2 py-1 bg-red-100 rounded">
                          <Text className="block text-xs text-red-600">已超时</Text>
                        </View>
                      )}
                      {status === 'due' && !item.confirmed && (
                        <View className="px-2 py-1 bg-amber-100 rounded">
                          <Text className="block text-xs text-amber-600">即将到期</Text>
                        </View>
                      )}
                    </View>
                    <Text className="block text-sm text-gray-500 mt-1">
                      {item.timeLabel}
                    </Text>
                  </View>

                  {/* 展开/收起指示 */}
                  {!item.confirmed && (
                    <View className="p-2">
                      <Text className={`block text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      >
                      ▼
                    </Text>
                    </View>
                  )}
                </View>

                {/* 展开的详情 */}
                {isExpanded && !item.confirmed && (
                  <View className="ml-11 mb-4 bg-white rounded-xl p-4 shadow-sm">
                    <Text className="block text-sm text-gray-600 mb-4">
                      {item.description}
                    </Text>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConfirm(item)
                      }}
                      disabled={loading}
                    >
                      <CircleCheck size={18} color="#ffffff" className="mr-2" />
                      <Text className="block">确认完成</Text>
                    </Button>
                  </View>
                )}

                {/* 已确认时间 */}
                {item.confirmed && item.confirmedAt && (
                  <View className="ml-11 mb-2">
                    <Text className="block text-xs text-green-600">
                      已确认 {item.confirmedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* 全部完成提示 */}
        {completedCount === timeline.length && timeline.length > 0 && (
          <View className="mt-6 text-center">
            <View className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CircleCheck size={40} color="#22c55e" />
            </View>
            <Text className="block text-lg font-semibold text-gray-900">
              所有流程已完成
            </Text>
            <Text className="block text-sm text-gray-500 mt-2">
              感谢您的认真工作！
            </Text>
          </View>
        )}
      </View>

      {/* 底部按钮 */}
      <View className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-gray-200">
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={handleComplete}
          disabled={loading || completedCount < timeline.length}
        >
          <CircleCheck size={20} color="#ffffff" className="mr-2" />
          <Text className="block">完成所有流程</Text>
        </Button>
      </View>

      {/* 提醒弹窗 */}
      <Dialog open={showAlert} onOpenChange={setShowAlert}>
        <DialogContent className="bg-white">
          <View className="text-center py-4">
            <View className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Bell size={32} color="#f59e0b" />
            </View>
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">
              <Text className="block">提醒：该确认了</Text>
            </DialogTitle>
            {alertItem && (
              <DialogDescription className="text-center">
                <Text className="block text-base font-medium text-gray-800 mb-1">
                  {alertItem.title}
                </Text>
                <Text className="block text-sm text-gray-500 mb-1">
                  {alertItem.timeLabel}
                </Text>
                <Text className="block text-xs text-gray-400 mt-2">
                  {alertItem.description}
                </Text>
              </DialogDescription>
            )}
          </View>
          <View className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowAlert(false)}
            >
              <Text>稍后</Text>
            </Button>
            <Button 
              className="flex-1 bg-blue-600"
              onClick={() => {
                setShowAlert(false)
                if (alertItem) {
                  handleConfirm(alertItem)
                }
              }}
            >
              <CircleCheck size={18} color="#ffffff" className="mr-2" />
              <Text>立即确认</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}
