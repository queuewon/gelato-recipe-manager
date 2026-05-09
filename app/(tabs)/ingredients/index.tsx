import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { EmptyState } from '../../../components/common/EmptyState'
import { FilterChip } from '../../../components/common/FilterChip'
import { SearchBar } from '../../../components/common/SearchBar'
import { useCategoryStore } from '../../../store/categoryStore'
import { useIngredientStore } from '../../../store/ingredientStore'

export default function IngredientsIndex(): JSX.Element {
  const router = useRouter()
  const ingredients = useIngredientStore((s) => s.ingredients)
  const suppliers = useIngredientStore((s) => s.suppliers)
  const loadIngredients = useIngredientStore((s) => s.loadIngredients)
  const loadSuppliers = useIngredientStore((s) => s.loadSuppliers)

  const ingredientCategories = useCategoryStore((s) => s.ingredientCategories)
  const loadCategories = useCategoryStore((s) => s.loadCategories)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('전체')

  useEffect(() => {
    void loadIngredients()
    void loadSuppliers()
    void loadCategories()
  }, [loadIngredients, loadSuppliers, loadCategories])

  const supplierNameMap = useMemo(
    () => new Map<number, string>(suppliers.map((s) => [s.id, s.name])),
    [suppliers],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ingredients.filter((ing) => {
      if (filter !== '전체' && ing.category !== filter) return false
      if (q && !ing.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [ingredients, filter, search])

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Text className="text-2xl font-bold text-gray-900">재료 관리</Text>
        <Pressable
          onPress={() => router.push('/ingredients/new')}
          className="rounded-full bg-[#1E90FF] px-3 py-2"
        >
          <Text className="text-sm font-semibold text-white">재료 등록</Text>
        </Pressable>
      </View>

      <View className="px-5 py-3">
        <SearchBar
          placeholder="재료 검색"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={['전체', ...ingredientCategories]}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        renderItem={({ item }) => (
          <FilterChip
            label={item}
            isActive={filter === item}
            onPress={() => setFilter(item)}
          />
        )}
        keyExtractor={(item) => item}
        className="flex-grow-0"
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            title="재료가 없어요"
            subtitle="재료 등록 버튼으로 추가해보세요"
          />
        }
        renderItem={({ item }) => {
          const pricePerKg = item.price_per_g * 1000
          const supplierName =
            item.supplier_id !== undefined && item.supplier_id !== null
              ? (supplierNameMap.get(item.supplier_id) ?? null)
              : null
          return (
            <Pressable
              onPress={() => router.push(`/ingredients/${item.id}`)}
              className="flex-row items-center rounded-xl border border-gray-200 bg-white p-4"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  {item.name}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <Text className="text-sm text-gray-700">
                    현재가 {Math.round(pricePerKg).toLocaleString()}원/1000g
                  </Text>
                  <Pressable
                    onPress={() => router.push(`/ingredients/${item.id}`)}
                    className="ml-2 rounded-full bg-[#E8F4FF] px-2 py-0.5"
                  >
                    <Text className="text-xs font-medium text-[#1E90FF]">
                      수정
                    </Text>
                  </Pressable>
                </View>
                <Text className="mt-1 text-xs text-gray-500">기준: 1000g</Text>
                <Text className="text-xs text-gray-500">
                  재고: {item.stock_count.toLocaleString()}
                  {item.stock_unit}
                </Text>
                {supplierName ? (
                  <Text className="text-xs text-gray-500">
                    공급업체: {supplierName}
                  </Text>
                ) : null}
              </View>
              <Text className="ml-2 text-xl text-gray-400">›</Text>
            </Pressable>
          )
        }}
      />
    </View>
  )
}
