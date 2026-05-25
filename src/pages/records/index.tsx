import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Plane, CircleCheck } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface FlightRecord {
  flightNumber: string
  recordCount: number
  latestTime: string
}

interface OperationRecord {
  id: number
  flightNumber: string
  action: string
  detail: string
  timestamp: string
}

export default function RecordsPage() {
  const [flightList, setFlightList] = useState<FlightRecord[]>([])
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null)
  const [flightRecords, setFlightRecords] = useState<OperationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlightList()
  }, [])

  const fetchFlightList = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/records/flights',
        method: 'GET'
      })
      console.log('获取航班列表:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setFlightList(res.data.data)
      }
    } catch (error) {
      console.error('获取航班列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlightRecords = async (flightNumber: string) => {
    try {
      const res = await Network.request({
        url: `/api/records/flight/${encodeURIComponent(flightNumber)}`,
        method: 'GET'
      })
      console.log('获取航班记录:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setFlightRecords(res.data.data)
      }
    } catch (error) {
      console.error('获取航班记录失败:', error)
    }
  }

  const handleFlightClick = (flightNumber: string) => {
    if (expandedFlight === flightNumber) {
      setExpandedFlight(null)
      setFlightRecords([])
    } else {
      setExpandedFlight(flightNumber)
      fetchFlightRecords(flightNumber)
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  const formatLatestTime = (timeStr: string) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, { label: string; color: string }> = {
      'start': { label: '开始', color: 'text-blue-600' },
      'confirm': { label: '确认', color: 'text-green-600' },
      'complete': { label: '完成', color: 'text-green-600' },
      'reset': { label: '重置', color: 'text-amber-600' }
    }
    return actionMap[action] || { label: action, color: 'text-gray-600' }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-4">
        <View className="flex items-center gap-3">
          <View onClick={handleBack}>
            <ArrowLeft size={24} color="#ffffff" />
          </View>
          <View>
            <Text className="block text-white text-lg font-semibold">操作记录</Text>
            <Text className="block text-blue-100 text-sm">查看历史操作</Text>
          </View>
        </View>
      </View>

      {/* Flight List */}
      <View className="px-4 py-4">
        {loading ? (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-gray-500">加载中...</Text>
          </View>
        ) : flightList.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-12">
            <Plane size={48} color="#d1d5db" />
            <Text className="block text-gray-400 mt-4">暂无操作记录</Text>
            <Text className="block text-gray-300 text-sm mt-2">开始工作流程后将自动记录</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {flightList.map((flight) => (
              <View key={flight.flightNumber}>
                <Card 
                  className={`shadow-sm ${expandedFlight === flight.flightNumber ? 'border-blue-500' : ''}`}
                  onClick={() => handleFlightClick(flight.flightNumber)}
                >
                  <CardContent className="p-4">
                    <View className="flex items-center justify-between">
                      <View className="flex items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Plane size={20} color="#2563eb" />
                        </View>
                        <View>
                          <Text className="block text-lg font-bold text-gray-900 font-mono">
                            {flight.flightNumber}
                          </Text>
                          <View className="flex items-center gap-2 mt-1">
                            <Clock size={12} color="#9ca3af" />
                            <Text className="block text-xs text-gray-500">
                              {formatLatestTime(flight.latestTime)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex items-center gap-3">
                        <Badge className="bg-gray-100 text-gray-600">
                          {flight.recordCount} 次操作
                        </Badge>
                        {expandedFlight === flight.flightNumber ? (
                          <ChevronUp size={20} color="#6b7280" />
                        ) : (
                          <ChevronDown size={20} color="#6b7280" />
                        )}
                      </View>
                    </View>
                  </CardContent>
                </Card>

                {/* Expanded Records */}
                {expandedFlight === flight.flightNumber && (
                  <View className="mt-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    {flightRecords.length === 0 ? (
                      <View className="p-4 text-center">
                        <Text className="block text-gray-400">加载中...</Text>
                      </View>
                    ) : (
                      flightRecords.map((record, index) => {
                        const actionInfo = getActionLabel(record.action)
                        return (
                          <View 
                            key={record.id}
                            className={`p-4 border-b border-gray-50 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          >
                            <View className="flex items-start gap-3">
                              <View className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                                <CircleCheck size={14} color="#22c55e" />
                              </View>
                              <View className="flex-1">
                                <View className="flex items-center gap-2 mb-1">
                                  <Badge className={`${actionInfo.color} bg-opacity-10`}>
                                    {actionInfo.label}
                                  </Badge>
                                </View>
                                <Text className="block text-sm text-gray-700">
                                  {record.detail || record.action}
                                </Text>
                                <Text className="block text-xs text-gray-400 mt-1">
                                  {formatTime(record.timestamp)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )
                      })
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
