import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState, type JSX } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Badge } from '../../../components/common/Badge'
import { EmptyState } from '../../../components/common/EmptyState'
import { useRecipeStore } from '../../../store/recipeStore'
import { scaleAmount } from '../../../utils/batchScaler'
import { calcBatchCost, calcTotalCost } from '../../../utils/costCalculator'

const STEP = 500
const MIN_BATCH = 500

export default function RecipeDetail(): JSX.Element {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const recipeId = Number(id)

  const selectedRecipe = useRecipeStore((s) => s.selectedRecipe)
  const versions = useRecipeStore((s) => s.versions)
  const isLoading = useRecipeStore((s) => s.isLoading)
  const loadRecipeById = useRecipeStore((s) => s.loadRecipeById)
  const loadVersions = useRecipeStore((s) => s.loadVersions)

  const [batchSize, setBatchSize] = useState<number>(0)

  useEffect(() => {
    if (Number.isFinite(recipeId)) {
      void loadRecipeById(recipeId)
      void loadVersions(recipeId)
    }
  }, [recipeId, loadRecipeById, loadVersions])

  useEffect(() => {
    if (selectedRecipe && selectedRecipe.id === recipeId) {
      setBatchSize(selectedRecipe.batch_size)
    }
  }, [selectedRecipe, recipeId])

  const baseBatch = selectedRecipe?.batch_size ?? 0
  const baseTotalCost = useMemo(() => {
    if (!selectedRecipe) return 0
    return calcTotalCost(selectedRecipe.ingredients)
  }, [selectedRecipe])
  const scaledTotalCost = useMemo(() => {
    if (!selectedRecipe || baseBatch === 0) return 0
    return calcBatchCost(baseTotalCost, baseBatch, batchSize)
  }, [baseTotalCost, baseBatch, batchSize, selectedRecipe])

  if (isLoading && !selectedRecipe) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    )
  }

  if (!selectedRecipe || selectedRecipe.id !== recipeId) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
          <Pressable onPress={() => router.back()}>
            <Text className="text-base text-gray-700">← 뒤로가기</Text>
          </Pressable>
        </View>
        <EmptyState
          title="레시피를 찾을 수 없어요"
          subtitle="목록으로 돌아가 다시 선택해주세요"
        />
      </View>
    )
  }

  const ingredientCount = selectedRecipe.ingredients.length

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Top Nav */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/recipes/edit/${recipeId}`)}
          className="rounded-full bg-[#E8F4FF] px-4 py-2"
        >
          <Text className="text-sm font-medium text-[#1E90FF]">수정</Text>
        </Pressable>
      </View>

      {/* Recipe Header */}
      <View className="px-5 py-5">
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 pr-3 text-2xl font-bold text-gray-900">
            {selectedRecipe.name}
          </Text>
          <Badge
            label={selectedRecipe.base_category}
            category={selectedRecipe.base_category}
          />
        </View>
        <Text className="mt-2 text-sm text-gray-500">
          재료 {ingredientCount}개
        </Text>
      </View>

      {/* Batch Size Adjuster */}
      <View className="mx-5 mb-5 rounded-2xl border border-gray-200 p-4">
        <Text className="text-sm text-gray-500">배치량 조절 (g)</Text>
        <View className="mt-3 flex-row items-center justify-center">
          <Pressable
            onPress={() =>
              setBatchSize((p) => Math.max(MIN_BATCH, p - STEP))
            }
            className="h-10 w-10 items-center justify-center rounded-full bg-[#E8F4FF]"
          >
            <Text className="text-xl font-bold text-[#1E90FF]">−</Text>
          </Pressable>
          <Text className="mx-6 text-2xl font-bold text-gray-900">
            {batchSize.toLocaleString()}
          </Text>
          <Pressable
            onPress={() => setBatchSize((p) => p + STEP)}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#E8F4FF]"
          >
            <Text className="text-xl font-bold text-[#1E90FF]">＋</Text>
          </Pressable>
        </View>
      </View>

      {/* Ingredients Table */}
      <View className="mx-5 mb-5 overflow-hidden rounded-2xl border border-gray-200">
        <View className="flex-row border-b border-gray-200 bg-gray-50 px-4 py-3">
          <Text className="flex-1 text-xs font-semibold text-gray-500">
            재료명
          </Text>
          <Text className="text-xs font-semibold text-gray-500">사용량(g)</Text>
        </View>
        {selectedRecipe.ingredients.map((ri, i, arr) => {
          const scaled = scaleAmount(ri.amount, baseBatch, batchSize)
          const isLast = i === arr.length - 1
          return (
            <View
              key={ri.id}
              className={`flex-row items-center px-4 py-3 ${
                isLast ? '' : 'border-b border-gray-100'
              }`}
            >
              <Text className="flex-1 text-sm text-gray-800">
                {ri.ingredient.name}
              </Text>
              <Text className="text-sm font-medium text-gray-900">
                {Math.round(scaled).toLocaleString()}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Total Cost */}
      <View className="mx-5 mb-6 flex-row items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
        <Text className="text-sm font-medium text-gray-700">총 원가</Text>
        <Text className="text-lg font-bold text-[#EF4444]">
          {Math.round(scaledTotalCost).toLocaleString()}원
        </Text>
      </View>

      {/* Versions Preview */}
      <View className="mx-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">수정이력</Text>
          <Pressable
            onPress={() => router.push(`/recipes/history/${recipeId}`)}
          >
            <Text className="text-sm text-[#1E90FF]">전체 보기</Text>
          </Pressable>
        </View>
        {versions.length === 0 ? (
          <Text className="mt-3 text-sm text-gray-500">
            기록된 이력이 없어요
          </Text>
        ) : (
          <View className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
            {versions.slice(0, 3).map((v, i, arr) => {
              const isLast = i === arr.length - 1
              return (
                <View
                  key={v.id}
                  className={`flex-row items-center justify-between px-4 py-3 ${
                    isLast ? '' : 'border-b border-gray-100'
                  }`}
                >
                  <Text className="text-sm font-medium text-gray-800">
                    v{v.version_no}
                  </Text>
                  <Text className="text-xs text-gray-500">{v.created_at}</Text>
                </View>
              )
            })}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
