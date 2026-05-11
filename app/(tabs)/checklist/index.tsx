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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EmptyState } from '../../../components/common/EmptyState'
import { PASTEL_THEMES } from '../../../constants/colors'
import { useChecklistStore } from '../../../store/checklistStore'
import { useRecipeStore } from '../../../store/recipeStore'
import type { ChecklistStatus, Recipe } from '../../../types'

const THEME = PASTEL_THEMES.blue

function statusMeta(s: ChecklistStatus): {
  label: string
  bg: string
  text: string
} {
  switch (s) {
    case 'done':
      return { label: '완료', bg: '#D1FAE5', text: '#065F46' }
    case 'in_progress':
      return {
        label: '진행중',
        bg: PASTEL_THEMES.yellow.soft,
        text: PASTEL_THEMES.yellow.deep,
      }
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
  const insets = useSafeAreaInsets()

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
    Alert.alert('항목 삭제', `"${name}"을(를) 삭제하시겠어요?`, [
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
    ])
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-5 pb-4 pt-4">
        <Text style={{ fontSize: 24, fontWeight: '800', color: THEME.deep }}>
          오늘 생산할 메뉴
        </Text>
        <Text className="mt-1 text-sm text-gray-500">{today}</Text>
      </View>

      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: THEME.ring,
          shadowColor: THEME.deep,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: THEME.deep,
              }}
            />
            <Text
              style={{ color: THEME.deep, fontWeight: '700', fontSize: 14 }}
            >
              진행률
            </Text>
          </View>
          <Text className="text-sm text-gray-500">
            {done} / {total} 완료
          </Text>
        </View>
        <View
          style={{
            marginTop: 12,
            height: 10,
            width: '100%',
            borderRadius: 999,
            backgroundColor: THEME.soft,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              borderRadius: 999,
              width: `${progressPct}%`,
              backgroundColor: THEME.deep,
            }}
          />
        </View>
      </View>

      <FlatList
        data={checklist}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            title="비어있네...? 일해"
            subtitle="오늘 생산할 메뉴를 추가해보도록"
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
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: THEME.ring,
                shadowColor: THEME.deep,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View className="flex-1 flex-row items-center">
                <View
                  style={{
                    marginRight: 12,
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: checked ? THEME.deep : '#FFFFFF',
                    borderColor: checked ? THEME.deep : THEME.accent,
                  }}
                >
                  {checked ? (
                    <Text className="text-xs font-bold text-white">✓</Text>
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base ${
                      checked ? 'text-gray-400 line-through' : 'text-gray-900'
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
                  className="text-xs font-bold"
                  style={{ color: meta.text }}
                >
                  {meta.label}
                </Text>
              </View>
            </Pressable>
          )
        }}
      />

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: THEME.ring,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 18,
        }}
      >
        <Pressable
          onPress={() => setModalOpen(true)}
          style={{
            alignItems: 'center',
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: THEME.deep,
            shadowColor: THEME.deep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text className="text-base font-bold text-white">+ 메뉴 추가</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalOpen}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-white"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: THEME.ring,
              paddingHorizontal: 20,
              paddingVertical: 16,
              paddingTop: insets.top + 16,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: THEME.deep }}>
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
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: THEME.ring,
                  }}
                >
                  <Text className="text-base font-bold text-gray-900">
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
              <View
                style={{
                  marginBottom: 20,
                  backgroundColor: THEME.softer,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: THEME.accent,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: THEME.deep,
                  }}
                >
                  {pickedRecipe.name}
                </Text>
                <Text className="mt-0.5 text-xs text-gray-500">
                  기본 {pickedRecipe.batch_size.toLocaleString()}g
                </Text>
              </View>

              <Text
                style={{
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: '700',
                  color: THEME.deep,
                  letterSpacing: 0.4,
                }}
              >
                배치량 (G)
              </Text>
              <TextInput
                value={batchSize}
                onChangeText={setBatchSize}
                placeholder="5000"
                placeholderTextColor="#9DB7DA"
                keyboardType="numeric"
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: THEME.ring,
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#1A1A2E',
                }}
              />

              <View className="mt-5 flex-row" style={{ gap: 12 }}>
                <Pressable
                  onPress={() => {
                    setPickedRecipe(null)
                    setBatchSize('')
                  }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                >
                  <Text className="text-base text-gray-700">다시 선택</Text>
                </Pressable>
                <Pressable
                  onPress={handleAdd}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: submitting ? '#E5E7EB' : THEME.deep,
                  }}
                >
                  <Text className="text-base font-bold text-white">
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
