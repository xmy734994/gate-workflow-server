import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2, Save, ArrowLeft } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface WorkflowItem {
  id: number
  content: string
  order: number
}

export default function ManagePage() {
  const [items, setItems] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<WorkflowItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/workflow/items',
        method: 'GET'
      })
      console.log('获取工作流程配置:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const sortedItems = res.data.data.sort((a: WorkflowItem, b: WorkflowItem) => a.order - b.order)
        setItems(sortedItems)
      }
    } catch (error) {
      console.error('获取配置失败:', error)
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

  const handleEdit = (item: WorkflowItem) => {
    setEditingItem(item)
    setEditContent(item.content)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setEditContent('')
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editContent.trim()) {
      Taro.showToast({ title: '内容不能为空', icon: 'none' })
      return
    }

    try {
      setIsSaving(true)
      
      if (editingItem) {
        await Network.request({
          url: `/api/workflow/items/${editingItem.id}`,
          method: 'PUT',
          data: { content: editContent.trim() }
        })
        setItems(items.map(item => 
          item.id === editingItem.id 
            ? { ...item, content: editContent.trim() }
            : item
        ))
        toast('修改成功', { type: 'success' })
      } else {
        const newItem = {
          content: editContent.trim(),
          order: items.length + 1
        }
        const res = await Network.request({
          url: '/api/workflow/items',
          method: 'POST',
          data: newItem
        })
        if (res.data?.data) {
          setItems([...items, res.data.data])
          toast('添加成功', { type: 'success' })
        }
      }
      
      setHasChanges(true)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('保存失败:', error)
      if (editingItem) {
        setItems(items.map(item => 
          item.id === editingItem.id 
            ? { ...item, content: editContent.trim() }
            : item
        ))
      } else {
        const newId = Math.max(...items.map(i => i.id), 0) + 1
        setItems([...items, { id: newId, content: editContent.trim(), order: items.length + 1 }])
      }
      toast('保存成功（本地）', { type: 'success' })
      setIsDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: WorkflowItem) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除 "${item.content}" 吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/workflow/items/${item.id}`,
              method: 'DELETE'
            })
            setItems(items.filter(i => i.id !== item.id))
            toast('删除成功', { type: 'success' })
          } catch (error) {
            console.error('删除失败:', error)
            setItems(items.filter(i => i.id !== item.id))
            toast('删除成功（本地）', { type: 'success' })
          }
        }
      }
    })
  }

  const handleSaveAll = async () => {
    try {
      setIsSaving(true)
      await Network.request({
        url: '/api/workflow/items/batch',
        method: 'PUT',
        data: { items }
      })
      toast('保存成功', { type: 'success' })
      setHasChanges(false)
    } catch (error) {
      console.error('批量保存失败:', error)
      toast('已保存（本地）', { type: 'success' })
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    if (hasChanges) {
      Taro.showModal({
        title: '有未保存的更改',
        content: '确定要返回吗？',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateBack()
          }
        }
      })
    } else {
      Taro.navigateBack()
    }
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return
    
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp
    
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1
    }))
    
    setItems(reorderedItems)
    setHasChanges(true)
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="block text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-4">
        <View className="flex justify-between items-center">
          <View className="flex items-center gap-3">
            <Button variant="ghost" className="text-white p-0" onClick={handleBack}>
              <ArrowLeft size={24} color="#ffffff" />
            </Button>
            <View>
              <Text className="block text-white text-lg font-semibold">内容管理</Text>
              <Text className="block text-blue-100 text-sm">编辑工作流程提醒内容</Text>
            </View>
          </View>
          <Badge className="bg-white text-blue-600">
            {items.length} 项
          </Badge>
        </View>
      </View>

      {/* Items List */}
      <View className="px-4 py-4">
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          {items.map((item, index) => (
            <View 
              key={item.id} 
              className={`p-4 border-b border-gray-100 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              <View className="flex items-start gap-3">
                {/* Drag Handle */}
                <View className="flex flex-col gap-1 pt-1">
                  <Button 
                    variant="ghost" 
                    className="p-0 h-4 min-w-4 text-gray-400 hover:text-gray-600"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                  >
                    <Text className="block text-xs">▲</Text>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="p-0 h-4 min-w-4 text-gray-400 hover:text-gray-600"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                  >
                    <Text className="block text-xs">▼</Text>
                  </Button>
                </View>
                
                {/* Index */}
                <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Text className="block text-xs text-blue-600 font-semibold">{index + 1}</Text>
                </View>
                
                {/* Content */}
                <View className="flex-1">
                  <Text className="block text-gray-900">{item.content}</Text>
                </View>
                
                {/* Actions */}
                <View className="flex items-center gap-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    className="p-2 text-blue-600"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil size={18} color="#2563eb" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="p-2 text-red-500"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Add Button */}
        <Button
          className="w-full mt-4 bg-white text-blue-600 border-2 border-dashed border-blue-300 hover:bg-blue-50"
          onClick={handleAdd}
        >
          <Plus size={20} color="#2563eb" className="mr-2" />
          <Text className="block">添加新提醒</Text>
        </Button>
      </View>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-6">
          <Text className="block text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? '编辑提醒内容' : '添加新提醒'}
          </Text>
          
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Textarea
              value={editContent}
              onInput={(e) => setEditContent(e.detail.value)}
              placeholder="输入提醒内容..."
              maxlength={200}
              className="min-h-24 bg-transparent"
            />
            <Text className="block text-xs text-gray-400 text-right mt-1">
              {editContent.length}/200
            </Text>
          </View>
          
          <View className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      {/* Save All Button */}
      {hasChanges && (
        <View className="fixed bottom-4 left-4 right-4">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            <Save size={20} color="#ffffff" className="mr-2" />
            <Text className="block">{isSaving ? '保存中...' : '保存全部更改'}</Text>
          </Button>
        </View>
      )}
    </View>
  )
}
