import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Badge } from '../../../components/common/Badge'
import { EmptyState } from '../../../components/common/EmptyState'
import { FilterChip } from '../../../components/common/FilterChip'
import { SearchBar } from '../../../components/common/SearchBar'
import { PASTEL_THEMES } from '../../../constants/colors'
import { useCategoryStore } from '../../../store/categoryStore'
import { useRecipeStore } from '../../../store/recipeStore'

const THEME = PASTEL_THEMES.pink

export default function RecipesIndex(): JSX.Element {
  const router = useRouter()
  const recipes = useRecipeStore((s) => s.recipes)
  const ingredientCounts = useRecipeStore((s) => s.ingredientCounts)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)

  const recipeCategories = useCategoryStore((s) => s.recipeCategories)
  const loadCategories = useCategoryStore((s) => s.loadCategories)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('전체')

  useEffect(() => {
    void loadRecipes()
    void loadCategories()
  }, [loadRecipes, loadCategories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return recipes.filter((r) => {
      if (filter !== '전체' && r.base_category !== filter) return false
      if (q && !r.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [recipes, filter, search])

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: THEME.deep }}>
            레시피
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">
            등록된 젤라또를 한눈에
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/recipes/new')}
          style={{
            height: 44,
            width: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: THEME.deep,
            shadowColor: THEME.deep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>
            +
          </Text>
        </Pressable>
      </View>

      <View className="px-5 py-3">
        <SearchBar
          placeholder="레시피 검색"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={['전체', ...recipeCategories]}
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
            title="레시피가 없어요"
            subtitle="+ 버튼으로 추가해보세요"
          />
        }
        renderItem={({ item }) => {
          const count = ingredientCounts[item.id] ?? 0
          return (
            <Pressable
              onPress={() => router.push(`/recipes/${item.id}`)}
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
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text className="text-base font-bold text-gray-900">
                  {item.name}
                </Text>
                <Text className="mt-1 text-xs text-gray-500">
                  재료 {count}개
                </Text>
              </View>
              <Badge label={item.base_category} category={item.base_category} />
            </Pressable>
          )
        }}
      />
    </View>
  )
}
