import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Badge } from '../../../components/common/Badge'
import { EmptyState } from '../../../components/common/EmptyState'
import { useIngredientStore } from '../../../store/ingredientStore'

export default function IngredientDetail(): JSX.Element {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const ingredientId = Number(id)

  const selectedIngredient = useIngredientStore((s) => s.selectedIngredient)
  const isLoading = useIngredientStore((s) => s.isLoading)
  const loadIngredientById = useIngredientStore((s) => s.loadIngredientById)
  const updateIngredient = useIngredientStore((s) => s.updateIngredient)
  const deleteIngredient = useIngredientStore((s) => s.deleteIngredient)

  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (Number.isFinite(ingredientId)) {
      void loadIngredientById(ingredientId)
    }
  }, [ingredientId, loadIngredientById])

  if (isLoading && !selectedIngredient) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    )
  }

  if (!selectedIngredient || selectedIngredient.id !== ingredientId) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center px-5 pb-2 pt-4">
          <Pressable onPress={() => router.back()}>
            <Text className="text-base text-gray-700">← 뒤로</Text>
          </Pressable>
        </View>
        <EmptyState title="재료를 찾을 수 없어요" />
      </View>
    )
  }

  const ing = selectedIngredient

  const handleNewPriceSubmit = async (): Promise<void> => {
    const parsed = Number(newPrice)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('새 가격을 올바르게 입력해주세요')
      return
    }
    setSubmitting(true)
    try {
      await updateIngredient(ingredientId, { package_price: parsed })
      setNewPrice('')
      setPriceModalOpen(false)
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (): void => {
    Alert.alert(
      '재료 삭제',
      `"${ing.name}"을(를) 삭제하시겠어요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteIngredient(ingredientId)
                router.back()
              } catch (e) {
                Alert.alert(
                  '삭제 실패',
                  e instanceof Error ? e.message : String(e),
                )
              }
            })()
          },
        },
      ],
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Top Nav */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/ingredients/new?id=${ingredientId}`)}
          className="rounded-full bg-[#E8F4FF] px-4 py-2"
        >
          <Text className="text-sm font-medium text-[#1E90FF]">수정</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="px-5 py-5">
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 pr-3 text-2xl font-bold text-gray-900">
              {ing.name}
            </Text>
            <Badge label={ing.category} category={ing.category} />
          </View>
        </View>

        {/* Current Info */}
        <View className="mx-5 mb-5 rounded-2xl border border-gray-200">
          <InfoRow
            label="현재가"
            value={`${Math.round(ing.package_price).toLocaleString()}원 / ${ing.package_amount.toLocaleString()}g`}
            isFirst
          />
          <InfoRow label="기준(g)" value={`${ing.package_amount.toLocaleString()} g`} />
          <InfoRow
            label="재고"
            value={`${ing.stock_count.toLocaleString()}${ing.stock_unit}`}
          />
          <InfoRow label="공급업체" value={ing.supplier?.name ?? '-'} />
        </View>

        {/* Price History */}
        <View className="mx-5 mb-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">
              가격 변동 이력
            </Text>
            <Pressable
              onPress={() => setPriceModalOpen(true)}
              className="rounded-full bg-[#E8F4FF] px-3 py-1.5"
            >
              <Text className="text-sm font-medium text-[#1E90FF]">
                + 가격 등록
              </Text>
            </Pressable>
          </View>
          {ing.priceHistory.length === 0 ? (
            <View className="rounded-xl border border-dashed border-gray-200 p-6">
              <Text className="text-center text-sm text-gray-500">
                기록된 이력이 없어요
              </Text>
            </View>
          ) : (
            <View className="overflow-hidden rounded-2xl border border-gray-200">
              {ing.priceHistory.map((h, i, arr) => {
                const older = i + 1 < arr.length ? arr[i + 1] : null
                const delta = older ? h.package_price - older.package_price : 0
                const isLast = i === arr.length - 1
                return (
                  <View
                    key={h.id}
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      isLast ? '' : 'border-b border-gray-100'
                    }`}
                  >
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500">
                        {h.recorded_at}
                      </Text>
                      <Text className="mt-0.5 text-sm font-medium text-gray-900">
                        {Math.round(h.package_price).toLocaleString()}원 /{' '}
                        {h.package_amount.toLocaleString()}g
                      </Text>
                    </View>
                    {older ? (
                      delta === 0 ? (
                        <Text className="text-xs text-gray-400">-</Text>
                      ) : (
                        <Text
                          className={`text-xs font-medium ${
                            delta > 0 ? 'text-red-500' : 'text-green-600'
                          }`}
                        >
                          {delta > 0 ? '▲' : '▼'}{' '}
                          {Math.abs(Math.round(delta)).toLocaleString()}
                        </Text>
                      )
                    ) : (
                      <Text className="text-xs text-gray-400">최초</Text>
                    )}
                  </View>
                )
              })}
            </View>
          )}
        </View>

        {/* Delete */}
        <View className="mx-5 mb-2">
          <Pressable
            onPress={handleDelete}
            className="items-center rounded-xl border border-red-200 bg-white py-3"
          >
            <Text className="text-base font-semibold text-red-500">
              재료 삭제
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Price Modal */}
      <Modal
        visible={priceModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPriceModalOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            className="absolute inset-0 bg-black/40"
            onPress={() => setPriceModalOpen(false)}
          />
          <View className="rounded-t-3xl bg-white p-6">
            <Text className="mb-4 text-lg font-semibold text-gray-900">
              새 가격 등록
            </Text>
            <Text className="mb-2 text-sm text-gray-500">
              통가격 (원, 기준 {ing.package_amount.toLocaleString()}g)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={newPrice}
              onChangeText={setNewPrice}
              placeholder={String(Math.round(ing.package_price))}
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            />
            <View className="mt-5 flex-row" style={{ gap: 12 }}>
              <Pressable
                onPress={() => setPriceModalOpen(false)}
                className="flex-1 items-center rounded-xl border border-gray-200 py-3"
              >
                <Text className="text-base text-gray-700">취소</Text>
              </Pressable>
              <Pressable
                onPress={handleNewPriceSubmit}
                disabled={submitting}
                className={`flex-1 items-center rounded-xl py-3 ${
                  submitting ? 'bg-gray-300' : 'bg-[#1E90FF]'
                }`}
              >
                <Text className="text-base font-semibold text-white">
                  {submitting ? '저장 중...' : '저장'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

interface InfoRowProps {
  label: string
  value: string
  isFirst?: boolean
}

function InfoRow({ label, value, isFirst }: InfoRowProps): JSX.Element {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 ${
        isFirst ? '' : 'border-t border-gray-100'
      }`}
    >
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{value}</Text>
    </View>
  )
}
