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
import { PASTEL_THEMES } from '../../constants/colors'
import { useCategoryStore } from '../../store/categoryStore'
import { useIngredientStore } from '../../store/ingredientStore'
import type { BaseCategory, Ingredient } from '../../types'
import { EmptyState } from '../common/EmptyState'
import { FilterChip } from '../common/FilterChip'

const THEME = PASTEL_THEMES.pink

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

const inputStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: THEME.ring,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 15,
  color: '#1A1A2E',
} as const

function FieldLabel({ children }: { children: string }): JSX.Element {
  return (
    <Text
      style={{
        marginBottom: 8,
        fontSize: 12,
        fontWeight: '700',
        color: THEME.deep,
        letterSpacing: 0.4,
      }}
    >
      {children.toUpperCase()}
    </Text>
  )
}

export function RecipeForm({
  initial,
  onSubmit,
  submitLabel = '저장',
}: RecipeFormProps): JSX.Element {
  const ingredients = useIngredientStore((s) => s.ingredients)
  const loadIngredients = useIngredientStore((s) => s.loadIngredients)

  const recipeCategories = useCategoryStore((s) => s.recipeCategories)
  const loadCategories = useCategoryStore((s) => s.loadCategories)
  const addRecipeCategory = useCategoryStore((s) => s.addRecipeCategory)

  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<string>(
    initial?.base_category ?? '',
  )
  const [batchSize, setBatchSize] = useState(
    initial ? String(initial.batch_size) : '',
  )
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [rows, setRows] = useState<IngredientRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [addingCat, setAddingCat] = useState(false)
  const [newCatText, setNewCatText] = useState('')
  const [addingCatBusy, setAddingCatBusy] = useState(false)

  const initializedRef = useRef(false)

  useEffect(() => {
    void loadIngredients()
    void loadCategories()
  }, [loadIngredients, loadCategories])

  useEffect(() => {
    if (category === '' && recipeCategories.length > 0) {
      setCategory(recipeCategories[0])
    }
  }, [recipeCategories, category])

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

  const handleAddCategory = async (): Promise<void> => {
    const trimmed = newCatText.trim()
    if (!trimmed) return
    setAddingCatBusy(true)
    try {
      await addRecipeCategory(trimmed)
      setCategory(trimmed)
      setNewCatText('')
      setAddingCat(false)
    } catch (e) {
      Alert.alert('추가 실패', e instanceof Error ? e.message : String(e))
    } finally {
      setAddingCatBusy(false)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      Alert.alert('레시피명을 입력해주세요')
      return
    }
    if (!category) {
      Alert.alert('카테고리를 선택해주세요')
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
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <FieldLabel>레시피명</FieldLabel>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="예: 피스타치오 젤라또"
          placeholderTextColor="#C9A6B8"
          style={{ ...inputStyle, marginBottom: 20 }}
        />

        <FieldLabel>카테고리</FieldLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          className="mb-2"
        >
          {recipeCategories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              isActive={category === cat}
              onPress={() => {
                setCategory(cat)
                setAddingCat(false)
              }}
            />
          ))}
          <Pressable
            onPress={() => setAddingCat((v) => !v)}
            style={{
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: THEME.accent,
              backgroundColor: '#FFFFFF',
            }}
          >
            <Text style={{ fontSize: 13, color: THEME.deep, fontWeight: '600' }}>
              + 추가
            </Text>
          </Pressable>
        </ScrollView>

        {addingCat && (
          <View
            className="mb-4 mt-2 flex-row items-center"
            style={{ gap: 8 }}
          >
            <TextInput
              value={newCatText}
              onChangeText={setNewCatText}
              placeholder="새 카테고리명"
              placeholderTextColor="#C9A6B8"
              autoFocus
              style={{ ...inputStyle, flex: 1, paddingVertical: 10 }}
            />
            <Pressable
              onPress={handleAddCategory}
              disabled={addingCatBusy || !newCatText.trim()}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: THEME.deep,
              }}
            >
              <Text className="text-sm font-semibold text-white">확인</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setAddingCat(false)
                setNewCatText('')
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text className="text-sm text-gray-600">취소</Text>
            </Pressable>
          </View>
        )}

        <View className="mb-5" />

        <FieldLabel>기본 배치량 (g)</FieldLabel>
        <TextInput
          value={batchSize}
          onChangeText={setBatchSize}
          placeholder="5000"
          placeholderTextColor="#C9A6B8"
          keyboardType="numeric"
          style={{ ...inputStyle, marginBottom: 20 }}
        />

        <FieldLabel>메모 (선택)</FieldLabel>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="메모를 입력하세요"
          placeholderTextColor="#C9A6B8"
          multiline
          textAlignVertical="top"
          style={{ ...inputStyle, marginBottom: 24, minHeight: 90 }}
        />

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
            <Text className="text-base font-bold text-gray-900">재료</Text>
          </View>
          <Pressable
            onPress={() => setModalOpen(true)}
            style={{
              backgroundColor: THEME.soft,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: THEME.deep, fontSize: 13, fontWeight: '700' }}>
              + 재료 추가
            </Text>
          </Pressable>
        </View>

        {rows.length === 0 ? (
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
            <Text className="text-sm text-gray-500">재료를 추가해주세요</Text>
          </View>
        ) : (
          rows.map((row, i) => (
            <View
              key={row.ingredient.id}
              style={{
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: THEME.ring,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text className="flex-1 text-base text-gray-900">
                {row.ingredient.name}
              </Text>
              <TextInput
                value={row.amount}
                onChangeText={(text) => updateRow(i, { amount: text })}
                placeholder="0"
                placeholderTextColor="#C9A6B8"
                keyboardType="numeric"
                style={{
                  width: 80,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  textAlign: 'right',
                  fontSize: 15,
                  color: '#1A1A2E',
                }}
              />
              <Text className="ml-1 text-sm text-gray-500">g</Text>
              <Pressable onPress={() => removeRow(i)} className="ml-3 px-2 py-1">
                <Text className="text-sm text-red-500">삭제</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom: Total + Submit */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: THEME.ring,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 18,
        }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-gray-700">총 원가</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#EF4444' }}>
            {Math.round(totalCost).toLocaleString()}원
          </Text>
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            alignItems: 'center',
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: submitting ? '#E5E7EB' : THEME.deep,
            shadowColor: THEME.deep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: submitting ? 0 : 0.25,
            shadowRadius: 8,
            elevation: submitting ? 0 : 3,
          }}
        >
          <Text className="text-base font-bold text-white">
            {submitting ? '저장 중...' : submitLabel}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={modalOpen}
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View className="flex-1 bg-white">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: THEME.ring,
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: THEME.deep }}>
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
                  setRows((prev) => [...prev, { ingredient: item, amount: '' }])
                  setModalOpen(false)
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: THEME.ring,
                }}
              >
                <Text className="text-base font-medium text-gray-900">
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
