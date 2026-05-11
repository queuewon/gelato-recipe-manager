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
import { PASTEL_THEMES } from '../../../constants/colors'
import { useCategoryStore } from '../../../store/categoryStore'
import { useIngredientStore } from '../../../store/ingredientStore'

const THEME = PASTEL_THEMES.yellow

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
  const packageUnits = useCategoryStore((s) => s.packageUnits)
  const addIngredientCategory = useCategoryStore((s) => s.addIngredientCategory)
  const addPackageUnit = useCategoryStore((s) => s.addPackageUnit)
  const deletePackageUnit = useCategoryStore((s) => s.deletePackageUnit)
  const loadCategories = useCategoryStore((s) => s.loadCategories)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [unitG, setUnitG] = useState('')
  const [unitCount, setUnitCount] = useState('1')
  const [stockCount, setStockCount] = useState('')
  const [stockUnit, setStockUnit] = useState<string>('개')
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [addingCat, setAddingCat] = useState(false)
  const [newCatText, setNewCatText] = useState('')
  const [addingCatBusy, setAddingCatBusy] = useState(false)

  const [addingUnit, setAddingUnit] = useState(false)
  const [newUnitText, setNewUnitText] = useState('')
  const [addingUnitBusy, setAddingUnitBusy] = useState(false)
  const [editingUnits, setEditingUnits] = useState(false)

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
    if (editId !== null) return
    if (packageUnits.length === 0) return
    if (!packageUnits.includes(stockUnit)) {
      setStockUnit(packageUnits[0])
    }
  }, [packageUnits, stockUnit, editId])

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
    if (selectedIngredient.stock_unit) {
      setStockUnit(selectedIngredient.stock_unit)
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

  const handleAddUnit = async (): Promise<void> => {
    const trimmed = newUnitText.trim()
    if (!trimmed) return
    setAddingUnitBusy(true)
    try {
      await addPackageUnit(trimmed)
      setStockUnit(trimmed)
      setNewUnitText('')
      setAddingUnit(false)
    } catch (e) {
      Alert.alert('추가 실패', e instanceof Error ? e.message : String(e))
    } finally {
      setAddingUnitBusy(false)
    }
  }

  const handleDeleteUnit = (unit: string): void => {
    Alert.alert('단위 삭제', `'${unit}' 단위를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deletePackageUnit(unit)
              if (stockUnit === unit) {
                const remaining = packageUnits.filter((u) => u !== unit)
                setStockUnit(remaining[0] ?? '')
              }
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
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: THEME.soft,
          opacity: 0.45,
        }}
      />
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: THEME.deep }}>
          {editId !== null ? '재료 수정' : '재료 등록'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <FieldLabel>재료명</FieldLabel>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="예: 우유"
          placeholderTextColor="#C8B074"
          style={{ ...inputStyle, marginBottom: 20 }}
        />

        <FieldLabel>카테고리</FieldLabel>
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
                placeholderTextColor="#C8B074"
                autoFocus
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: THEME.accent,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  fontSize: 13,
                  color: '#1A1A2E',
                  backgroundColor: '#FFF',
                  minWidth: 90,
                }}
              />
              <Pressable
                onPress={handleAddCategory}
                disabled={addingCatBusy || !newCatText.trim()}
                style={{
                  borderRadius: 999,
                  backgroundColor: THEME.deep,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text className="text-sm font-bold text-white">확인</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAddingCat(false)
                  setNewCatText('')
                }}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: '#FFF',
                }}
              >
                <Text className="text-sm text-gray-600">취소</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setAddingCat(true)}
              style={{
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: THEME.accent,
                backgroundColor: '#FFF',
              }}
            >
              <Text style={{ fontSize: 13, color: THEME.deep, fontWeight: '600' }}>
                + 추가
              </Text>
            </Pressable>
          )}
        </ScrollView>

        <FieldLabel>구매 정보</FieldLabel>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: THEME.ring,
            padding: 12,
          }}
        >
          <View className="mb-2 flex-row items-center">
            <Text className="w-20 text-sm text-gray-600">구매가격</Text>
            <TextInput
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="2800"
              placeholderTextColor="#C8B074"
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
              placeholderTextColor="#C8B074"
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
              placeholderTextColor="#C8B074"
              keyboardType="numeric"
              className="flex-1 text-right text-base text-gray-900"
            />
            <Text className="ml-1 text-sm text-gray-500">{stockUnit}</Text>
          </View>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-gray-500">세는 단위</Text>
          <Pressable onPress={() => setEditingUnits((v) => !v)} hitSlop={8}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.deep }}>
              {editingUnits ? '완료' : '편집'}
            </Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          className="mt-1"
        >
          {packageUnits.map((u) => (
            <View key={u} className="flex-row items-center" style={{ gap: 4 }}>
              <FilterChip
                label={u}
                isActive={stockUnit === u}
                onPress={() => setStockUnit(u)}
              />
              {editingUnits ? (
                <Pressable
                  onPress={() => handleDeleteUnit(u)}
                  hitSlop={6}
                  className="h-5 w-5 items-center justify-center rounded-full bg-red-100"
                >
                  <Text className="text-xs font-bold text-red-500">×</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {addingUnit ? (
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <TextInput
                value={newUnitText}
                onChangeText={setNewUnitText}
                placeholder="단위명"
                placeholderTextColor="#C8B074"
                autoFocus
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: THEME.accent,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  fontSize: 13,
                  color: '#1A1A2E',
                  backgroundColor: '#FFF',
                  minWidth: 70,
                }}
              />
              <Pressable
                onPress={handleAddUnit}
                disabled={addingUnitBusy || !newUnitText.trim()}
                style={{
                  borderRadius: 999,
                  backgroundColor: THEME.deep,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text className="text-sm font-bold text-white">확인</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAddingUnit(false)
                  setNewUnitText('')
                }}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: '#FFF',
                }}
              >
                <Text className="text-sm text-gray-600">취소</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setAddingUnit(true)}
              style={{
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: THEME.accent,
                backgroundColor: '#FFF',
              }}
            >
              <Text style={{ fontSize: 13, color: THEME.deep, fontWeight: '600' }}>
                + 추가
              </Text>
            </Pressable>
          )}
        </ScrollView>
        <View className="mb-5 mt-1.5">
          {pricePerG !== null ? (
            <Text style={{ fontSize: 12, color: THEME.deep, fontWeight: '700' }}>
              1g당 {(Math.round(pricePerG * 100) / 100).toLocaleString()}원
            </Text>
          ) : (
            <Text className="text-xs text-gray-400">
              구매 정보를 입력하면 1g당 가격이 표시돼요
            </Text>
          )}
        </View>

        <FieldLabel>재고</FieldLabel>
        <View
          style={{
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: THEME.ring,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <TextInput
            value={stockCount}
            onChangeText={setStockCount}
            placeholder="0"
            placeholderTextColor="#C8B074"
            keyboardType="numeric"
            className="flex-1 text-base text-gray-900"
          />
          <Text className="ml-1 text-sm text-gray-500">{stockUnit}</Text>
        </View>

        <View className="mb-2 flex-row items-center justify-between">
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: THEME.deep,
              letterSpacing: 0.4,
            }}
          >
            공급업체
          </Text>
          <Pressable
            onPress={() => setSupplierModalOpen(true)}
            style={{
              backgroundColor: THEME.soft,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: THEME.deep, fontSize: 12, fontWeight: '700' }}>
              + 새 공급업체
            </Text>
          </Pressable>
        </View>
        {suppliers.length === 0 ? (
          <View
            style={{
              borderRadius: 14,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: THEME.ring,
              padding: 16,
              alignItems: 'center',
            }}
          >
            <Text className="text-sm text-gray-500">
              등록된 공급업체가 없어요
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {suppliers.map((s) => {
              const active = supplierId === s.id
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setSupplierId(s.id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? THEME.accent : '#E5E7EB',
                    backgroundColor: active ? THEME.softer : '#FFF',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: active ? '700' : '500',
                      color: active ? THEME.deep : '#1A1A2E',
                    }}
                  >
                    {s.name}
                  </Text>
                  {s.contact ? (
                    <Text className="mt-0.5 text-xs text-gray-500">
                      {s.contact}
                    </Text>
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        )}
      </ScrollView>

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
            {submitting ? '저장 중...' : '저장'}
          </Text>
        </Pressable>
      </View>

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
            <Text
              style={{
                marginBottom: 16,
                fontSize: 17,
                fontWeight: '700',
                color: THEME.deep,
              }}
            >
              새 공급업체
            </Text>

            <Text className="mb-1 text-sm text-gray-500">업체명</Text>
            <TextInput
              value={supplierName}
              onChangeText={setSupplierName}
              placeholder="예: 한국유제품"
              placeholderTextColor="#C8B074"
              style={{ ...inputStyle, marginBottom: 12 }}
            />

            <Text className="mb-1 text-sm text-gray-500">연락처 (선택)</Text>
            <TextInput
              value={supplierContact}
              onChangeText={setSupplierContact}
              placeholder="010-0000-0000"
              placeholderTextColor="#C8B074"
              style={{ ...inputStyle, marginBottom: 12 }}
            />

            <Text className="mb-1 text-sm text-gray-500">메모 (선택)</Text>
            <TextInput
              value={supplierMemo}
              onChangeText={setSupplierMemo}
              placeholder="메모"
              placeholderTextColor="#C8B074"
              multiline
              textAlignVertical="top"
              style={{ ...inputStyle, marginBottom: 20, minHeight: 70 }}
            />

            <View className="flex-row" style={{ gap: 12 }}>
              <Pressable
                onPress={() => setSupplierModalOpen(false)}
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
                onPress={handleCreateSupplier}
                disabled={supplierSubmitting}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: supplierSubmitting ? '#E5E7EB' : THEME.deep,
                }}
              >
                <Text className="text-base font-bold text-white">
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
