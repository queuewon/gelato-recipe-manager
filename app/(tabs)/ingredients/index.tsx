import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Badge } from '../../../components/common/Badge'
import { EmptyState } from '../../../components/common/EmptyState'
import { FilterChip } from '../../../components/common/FilterChip'
import { SearchBar } from '../../../components/common/SearchBar'
import { PASTEL_THEMES } from '../../../constants/colors'
import { useCategoryStore } from '../../../store/categoryStore'
import { useIngredientStore } from '../../../store/ingredientStore'

const THEME = PASTEL_THEMES.yellow

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
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: THEME.deep }}>
            재료 관리
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">
            가격과 재고 한눈에
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/ingredients/new')}
          style={{
            backgroundColor: THEME.deep,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 999,
            shadowColor: THEME.deep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Text className="text-sm font-bold text-white">+ 재료 등록</Text>
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
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: THEME.ring,
                shadowColor: THEME.deep,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text className="text-base font-bold text-gray-900">
                  {item.name}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <Text className="text-sm text-gray-700">
                    현재가 {Math.round(pricePerKg).toLocaleString()}원/1000g
                  </Text>
                  <Pressable
                    onPress={() => router.push(`/ingredients/${item.id}`)}
                    style={{
                      marginLeft: 8,
                      backgroundColor: THEME.soft,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: THEME.deep,
                      }}
                    >
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
              <Badge label={item.category} category={item.category} />
            </Pressable>
          )
        }}
      />
    </View>
  )
}
