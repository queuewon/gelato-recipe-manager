import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Badge } from '../../../components/common/Badge'
import { EmptyState } from '../../../components/common/EmptyState'
import { FilterChip } from '../../../components/common/FilterChip'
import { SearchBar } from '../../../components/common/SearchBar'
import { BASE_CATEGORIES } from '../../../constants/categories'
import { useRecipeStore } from '../../../store/recipeStore'
import type { BaseCategory } from '../../../types'

type FilterValue = '전체' | BaseCategory

const FILTERS: FilterValue[] = ['전체', ...BASE_CATEGORIES]

export default function RecipesIndex(): JSX.Element {
  const router = useRouter()
  const recipes = useRecipeStore((s) => s.recipes)
  const ingredientCounts = useRecipeStore((s) => s.ingredientCounts)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterValue>('전체')

  useEffect(() => {
    void loadRecipes()
  }, [loadRecipes])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return recipes.filter((r) => {
      if (filter !== '전체' && r.base_category !== filter) return false
      if (q && !r.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [recipes, filter, search])

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Text className="text-2xl font-bold text-gray-900">레시피</Text>
        <Pressable
          onPress={() => router.push('/recipes/new')}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#1E90FF]"
        >
          <Text className="text-2xl font-bold leading-6 text-white">+</Text>
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
        data={FILTERS}
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
              className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-gray-900">
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
