import { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { 
  ChevronDown, 
  ChevronUp, 
  Clock,
  CircleCheck,
  ClipboardList,
  Plane
} from 'lucide-react-taro'

interface RecordItem {
  id: number
  flightNumber: string
  action: string
  detail: string
  planTime: string
  createdAt: string
}

interface FlightGroup {
  flightNumber: string
  records: RecordItem[]
  count: number
  latestTime: string
}

export default function Records() {
  const [flightGroups, setFlightGroups] = useState<FlightGroup[]>([])
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取所有航班列表
  const fetchFlights = useCallback(async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/records/flights'
      })
      
      if (res.statusCode === 200 && res.data?.data) {
        setFlightGroups(res.data.data)
      }
    } catch (error) {
      console.error('获取航班列表失败', error)
      Taro.showToast({ title: '获取数据失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取航班详情
  const fetchFlightDetail = useCallback(async (flightNumber: string) => {
    try {
      const res = await Network.request({
        url: `/api/records/flight/${flightNumber}`
      })
      
      if (res.statusCode === 200 && res.data?.data) {
        const records: RecordItem[] = res.data.data
        
        // 更新展开的航班记录
        setFlightGroups(prev => prev.map(group => {
          if (group.flightNumber === flightNumber) {
            return { ...group, records }
          }
          return group
        }))
      }
    } catch (error) {
      console.error('获取航班详情失败', error)
    }
  }, [])

  useEffect(() => {
    fetchFlights()
  }, [fetchFlights])

  // 展开/收起航班
  const toggleExpand = (flightNumber: string) => {
    if (expandedFlight === flightNumber) {
      setExpandedFlight(null)
    } else {
      setExpandedFlight(flightNumber)
      fetchFlightDetail(flightNumber)
    }
  }

  // 获取操作类型标签
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'start': return { text: '开始', color: 'bg-blue-100 text-blue-700' }
      case 'confirm': return { text: '确认', color: 'bg-green-100 text-green-700' }
      case 'complete': return { text: '完成', color: 'bg-purple-100 text-purple-700' }
      case 'reset': return { text: '重置', color: 'bg-orange-100 text-orange-700' }
      default: return { text: action, color: 'bg-gray-100 text-gray-700' }
    }
  }

  // 格式化时间
  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-6">
        <View className="flex items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <ClipboardList size={24} color="#ffffff" />
          </View>
          <View>
            <Text className="block text-white text-xl font-bold">
              操作记录
            </Text>
            <Text className="block text-blue-100 text-sm">
              查看历史操作记录
            </Text>
          </View>
        </View>
      </View>

      {/* 列表 */}
      <View className="flex-1 px-4 py-4 overflow-auto pb-24">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-gray-500">加载中...</Text>
          </View>
        ) : flightGroups.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Plane size={48} color="#d1d5db" />
            <Text className="block text-gray-400 mt-4">暂无操作记录</Text>
            <Text className="block text-gray-300 text-sm mt-1">
              开始工作后将自动记录
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {flightGroups.map((group) => {
              const isExpanded = expandedFlight === group.flightNumber
              const records = group.records || []

              return (
                <Card key={group.flightNumber}>
                  <CardContent className="p-0">
                    {/* 航班头部 */}
                    <View 
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleExpand(group.flightNumber)}
                    >
                      <View className="flex items-center gap-3">
                        <View className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Plane size={24} color="#2563eb" />
                        </View>
                        <View>
                          <Text className="block text-lg font-bold text-gray-900">
                            {group.flightNumber}
                          </Text>
                          <Text className="block text-sm text-gray-500">
                            {records.length || group.count} 次操作 · {group.latestTime}
                          </Text>
                        </View>
                      </View>
                      <View className="p-2">
                        {isExpanded ? (
                          <ChevronUp size={20} color="#6b7280" />
                        ) : (
                          <ChevronDown size={20} color="#6b7280" />
                        )}
                      </View>
                    </View>

                    {/* 展开的详情 */}
                    {isExpanded && (
                      <View className="border-t border-gray-100">
                        {records.length === 0 ? (
                          <View className="p-4 text-center">
                            <Text className="block text-gray-400">加载中...</Text>
                          </View>
                        ) : (
                          records.map((record, index) => {
                            const actionInfo = getActionLabel(record.action)
                            return (
                              <View 
                                key={record.id}
                                className={`p-4 border-b border-gray-50 last:border-b-0 ${
                                  index === records.length - 1 ? '' : ''
                                }`}
                              >
                                <View className="flex items-start gap-3">
                                  <View className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    {record.action === 'confirm' ? (
                                      <CircleCheck size={16} color="#22c55e" />
                                    ) : (
                                      <Clock size={16} color="#6b7280" />
                                    )}
                                  </View>
                                  <View className="flex-1">
                                    <View className="flex items-center gap-2 mb-1">
                                      <View className={`px-2 py-1 rounded text-xs ${actionInfo.color}`}>
                                        <Text className="block text-xs font-medium">
                                          {actionInfo.text}
                                        </Text>
                                      </View>
                                      <Text className="block text-xs text-gray-400">
                                        {formatDateTime(record.createdAt)}
                                      </Text>
                                    </View>
                                    <Text className="block text-sm text-gray-700">
                                      {record.detail}
                                    </Text>
                                    {record.planTime && (
                                      <Text className="block text-xs text-gray-400 mt-1">
                                        计划时间: {formatDateTime(record.planTime)}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              </View>
                            )
                          })
                        )}
                      </View>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}
