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
import { PASTEL_THEMES } from '../../../constants/colors'
import { useIngredientStore } from '../../../store/ingredientStore'

const THEME = PASTEL_THEMES.yellow

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
        <ActivityIndicator color={THEME.deep} />
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
    Alert.alert('재료 삭제', `"${ing.name}"을(를) 삭제하시겠어요?`, [
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
    ])
  }

  return (
    <View className="flex-1 bg-white">
      <View
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: THEME.soft,
          opacity: 0.5,
        }}
      />

      {/* Top Nav */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/ingredients/new?edit=${ingredientId}`)}
          style={{
            backgroundColor: THEME.soft,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: THEME.deep, fontWeight: '700', fontSize: 13 }}>
            수정
          </Text>
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
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 20,
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: THEME.ring,
            overflow: 'hidden',
            shadowColor: THEME.deep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <InfoRow
            label="현재가"
            value={`${Math.round(ing.package_price).toLocaleString()}원 / ${ing.package_amount.toLocaleString()}g`}
            isFirst
          />
          <InfoRow
            label="기준(g)"
            value={`${ing.package_amount.toLocaleString()} g`}
          />
          <InfoRow
            label="재고"
            value={`${ing.stock_count.toLocaleString()}${ing.stock_unit}`}
          />
          <InfoRow label="공급업체" value={ing.supplier?.name ?? '-'} />
        </View>

        {/* Price History */}
        <View className="mx-5 mb-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: THEME.deep,
                }}
              />
              <Text className="text-base font-bold text-gray-900">
                가격 변동 이력
              </Text>
            </View>
            <Pressable
              onPress={() => setPriceModalOpen(true)}
              style={{
                backgroundColor: THEME.soft,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
              }}
            >
              <Text
                style={{ color: THEME.deep, fontWeight: '700', fontSize: 13 }}
              >
                + 가격 등록
              </Text>
            </Pressable>
          </View>
          {ing.priceHistory.length === 0 ? (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: THEME.ring,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Text className="text-sm text-gray-500">
                기록된 이력이 없어요
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: THEME.ring,
                overflow: 'hidden',
              }}
            >
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
                      <Text className="mt-0.5 text-sm font-bold text-gray-900">
                        {Math.round(h.package_price).toLocaleString()}원 /{' '}
                        {h.package_amount.toLocaleString()}g
                      </Text>
                    </View>
                    {older ? (
                      delta === 0 ? (
                        <Text className="text-xs text-gray-400">-</Text>
                      ) : (
                        <Text
                          className={`text-xs font-bold ${
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
            style={{
              alignItems: 'center',
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#FECACA',
              backgroundColor: '#FFF1F2',
            }}
          >
            <Text style={{ color: '#BE123C', fontWeight: '700', fontSize: 15 }}>
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
            <Text
              style={{
                marginBottom: 16,
                fontSize: 17,
                fontWeight: '700',
                color: THEME.deep,
              }}
            >
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
              placeholderTextColor="#C8B074"
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: THEME.ring,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                color: '#1A1A2E',
              }}
            />
            <View className="mt-5 flex-row" style={{ gap: 12 }}>
              <Pressable
                onPress={() => setPriceModalOpen(false)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <Text className="text-base text-gray-700">취소</Text>
              </Pressable>
              <Pressable
                onPress={handleNewPriceSubmit}
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
      <Text className="text-sm font-bold text-gray-900">{value}</Text>
    </View>
  )
}
