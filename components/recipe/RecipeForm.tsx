import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
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
import { BASE_CATEGORIES } from '../../constants/categories'
import { useIngredientStore } from '../../store/ingredientStore'
import type { BaseCategory, Ingredient } from '../../types'
import { EmptyState } from '../common/EmptyState'
import { FilterChip } from '../common/FilterChip'

interface RecipeIngredientInput {
  ingredient_id: number
  amount: number
}

export interface RecipeFormValues {
  name: string
  base_category: BaseCategory
  batch_size: number
  memo?: string
  ingredients: RecipeIngredientInput[]
}

interface RecipeFormProps {
  initial?: RecipeFormValues
  onSubmit: (values: RecipeFormValues) => Promise<void>
  submitLabel?: string
}

interface IngredientRow {
  ingredient: Ingredient
  amount: string
}

export function RecipeForm({
  initial,
  onSubmit,
  submitLabel = '저장',
}: RecipeFormProps): JSX.Element {
  const ingredients = useIngredientStore((s) => s.ingredients)
  const loadIngredients = useIngredientStore((s) => s.loadIngredients)

  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<BaseCategory>(
    initial?.base_category ?? '과일',
  )
  const [batchSize, setBatchSize] = useState(
    initial ? String(initial.batch_size) : '',
  )
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [rows, setRows] = useState<IngredientRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const initializedRef = useRef(false)

  useEffect(() => {
    void loadIngredients()
  }, [loadIngredients])

  useEffect(() => {
    if (initializedRef.current) return
    if (!initial) {
      initializedRef.current = true
      return
    }
    if (ingredients.length === 0) return
    const map = new Map<number, Ingredient>(ingredients.map((i) => [i.id, i]))
    const seeded: IngredientRow[] = []
    for (const ri of initial.ingredients) {
      const ing = map.get(ri.ingredient_id)
      if (ing) seeded.push({ ingredient: ing, amount: String(ri.amount) })
    }
    setRows(seeded)
    initializedRef.current = true
  }, [initial, ingredients])

  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => {
      const amount = Number(r.amount)
      if (!Number.isFinite(amount) || amount <= 0) return sum
      return sum + amount * r.ingredient.price_per_g
    }, 0)
  }, [rows])

  const updateRow = (idx: number, patch: Partial<IngredientRow>): void => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const removeRow = (idx: number): void => {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      Alert.alert('레시피명을 입력해주세요')
      return
    }
    const parsedBatch = Number(batchSize)
    if (!Number.isFinite(parsedBatch) || parsedBatch <= 0) {
      Alert.alert('기본 배치량을 입력해주세요 (g)')
      return
    }
    if (rows.length === 0) {
      Alert.alert('재료를 1개 이상 추가해주세요')
      return
    }
    const out: RecipeIngredientInput[] = []
    for (const r of rows) {
      const amount = Number(r.amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        Alert.alert(`${r.ingredient.name}의 사용량을 확인해주세요`)
        return
      }
      out.push({ ingredient_id: r.ingredient.id, amount })
    }
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        base_category: category,
        batch_size: parsedBatch,
        memo: memo.trim() || undefined,
        ingredients: out,
      })
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const availableForModal = ingredients.filter(
    (ing) => !rows.some((r) => r.ingredient.id === ing.id),
  )

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Text className="mb-2 text-sm font-medium text-gray-700">레시피명</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="예: 피스타치오 젤라또"
          placeholderTextColor="#A0A8B3"
          className="mb-5 rounded-xl border border-[#EFE0E8] bg-white px-4 py-3 text-base text-[#2D2040]"
        />

        {/* Category */}
        <Text className="mb-2 text-sm font-medium text-gray-700">카테고리</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          className="mb-5"
        >
          {BASE_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              isActive={category === cat}
              onPress={() => setCategory(cat)}
            />
          ))}
        </ScrollView>

        {/* Batch Size */}
        <Text className="mb-2 text-sm font-medium text-gray-700">
          기본 배치량 (g)
        </Text>
        <TextInput
          value={batchSize}
          onChangeText={setBatchSize}
          placeholder="5000"
          placeholderTextColor="#A0A8B3"
          keyboardType="numeric"
          className="mb-5 rounded-xl border border-[#EFE0E8] bg-white px-4 py-3 text-base text-[#2D2040]"
        />

        {/* Memo */}
        <Text className="mb-2 text-sm font-medium text-gray-700">
          메모 (선택)
        </Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="메모를 입력하세요"
          placeholderTextColor="#A0A8B3"
          multiline
          textAlignVertical="top"
          className="mb-6 min-h-[80px] rounded-xl border border-[#EFE0E8] bg-white px-4 py-3 text-base text-[#2D2040]"
        />

        {/* Ingredients */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-[#2D2040]">재료</Text>
          <Pressable
            onPress={() => setModalOpen(true)}
            className="rounded-full bg-[#E0EFFF] px-3 py-1.5"
          >
            <Text className="text-sm font-medium text-[#85BBFF]">재료 추가</Text>
          </Pressable>
        </View>

        {rows.length === 0 ? (
          <View className="mb-2 rounded-xl border border-dashed border-[#EFE0E8] p-6">
            <Text className="text-center text-sm text-gray-500">
              재료를 추가해주세요
            </Text>
          </View>
        ) : (
          rows.map((row, i) => (
            <View
              key={row.ingredient.id}
              className="mb-2 flex-row items-center rounded-xl border border-[#EFE0E8] bg-white px-3 py-2.5"
            >
              <Text className="flex-1 text-base text-[#2D2040]">
                {row.ingredient.name}
              </Text>
              <TextInput
                value={row.amount}
                onChangeText={(text) => updateRow(i, { amount: text })}
                placeholder="0"
                placeholderTextColor="#A0A8B3"
                keyboardType="numeric"
                className="w-20 rounded-md border border-[#EFE0E8] bg-white px-2 py-1 text-right text-base text-[#2D2040]"
              />
              <Text className="ml-1 text-sm text-gray-500">g</Text>
              <Pressable
                onPress={() => removeRow(i)}
                className="ml-3 px-2 py-1"
              >
                <Text className="text-sm text-[#FF6B6B]">삭제</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom: Total + Submit */}
      <View className="border-t border-[#EFE0E8] bg-white px-5 pb-4 pt-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm text-gray-700">총 원가</Text>
          <Text className="text-lg font-bold text-[#FF6B6B]">
            {Math.round(totalCost).toLocaleString()}원
          </Text>
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className={`items-center rounded-xl py-3 ${
            submitting ? 'bg-gray-200' : 'bg-[#FF85A1]'
          }`}
        >
          <Text className="text-base font-semibold text-white">
            {submitting ? '저장 중...' : submitLabel}
          </Text>
        </Pressable>
      </View>

      {/* Modal: ingredient picker */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-[#EFE0E8] px-5 py-4">
            <Text className="text-lg font-semibold text-[#2D2040]">
              재료 선택
            </Text>
            <Pressable onPress={() => setModalOpen(false)}>
              <Text className="text-base text-gray-700">닫기</Text>
            </Pressable>
          </View>
          <FlatList
            data={availableForModal}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 20, gap: 8, flexGrow: 1 }}
            ListEmptyComponent={
              <EmptyState
                title="추가할 재료가 없어요"
                subtitle="재료 탭에서 먼저 등록해주세요"
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setRows((prev) => [
                    ...prev,
                    { ingredient: item, amount: '' },
                  ])
                  setModalOpen(false)
                }}
                className="flex-row items-center justify-between rounded-xl border border-[#EFE0E8] bg-white px-4 py-3"
              >
                <Text className="text-base font-medium text-[#2D2040]">
                  {item.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  {Math.round(item.price_per_g * 100) / 100}원/g
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}
