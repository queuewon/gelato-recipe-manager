import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import {
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
import { FilterChip } from '../../../components/common/FilterChip'
import { useCategoryStore } from '../../../store/categoryStore'
import { useIngredientStore } from '../../../store/ingredientStore'

const STOCK_UNITS = ['개', '봉', '통'] as const
type StockUnit = (typeof STOCK_UNITS)[number]

export default function IngredientForm(): JSX.Element {
  const router = useRouter()
  const { edit } = useLocalSearchParams<{ edit?: string }>()
  const editIdParsed = edit ? Number(edit) : NaN
  const isEdit = Number.isFinite(editIdParsed)
  const editId = isEdit ? editIdParsed : null

  const suppliers = useIngredientStore((s) => s.suppliers)
  const selectedIngredient = useIngredientStore((s) => s.selectedIngredient)
  const loadIngredientById = useIngredientStore((s) => s.loadIngredientById)
  const loadSuppliers = useIngredientStore((s) => s.loadSuppliers)
  const createIngredient = useIngredientStore((s) => s.createIngredient)
  const updateIngredient = useIngredientStore((s) => s.updateIngredient)
  const createSupplier = useIngredientStore((s) => s.createSupplier)

  const ingredientCategories = useCategoryStore((s) => s.ingredientCategories)
  const addIngredientCategory = useCategoryStore((s) => s.addIngredientCategory)
  const loadCategories = useCategoryStore((s) => s.loadCategories)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [unitG, setUnitG] = useState('')
  const [unitCount, setUnitCount] = useState('1')
  const [stockCount, setStockCount] = useState('')
  const [stockUnit, setStockUnit] = useState<StockUnit>('개')
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [addingCat, setAddingCat] = useState(false)
  const [newCatText, setNewCatText] = useState('')
  const [addingCatBusy, setAddingCatBusy] = useState(false)

  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [supplierMemo, setSupplierMemo] = useState('')
  const [supplierSubmitting, setSupplierSubmitting] = useState(false)

  const initializedRef = useRef(false)

  useEffect(() => {
    void loadCategories()
    void loadSuppliers()
    if (editId !== null) {
      void loadIngredientById(editId)
    }
  }, [editId, loadCategories, loadSuppliers, loadIngredientById])

  useEffect(() => {
    if (category === '' && ingredientCategories.length > 0) {
      setCategory(ingredientCategories[0])
    }
  }, [ingredientCategories, category])

  useEffect(() => {
    if (initializedRef.current) return
    if (editId === null) {
      initializedRef.current = true
      return
    }
    if (!selectedIngredient || selectedIngredient.id !== editId) return
    setName(selectedIngredient.name)
    setCategory(selectedIngredient.category)
    setPurchasePrice(String(selectedIngredient.package_price))
    setUnitG(String(selectedIngredient.package_amount))
    setUnitCount('1')
    setStockCount(String(selectedIngredient.stock_count))
    if ((STOCK_UNITS as readonly string[]).includes(selectedIngredient.stock_unit)) {
      setStockUnit(selectedIngredient.stock_unit as StockUnit)
    }
    setSupplierId(selectedIngredient.supplier_id ?? null)
    initializedRef.current = true
  }, [editId, selectedIngredient])

  const pricePerG = useMemo(() => {
    const p = Number(purchasePrice)
    const u = Number(unitG)
    const c = Number(unitCount)
    if (!Number.isFinite(p) || !Number.isFinite(u) || !Number.isFinite(c))
      return null
    if (p <= 0 || u <= 0 || c <= 0) return null
    return p / (u * c)
  }, [purchasePrice, unitG, unitCount])

  const handleAddCategory = async (): Promise<void> => {
    const trimmed = newCatText.trim()
    if (!trimmed) return
    setAddingCatBusy(true)
    try {
      await addIngredientCategory(trimmed)
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
      Alert.alert('재료명을 입력해주세요')
      return
    }
    const p = Number(purchasePrice)
    const u = Number(unitG)
    const c = Number(unitCount)
    if (!Number.isFinite(p) || p <= 0) {
      Alert.alert('구매가격을 입력해주세요')
      return
    }
    if (!Number.isFinite(u) || u <= 0) {
      Alert.alert('단위 기준(g)을 입력해주세요')
      return
    }
    if (!Number.isFinite(c) || c <= 0) {
      Alert.alert('개수를 입력해주세요')
      return
    }
    const stk = Number(stockCount || '0')
    if (!Number.isFinite(stk) || stk < 0) {
      Alert.alert('재고를 올바르게 입력해주세요')
      return
    }

    setSubmitting(true)
    try {
      const data = {
        name: name.trim(),
        category,
        package_price: p,
        package_amount: u * c,
        stock_count: stk,
        stock_unit: stockUnit,
        supplier_id: supplierId ?? undefined,
      }
      if (editId !== null) {
        await updateIngredient(editId, data)
        router.replace(`/ingredients/${editId}`)
      } else {
        const newId = await createIngredient(data)
        router.replace(`/ingredients/${newId}`)
      }
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateSupplier = async (): Promise<void> => {
    if (!supplierName.trim()) {
      Alert.alert('업체명을 입력해주세요')
      return
    }
    setSupplierSubmitting(true)
    try {
      const newId = await createSupplier({
        name: supplierName.trim(),
        contact: supplierContact.trim() || undefined,
        memo: supplierMemo.trim() || undefined,
      })
      setSupplierId(newId)
      setSupplierModalOpen(false)
      setSupplierName('')
      setSupplierContact('')
      setSupplierMemo('')
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : String(e))
    } finally {
      setSupplierSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F8FAFC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">
          {editId !== null ? '재료 수정' : '재료 등록'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Text className="mb-2 text-sm font-medium text-gray-700">재료명</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="예: 우유"
          placeholderTextColor="#9CA3AF"
          className="mb-5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
        />

        {/* Category */}
        <Text className="mb-2 text-sm font-medium text-gray-700">카테고리</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          className="mb-5"
        >
          {ingredientCategories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              isActive={category === cat}
              onPress={() => setCategory(cat)}
            />
          ))}
          {addingCat ? (
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <TextInput
                value={newCatText}
                onChangeText={setNewCatText}
                placeholder="카테고리명"
                placeholderTextColor="#9CA3AF"
                autoFocus
                className="rounded-2xl border border-[#1E90FF] bg-white px-3 py-1.5 text-sm text-gray-900"
                style={{ minWidth: 80 }}
              />
              <Pressable
                onPress={handleAddCategory}
                disabled={addingCatBusy || !newCatText.trim()}
                className="rounded-2xl bg-[#1E90FF] px-3 py-1.5"
              >
                <Text className="text-sm font-medium text-white">확인</Text>
              </Pressable>
              <Pressable
                onPress={() => { setAddingCat(false); setNewCatText('') }}
                className="rounded-2xl border border-gray-300 bg-white px-3 py-1.5"
              >
                <Text className="text-sm text-gray-600">취소</Text>
              </Pressable>
            </View>
          ) : (
            <FilterChip
              label="+ 추가"
              isActive={false}
              onPress={() => setAddingCat(true)}
            />
          )}
        </ScrollView>

        {/* Purchase Info */}
        <Text className="mb-2 text-sm font-medium text-gray-700">구매 정보</Text>
        <View className="rounded-xl border border-gray-200 p-3">
          <View className="mb-2 flex-row items-center">
            <Text className="w-20 text-sm text-gray-600">구매가격</Text>
            <TextInput
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="2800"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="flex-1 text-right text-base text-gray-900"
            />
            <Text className="ml-1 text-sm text-gray-500">원</Text>
          </View>
          <View className="mb-2 flex-row items-center">
            <Text className="w-20 text-sm text-gray-600">단위 기준</Text>
            <TextInput
              value={unitG}
              onChangeText={setUnitG}
              placeholder="1000"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="flex-1 text-right text-base text-gray-900"
            />
            <Text className="ml-1 text-sm text-gray-500">g</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="w-20 text-sm text-gray-600">개수</Text>
            <TextInput
              value={unitCount}
              onChangeText={setUnitCount}
              placeholder="1"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="flex-1 text-right text-base text-gray-900"
            />
            <Text className="ml-1 text-sm text-gray-500">개</Text>
          </View>
        </View>
        <View className="mb-5 mt-1.5">
          {pricePerG !== null ? (
            <Text className="text-xs text-[#1E90FF]">
              1g당 {(Math.round(pricePerG * 100) / 100).toLocaleString()}원
            </Text>
          ) : (
            <Text className="text-xs text-gray-400">
              구매 정보를 입력하면 1g당 가격이 표시돼요
            </Text>
          )}
        </View>

        {/* Stock */}
        <Text className="mb-2 text-sm font-medium text-gray-700">재고</Text>
        <TextInput
          value={stockCount}
          onChangeText={setStockCount}
          placeholder="0"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          className="mb-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
        />
        <View className="mb-5 flex-row" style={{ gap: 8 }}>
          {STOCK_UNITS.map((u) => (
            <FilterChip
              key={u}
              label={u}
              isActive={stockUnit === u}
              onPress={() => setStockUnit(u)}
            />
          ))}
        </View>

        {/* Supplier */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-700">공급업체</Text>
          <Pressable
            onPress={() => setSupplierModalOpen(true)}
            className="rounded-full bg-[#E8F4FF] px-3 py-1.5"
          >
            <Text className="text-sm font-medium text-[#1E90FF]">
              + 새 공급업체
            </Text>
          </Pressable>
        </View>
        {suppliers.length === 0 ? (
          <View className="rounded-xl border border-dashed border-gray-200 p-4">
            <Text className="text-center text-sm text-gray-500">
              등록된 공급업체가 없어요
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {suppliers.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSupplierId(s.id)}
                className={`rounded-xl border px-4 py-3 ${
                  supplierId === s.id
                    ? 'border-[#1E90FF] bg-[#E8F4FF]'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Text
                  className={`text-base ${
                    supplierId === s.id
                      ? 'font-medium text-[#1E90FF]'
                      : 'text-gray-900'
                  }`}
                >
                  {s.name}
                </Text>
                {s.contact ? (
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {s.contact}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Submit */}
      <View className="border-t border-gray-200 bg-white px-5 pb-4 pt-3">
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className={`items-center rounded-xl py-3 ${
            submitting ? 'bg-gray-300' : 'bg-[#1E90FF]'
          }`}
        >
          <Text className="text-base font-semibold text-white">
            {submitting ? '저장 중...' : '저장'}
          </Text>
        </Pressable>
      </View>

      {/* Supplier Modal */}
      <Modal
        visible={supplierModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSupplierModalOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            className="absolute inset-0 bg-black/40"
            onPress={() => setSupplierModalOpen(false)}
          />
          <View className="rounded-t-3xl bg-white p-6">
            <Text className="mb-4 text-lg font-semibold text-gray-900">
              새 공급업체
            </Text>

            <Text className="mb-1 text-sm text-gray-500">업체명</Text>
            <TextInput
              value={supplierName}
              onChangeText={setSupplierName}
              placeholder="예: 한국유제품"
              placeholderTextColor="#9CA3AF"
              className="mb-3 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            />

            <Text className="mb-1 text-sm text-gray-500">연락처 (선택)</Text>
            <TextInput
              value={supplierContact}
              onChangeText={setSupplierContact}
              placeholder="010-0000-0000"
              placeholderTextColor="#9CA3AF"
              className="mb-3 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            />

            <Text className="mb-1 text-sm text-gray-500">메모 (선택)</Text>
            <TextInput
              value={supplierMemo}
              onChangeText={setSupplierMemo}
              placeholder="메모"
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              className="mb-5 min-h-[60px] rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            />

            <View className="flex-row" style={{ gap: 12 }}>
              <Pressable
                onPress={() => setSupplierModalOpen(false)}
                className="flex-1 items-center rounded-xl border border-gray-200 py-3"
              >
                <Text className="text-base text-gray-700">취소</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateSupplier}
                disabled={supplierSubmitting}
                className={`flex-1 items-center rounded-xl py-3 ${
                  supplierSubmitting ? 'bg-gray-300' : 'bg-[#1E90FF]'
                }`}
              >
                <Text className="text-base font-semibold text-white">
                  {supplierSubmitting ? '저장 중...' : '저장'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  )
}
