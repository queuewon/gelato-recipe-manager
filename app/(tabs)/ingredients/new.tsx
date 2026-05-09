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
import { INGREDIENT_CATEGORIES } from '../../../constants/categories'
import { useIngredientStore } from '../../../store/ingredientStore'
import type { IngredientCategory } from '../../../types'

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

  const [name, setName] = useState('')
  const [category, setCategory] = useState<IngredientCategory>('과일')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [unitG, setUnitG] = useState('')
  const [unitCount, setUnitCount] = useState('1')
  const [stockCount, setStockCount] = useState('')
  const [stockUnit, setStockUnit] = useState<StockUnit>('개')
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [supplierMemo, setSupplierMemo] = useState('')
  const [supplierSubmitting, setSupplierSubmitting] = useState(false)

  const initializedRef = useRef(false)

  useEffect(() => {
    void loadSuppliers()
    if (editId !== null) {
      void loadIngredientById(editId)
    }
  }, [editId, loadSuppliers, loadIngredientById])

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
      className="flex-1 bg-[#FFF9FB]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-[#2D2040]">
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
          {INGREDIENT_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              isActive={category === cat}
              onPress={() => setCategory(cat)}
            />
          ))}
        </ScrollView>

        {/* Purchase Info */}
        <Text className="mb-2 text-sm font-medium text-gray-700">구매 정보</Text>
        <View className="rounded-xl border border-[#EFE0E8] bg-white p-3">
          <View className="mb-2 flex-row items-center">
            <Text className="w-20 text-sm text-gray-600">구매가격</Text>
            <TextInput
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="2800"
              placeholderTextColor="#A0A8B3"
              keyboardType="numeric"
              className="flex-1 text-right text-base text-[#2D2040]"
            />
            <Text className="ml-1 text-sm text-gray-500">원</Text>
          </View>
          <View className="mb-2 flex-row items-center">
            <Text className="w-20 text-sm text-gray-600">단위 기준</Text>
            <TextInput
              value={unitG}
              onChangeText={setUnitG}
              placeholder="1000"
              placeholderTextColor="#A0A8B3"
              keyboardType="numeric"
              className="flex-1 text-right text-base text-[#2D2040]"
            />
            <Text className="ml-1 text-sm text-gray-500">g</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="w-20 text-sm text-gray-600">개수</Text>
            <TextInput
              value={unitCount}
              onChangeText={setUnitCount}
              placeholder="1"
              placeholderTextColor="#A0A8B3"
              keyboardType="numeric"
              className="flex-1 text-right text-base text-[#2D2040]"
            />
            <Text className="ml-1 text-sm text-gray-500">개</Text>
          </View>
        </View>
        <View className="mb-5 mt-1.5">
          {pricePerG !== null ? (
            <Text className="text-xs text-[#FF85A1]">
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
          placeholderTextColor="#A0A8B3"
          keyboardType="numeric"
          className="mb-2 rounded-xl border border-[#EFE0E8] bg-white px-4 py-3 text-base text-[#2D2040]"
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
            className="rounded-full bg-[#E0EFFF] px-3 py-1.5"
          >
            <Text className="text-sm font-medium text-[#85BBFF]">
              + 새 공급업체
            </Text>
          </Pressable>
        </View>
        {suppliers.length === 0 ? (
          <View className="rounded-xl border border-dashed border-[#EFE0E8] p-4">
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
                    ? 'border-[#FF85A1] bg-[#FFE8F0]'
                    : 'border-[#EFE0E8] bg-white'
                }`}
              >
                <Text
                  className={`text-base ${
                    supplierId === s.id
                      ? 'font-medium text-[#FF85A1]'
                      : 'text-[#2D2040]'
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
      <View className="border-t border-[#EFE0E8] bg-white px-5 pb-4 pt-3">
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className={`items-center rounded-xl py-3 ${
            submitting ? 'bg-gray-200' : 'bg-[#FF85A1]'
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
            <Text className="mb-4 text-lg font-semibold text-[#2D2040]">
              새 공급업체
            </Text>

            <Text className="mb-1 text-sm text-gray-500">업체명</Text>
            <TextInput
              value={supplierName}
              onChangeText={setSupplierName}
              placeholder="예: 한국유제품"
              placeholderTextColor="#A0A8B3"
              className="mb-3 rounded-xl border border-[#EFE0E8] px-4 py-3 text-base text-[#2D2040]"
            />

            <Text className="mb-1 text-sm text-gray-500">연락처 (선택)</Text>
            <TextInput
              value={supplierContact}
              onChangeText={setSupplierContact}
              placeholder="010-0000-0000"
              placeholderTextColor="#A0A8B3"
              className="mb-3 rounded-xl border border-[#EFE0E8] px-4 py-3 text-base text-[#2D2040]"
            />

            <Text className="mb-1 text-sm text-gray-500">메모 (선택)</Text>
            <TextInput
              value={supplierMemo}
              onChangeText={setSupplierMemo}
              placeholder="메모"
              placeholderTextColor="#A0A8B3"
              multiline
              textAlignVertical="top"
              className="mb-5 min-h-[60px] rounded-xl border border-[#EFE0E8] px-4 py-3 text-base text-[#2D2040]"
            />

            <View className="flex-row" style={{ gap: 12 }}>
              <Pressable
                onPress={() => setSupplierModalOpen(false)}
                className="flex-1 items-center rounded-xl border border-[#EFE0E8] py-3"
              >
                <Text className="text-base text-gray-700">취소</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateSupplier}
                disabled={supplierSubmitting}
                className={`flex-1 items-center rounded-xl py-3 ${
                  supplierSubmitting ? 'bg-gray-200' : 'bg-[#FF85A1]'
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
