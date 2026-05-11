import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { EmptyState } from '../../../../components/common/EmptyState'
import { PASTEL_THEMES } from '../../../../constants/colors'
import { useIngredientStore } from '../../../../store/ingredientStore'
import { useRecipeStore } from '../../../../store/recipeStore'
import type { BaseCategory, RecipeVersion } from '../../../../types'

const THEME = PASTEL_THEMES.pink

interface Snapshot {
  name: string
  base_category: BaseCategory
  batch_size: number
  memo?: string
  ingredients: { ingredient_id: number; amount: number }[]
}

interface DiffItem {
  field: string
  before: string
  after: string
}

function parseSnapshot(v: RecipeVersion): Snapshot | null {
  try {
    return JSON.parse(v.snapshot_json) as Snapshot
  } catch {
    return null
  }
}

function computeDiff(
  current: Snapshot,
  prev: Snapshot,
  nameMap: Map<number, string>,
): DiffItem[] {
  const out: DiffItem[] = []

  if (current.name !== prev.name) {
    out.push({ field: '레시피명', before: prev.name, after: current.name })
  }
  if (current.base_category !== prev.base_category) {
    out.push({
      field: '카테고리',
      before: prev.base_category,
      after: current.base_category,
    })
  }
  if (current.batch_size !== prev.batch_size) {
    out.push({
      field: '기본 배치량',
      before: `${prev.batch_size.toLocaleString()}g`,
      after: `${current.batch_size.toLocaleString()}g`,
    })
  }
  if ((current.memo ?? '') !== (prev.memo ?? '')) {
    out.push({
      field: '메모',
      before: prev.memo ?? '(없음)',
      after: current.memo ?? '(없음)',
    })
  }

  const prevMap = new Map(
    prev.ingredients.map((i) => [i.ingredient_id, i.amount]),
  )
  const curMap = new Map(
    current.ingredients.map((i) => [i.ingredient_id, i.amount]),
  )
  const allIds = new Set([...prevMap.keys(), ...curMap.keys()])
  for (const ingId of allIds) {
    const p = prevMap.get(ingId)
    const c = curMap.get(ingId)
    const name = nameMap.get(ingId) ?? `재료 #${ingId}`
    if (p === undefined && c !== undefined) {
      out.push({
        field: `${name} (추가)`,
        before: '-',
        after: `${c.toLocaleString()}g`,
      })
    } else if (p !== undefined && c === undefined) {
      out.push({
        field: `${name} (삭제)`,
        before: `${p.toLocaleString()}g`,
        after: '-',
      })
    } else if (p !== undefined && c !== undefined && p !== c) {
      out.push({
        field: name,
        before: `${p.toLocaleString()}g`,
        after: `${c.toLocaleString()}g`,
      })
    }
  }

  return out
}

export default function RecipeHistory(): JSX.Element {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const recipeId = Number(id)

  const selectedRecipe = useRecipeStore((s) => s.selectedRecipe)
  const versions = useRecipeStore((s) => s.versions)
  const loadRecipeById = useRecipeStore((s) => s.loadRecipeById)
  const loadVersions = useRecipeStore((s) => s.loadVersions)
  const restoreVersion = useRecipeStore((s) => s.restoreVersion)

  const ingredients = useIngredientStore((s) => s.ingredients)
  const loadIngredients = useIngredientStore((s) => s.loadIngredients)

  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    if (Number.isFinite(recipeId)) {
      void loadRecipeById(recipeId)
      void loadVersions(recipeId)
      void loadIngredients()
    }
  }, [recipeId, loadRecipeById, loadVersions, loadIngredients])

  const ingredientNameMap = useMemo(
    () => new Map<number, string>(ingredients.map((i) => [i.id, i.name])),
    [ingredients],
  )

  const handleRestore = (versionId: number): void => {
    Alert.alert(
      '복원하시겠어요?',
      '이 버전으로 레시피를 되돌립니다',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await restoreVersion(versionId, recipeId)
                router.replace(`/recipes/${recipeId}`)
              } catch (e) {
                Alert.alert(
                  '복원 실패',
                  e instanceof Error ? e.message : String(e),
                )
              }
            })()
          },
        },
      ],
    )
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
      </View>

      <View className="px-5 pb-4">
        <Text style={{ fontSize: 24, fontWeight: '800', color: THEME.deep }}>
          수정 이력
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          {selectedRecipe?.name ?? ''}
        </Text>
      </View>

      {versions.length === 0 ? (
        <EmptyState
          title="이력이 없어요"
          subtitle="레시피를 수정하면 여기에 기록됩니다"
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
          {versions.map((v, i, arr) => {
            const isCurrent = i === 0
            const expanded = expandedId === v.id
            const cur = parseSnapshot(v)
            const prev = i + 1 < arr.length ? parseSnapshot(arr[i + 1]) : null
            const diffs =
              cur && prev ? computeDiff(cur, prev, ingredientNameMap) : []

            return (
              <View
                key={v.id}
                style={{
                  marginBottom: 12,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: THEME.ring,
                  overflow: 'hidden',
                  shadowColor: THEME.deep,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => setExpandedId(expanded ? null : v.id)}
                    className="flex-1 px-4 py-4"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-base font-bold text-gray-900">
                        v{v.version_no}
                      </Text>
                      {isCurrent ? (
                        <View
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
                              color: THEME.deep,
                              fontSize: 11,
                              fontWeight: '700',
                            }}
                          >
                            현재
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="mt-1 text-xs text-gray-500">
                      {v.created_at}
                    </Text>
                  </Pressable>
                  {!isCurrent ? (
                    <Pressable
                      onPress={() => handleRestore(v.id)}
                      style={{
                        marginRight: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: THEME.accent,
                      }}
                    >
                      <Text
                        style={{
                          color: THEME.deep,
                          fontSize: 13,
                          fontWeight: '700',
                        }}
                      >
                        복원
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {expanded ? (
                  <View className="border-t border-gray-100 px-4 py-3">
                    {!cur ? (
                      <Text className="text-sm text-gray-500">
                        스냅샷을 불러올 수 없어요
                      </Text>
                    ) : !prev ? (
                      <Text className="text-sm text-gray-500">
                        초기 등록 — 비교 대상 없음
                      </Text>
                    ) : diffs.length === 0 ? (
                      <Text className="text-sm text-gray-500">
                        변경 사항 없음
                      </Text>
                    ) : (
                      diffs.map((d, j) => (
                        <View key={j} className={j > 0 ? 'mt-2' : ''}>
                          <Text className="text-xs text-gray-500">
                            {d.field}
                          </Text>
                          <View className="mt-0.5 flex-row flex-wrap items-center">
                            <Text className="mr-2 text-sm text-red-500 line-through">
                              {d.before}
                            </Text>
                            <Text className="mr-2 text-gray-400">→</Text>
                            <Text className="text-sm text-green-600">
                              {d.after}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                ) : null}
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}
