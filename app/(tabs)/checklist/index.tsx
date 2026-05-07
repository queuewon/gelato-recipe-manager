import { useEffect, useMemo, useState, type JSX } from 'react'
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState } from '../../../components/common/EmptyState'
import { useChecklistStore } from '../../../store/checklistStore'
import { useRecipeStore } from '../../../store/recipeStore'
import type { ChecklistStatus, Recipe } from '../../../types'

const PRIMARY = '#1E90FF'

function statusMeta(s: ChecklistStatus): {
  label: string
  bg: string
  text: string
} {
  switch (s) {
    case 'done':
      return { label: '완료', bg: '#D1FAE5', text: '#065F46' }
    case 'in_progress':
      return { label: '진행중', bg: '#FEF3C7', text: '#92400E' }
    case 'pending':
      return { label: '대기', bg: '#F3F4F6', text: '#374151' }
  }
}

function nextStatus(s: ChecklistStatus): ChecklistStatus {
  if (s === 'pending') return 'in_progress'
  if (s === 'in_progress') return 'done'
  return 'pending'
}

function formatToday(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const day = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()]
  return `${y}.${m}.${d} ${day}`
}

export default function Checklist(): JSX.Element {
  const checklist = useChecklistStore((s) => s.checklist)
  const loadTodayChecklist = useChecklistStore((s) => s.loadTodayChecklist)
  const updateStatus = useChecklistStore((s) => s.updateStatus)
  const addItem = useChecklistStore((s) => s.addItem)
  const removeItem = useChecklistStore((s) => s.removeItem)

  const recipes = useRecipeStore((s) => s.recipes)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)

  const [modalOpen, setModalOpen] = useState(false)
  const [pickedRecipe, setPickedRecipe] = useState<Recipe | null>(null)
  const [batchSize, setBatchSize] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const today = useMemo(() => formatToday(), [])

  useEffect(() => {
    void loadTodayChecklist()
    void loadRecipes()
  }, [loadTodayChecklist, loadRecipes])

  const total = checklist.length
  const done = checklist.filter((c) => c.status === 'done').length
  const progressPct = total > 0 ? (done / total) * 100 : 0

  const closeModal = (): void => {
    setModalOpen(false)
    setPickedRecipe(null)
    setBatchSize('')
  }

  const handleAdd = async (): Promise<void> => {
    if (!pickedRecipe) return
    const n = Number(batchSize)
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('배치량을 입력해주세요')
      return
    }
    setSubmitting(true)
    try {
      await addItem(pickedRecipe.id, n)
      closeModal()
    } catch (e) {
      Alert.alert('추가 실패', e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleLongPress = (id: number, name: string): void => {
    Alert.alert(
      '항목 삭제',
      `"${name}"을(를) 삭제하시겠어요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            void removeItem(id).catch((e: unknown) => {
              Alert.alert(
                '삭제 실패',
                e instanceof Error ? e.message : String(e),
              )
            })
          },
        },
      ],
    )
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <View className="px-5 pb-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900">
          오늘 생산할 메뉴
        </Text>
        <Text className="mt-1 text-sm text-gray-500">{today}</Text>
      </View>

      <View className="mx-5 mb-4 rounded-xl border border-gray-200 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-700">진행률</Text>
          <Text className="text-sm text-gray-500">
            {done} / {total} 완료
          </Text>
        </View>
        <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <View
            className="h-full rounded-full"
            style={{ width: `${progressPct}%`, backgroundColor: PRIMARY }}
          />
        </View>
      </View>

      <FlatList
        data={checklist}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            title="비어있어요"
            subtitle="오늘 생산할 메뉴를 추가해보세요"
          />
        }
        renderItem={({ item }) => {
          const meta = statusMeta(item.status)
          const checked = item.status === 'done'
          return (
            <Pressable
              onPress={() => {
                void updateStatus(item.id, nextStatus(item.status))
              }}
              onLongPress={() => handleLongPress(item.id, item.recipe.name)}
              className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
            >
              <View className="flex-1 flex-row items-center">
                <View
                  className={`mr-3 h-5 w-5 items-center justify-center rounded border ${
                    checked
                      ? 'border-[#1E90FF] bg-[#1E90FF]'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {checked ? (
                    <Text className="text-xs font-bold text-white">✓</Text>
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base ${
                      checked
                        ? 'text-gray-400 line-through'
                        : 'text-gray-900'
                    }`}
                  >
                    {item.recipe.name}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {item.batch_size.toLocaleString()} g
                  </Text>
                </View>
              </View>
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: meta.bg }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: meta.text }}
                >
                  {meta.label}
                </Text>
              </View>
            </Pressable>
          )
        }}
      />

      <View className="border-t border-gray-200 bg-white px-5 pb-4 pt-3">
        <Pressable
          onPress={() => setModalOpen(true)}
          className="items-center rounded-xl bg-[#1E90FF] py-3"
        >
          <Text className="text-base font-semibold text-white">+ 메뉴 추가</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalOpen}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <SafeAreaView edges={['top']} className="bg-[#F8FAFC]" />
        <KeyboardAvoidingView
          className="flex-1 bg-[#F8FAFC]"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-4">
            <Text className="text-lg font-semibold text-gray-900">
              {pickedRecipe ? '배치량 입력' : '레시피 선택'}
            </Text>
            <Pressable onPress={closeModal}>
              <Text className="text-base text-gray-700">닫기</Text>
            </Pressable>
          </View>

          {!pickedRecipe ? (
            <FlatList
              data={recipes}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 20, gap: 8, flexGrow: 1 }}
              ListEmptyComponent={
                <EmptyState
                  title="등록된 레시피가 없어요"
                  subtitle="레시피 탭에서 먼저 등록해주세요"
                />
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setPickedRecipe(item)
                    setBatchSize(String(item.batch_size))
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <Text className="text-base font-medium text-gray-900">
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    기본 {item.batch_size.toLocaleString()}g
                  </Text>
                </Pressable>
              )}
            />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text className="mb-2 text-sm text-gray-500">선택된 레시피</Text>
              <View className="mb-5 rounded-xl border border-[#1E90FF] bg-[#F0F7FF] px-4 py-3">
                <Text className="text-base font-semibold text-[#1E90FF]">
                  {pickedRecipe.name}
                </Text>
                <Text className="mt-0.5 text-xs text-gray-500">
                  기본 {pickedRecipe.batch_size.toLocaleString()}g
                </Text>
              </View>

              <Text className="mb-2 text-sm font-medium text-gray-700">
                배치량 (g)
              </Text>
              <TextInput
                value={batchSize}
                onChangeText={setBatchSize}
                placeholder="5000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
              />

              <View className="mt-5 flex-row" style={{ gap: 12 }}>
                <Pressable
                  onPress={() => {
                    setPickedRecipe(null)
                    setBatchSize('')
                  }}
                  className="flex-1 items-center rounded-xl border border-gray-200 py-3"
                >
                  <Text className="text-base text-gray-700">다시 선택</Text>
                </Pressable>
                <Pressable
                  onPress={handleAdd}
                  disabled={submitting}
                  className={`flex-1 items-center rounded-xl py-3 ${
                    submitting ? 'bg-gray-300' : 'bg-[#1E90FF]'
                  }`}
                >
                  <Text className="text-base font-semibold text-white">
                    {submitting ? '추가 중...' : '추가'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
