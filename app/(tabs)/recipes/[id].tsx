import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Badge } from '../../../components/common/Badge'
import { EmptyState } from '../../../components/common/EmptyState'
import { PASTEL_THEMES } from '../../../constants/colors'
import { useRecipeStore } from '../../../store/recipeStore'
import { scaleAmount } from '../../../utils/batchScaler'
import { calcBatchCost, calcTotalCost } from '../../../utils/costCalculator'

const THEME = PASTEL_THEMES.pink
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
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe)

  const handleDelete = (): void => {
    Alert.alert('레시피 삭제', '이 레시피를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteRecipe(recipeId)
              router.replace('/recipes')
            } catch (e) {
              Alert.alert('삭제 실패', e instanceof Error ? e.message : String(e))
            }
          })()
        },
      },
    ])
  }

  const [batchSize, setBatchSize] = useState<number>(0)
  const initializedForIdRef = useRef<number | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (Number.isFinite(recipeId)) {
        void loadRecipeById(recipeId)
        void loadVersions(recipeId)
      }
    }, [recipeId, loadRecipeById, loadVersions]),
  )

  useEffect(() => {
    if (!selectedRecipe || selectedRecipe.id !== recipeId) return
    if (initializedForIdRef.current === recipeId) return
    setBatchSize(selectedRecipe.batch_size)
    initializedForIdRef.current = recipeId
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

  if (!selectedRecipe || selectedRecipe.id !== recipeId) {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator color={THEME.deep} />
        </View>
      )
    }
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
        <View className="flex-row" style={{ gap: 8 }}>
          <Pressable
            onPress={handleDelete}
            style={{
              backgroundColor: '#FFE4E6',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: '#BE123C', fontWeight: '700', fontSize: 13 }}>
              삭제
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/recipes/edit/${recipeId}`)}
            style={{
              backgroundColor: THEME.soft,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: THEME.deep, fontWeight: '700', fontSize: 13 }}>
              수정
            </Text>
          </Pressable>
        </View>
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
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: THEME.ring,
          shadowColor: THEME.deep,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          배치량 조절 (g)
        </Text>
        <View className="mt-3 flex-row items-center justify-center">
          <Pressable
            onPress={() => setBatchSize((p) => Math.max(MIN_BATCH, p - STEP))}
            style={{
              height: 44,
              width: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: THEME.soft,
            }}
          >
            <Text style={{ color: THEME.deep, fontSize: 22, fontWeight: '700' }}>
              −
            </Text>
          </Pressable>
          <Text
            style={{
              marginHorizontal: 28,
              fontSize: 26,
              fontWeight: '800',
              color: THEME.deep,
            }}
          >
            {batchSize.toLocaleString()}
          </Text>
          <Pressable
            onPress={() => setBatchSize((p) => p + STEP)}
            style={{
              height: 44,
              width: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: THEME.soft,
            }}
          >
            <Text style={{ color: THEME.deep, fontSize: 22, fontWeight: '700' }}>
              +
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Ingredients Table */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: THEME.ring,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: THEME.softer,
            borderBottomWidth: 1,
            borderBottomColor: THEME.ring,
          }}
        >
          <Text className="flex-1 text-xs font-semibold text-gray-600">
            재료명
          </Text>
          <Text className="text-xs font-semibold text-gray-600">사용량(g)</Text>
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
              <Text className="text-sm font-bold text-gray-900">
                {Math.round(scaled).toLocaleString()}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Total Cost */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 24,
          backgroundColor: PASTEL_THEMES.yellow.softer,
          borderRadius: 20,
          paddingHorizontal: 18,
          paddingVertical: 16,
          borderWidth: 1,
          borderColor: PASTEL_THEMES.yellow.ring,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: PASTEL_THEMES.yellow.deep }}>
          총 원가
        </Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#EF4444' }}>
          {Math.round(scaledTotalCost).toLocaleString()}원
        </Text>
      </View>

      {/* Versions Preview */}
      <View className="mx-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: THEME.deep,
              }}
            />
            <Text className="text-base font-bold text-gray-900">수정이력</Text>
          </View>
          <Pressable onPress={() => router.push(`/recipes/history/${recipeId}`)}>
            <Text style={{ color: THEME.deep, fontWeight: '600', fontSize: 13 }}>
              전체 보기
            </Text>
          </Pressable>
        </View>
        {versions.length === 0 ? (
          <Text className="mt-3 text-sm text-gray-500">
            기록된 이력이 없어요
          </Text>
        ) : (
          <View
            style={{
              marginTop: 12,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: THEME.ring,
              overflow: 'hidden',
            }}
          >
            {versions.slice(0, 3).map((v, i, arr) => {
              const isLast = i === arr.length - 1
              return (
                <View
                  key={v.id}
                  className={`flex-row items-center justify-between px-4 py-3 ${
                    isLast ? '' : 'border-b border-gray-100'
                  }`}
                >
                  <Text className="text-sm font-bold text-gray-800">
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
