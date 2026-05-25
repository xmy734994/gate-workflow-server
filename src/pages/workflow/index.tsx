import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface WorkflowItem {
  id: number
  content: string
  order: number
}

export default function WorkflowPage() {
  const [flightNumber, setFlightNumber] = useState('')
  const [items, setItems] = useState<WorkflowItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedItems, setCompletedItems] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.flightNumber) {
      setFlightNumber(decodeURIComponent(params.flightNumber))
    }
    fetchWorkflowItems()
  }, [])

  const fetchWorkflowItems = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/workflow/items',
        method: 'GET'
      })
      console.log('获取工作流程数据:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const sortedItems = res.data.data.sort((a: WorkflowItem, b: WorkflowItem) => a.order - b.order)
        setItems(sortedItems)
      }
    } catch (error) {
      console.error('获取工作流程失败:', error)
      // 使用默认数据
      setItems(getDefaultItems())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultItems = (): WorkflowItem[] => [
    { id: 1, content: '航前会开好了吗？', order: 1 },
    { id: 2, content: '登机设备带好了吗？', order: 2 },
    { id: 3, content: '登机口设备和系统都打开了吗？', order: 3 },
    { id: 4, content: '门禁打开了吗？栏杆摆放好了吗？', order: 4 },
    { id: 5, content: '确认轮椅无陪的信息', order: 5 },
    { id: 6, content: '确认有没有特殊行李机长通知单', order: 6 },
    { id: 7, content: '有没有登机口变更？贴告示了没有？', order: 7 },
    { id: 8, content: '航班开始登机注意站位', order: 8 },
    { id: 9, content: '八个一做了吗？', order: 9 },
    { id: 10, content: '三复核做了吗？', order: 10 },
    { id: 11, content: '登机系统按照流程操作了吗？', order: 11 },
    { id: 12, content: '行李提前20分钟预拉', order: 12 },
    { id: 13, content: '行李确认拉下要在登机系统里点击拉下', order: 13 },
    { id: 14, content: '舱单确认了吗？', order: 14 },
    { id: 15, content: '货舱通知关了吗？', order: 15 },
    { id: 16, content: '特殊情况和机长交接了吗？', order: 16 }
  ]

  const handleConfirm = () => {
    if (currentIndex < items.length) {
      const currentItem = items[currentIndex]
      setCompletedItems([...completedItems, currentItem.id])
      
      if (currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // All items completed
        Taro.showToast({
          title: '所有流程已完成！',
          icon: 'success',
          duration: 3000
        })
      }
    }
  }

  const handleReset = () => {
    Taro.showModal({
      title: '确认重置',
      content: '确定要重新开始工作流程吗？',
      success: (res) => {
        if (res.confirm) {
          setCurrentIndex(0)
          setCompletedItems([])
          setShowCompleted(false)
        }
      }
    })
  }

  const progressPercent = items.length > 0 
    ? Math.round((completedItems.length / items.length) * 100) 
    : 0

  const currentItem = items[currentIndex]

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-4">
        <View className="flex justify-between items-center">
          <View>
            <Text className="block text-white text-lg font-semibold">当前航班</Text>
            <Text className="block text-blue-100 text-sm">登机口工作流程</Text>
          </View>
          <Badge className="bg-white text-blue-600 px-3 py-1 text-lg font-mono">
            {flightNumber}
          </Badge>
        </View>
      </View>

      {/* Progress */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <View className="flex justify-between items-center mb-2">
          <Text className="block text-sm font-medium text-gray-700">
            完成进度
          </Text>
          <Text className="block text-sm text-blue-600 font-semibold">
            {completedItems.length} / {items.length}
          </Text>
        </View>
        <Progress value={progressPercent} className="h-2" />
      </View>

      {/* Current Item */}
      <View className="px-4 py-6">
        {currentIndex < items.length ? (
          <Card className="shadow-lg border-2 border-blue-500">
            <CardContent className="p-6">
              <View className="flex items-start gap-3 mb-4">
                <View className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Text className="block text-white font-bold">{currentIndex + 1}</Text>
                </View>
                <Text className="block text-xl font-semibold text-gray-900 leading-relaxed">
                  {currentItem?.content}
                </Text>
              </View>
              
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold rounded-xl mt-4"
                onClick={handleConfirm}
              >
                <Check size={24} color="#ffffff" className="mr-2" />
                <Text className="block">确认完成</Text>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-2 border-green-500">
            <CardContent className="p-6 text-center">
              <View className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check size={32} color="#22c55e" />
              </View>
              <Text className="block text-xl font-bold text-green-600 mb-2">
                全部完成！
              </Text>
              <Text className="block text-gray-500 mb-4">
                航班 {flightNumber} 的所有工作流程已完成
              </Text>
              <Button
                variant="outline"
                className="border-blue-600 text-blue-600"
                onClick={handleReset}
              >
                重新开始
              </Button>
            </CardContent>
          </Card>
        )}
      </View>

      {/* Completed List */}
      <View className="px-4">
        <View 
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          onClick={() => setShowCompleted(!showCompleted)}
        >
          <View className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
            <Text className="block text-sm font-medium text-gray-700">
              已完成项目 ({completedItems.length})
            </Text>
            <Text className="block text-blue-600 text-sm">
              {showCompleted ? '收起' : '展开'}
            </Text>
          </View>
          
          {showCompleted && (
            <View className="p-4">
              {completedItems.length === 0 ? (
                <Text className="block text-gray-400 text-sm text-center py-4">
                  暂无已完成项目
                </Text>
              ) : (
                completedItems.map((itemId, idx) => {
                  const item = items.find(i => i.id === itemId)
                  return (
                    <View key={itemId} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <View className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check size={14} color="#22c55e" />
                      </View>
                      <View className="flex-1">
                        <Text className="block text-sm text-gray-700">{item?.content}</Text>
                      </View>
                      <Text className="block text-xs text-gray-400">#{idx + 1}</Text>
                    </View>
                  )
                })
              )}
            </View>
          )}
        </View>
      </View>

      {/* Reset Button */}
      {completedItems.length > 0 && (
        <View className="fixed bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className="w-full border-gray-300 text-gray-600"
            onClick={handleReset}
          >
            重置流程
          </Button>
        </View>
      )}
    </View>
  )
}
