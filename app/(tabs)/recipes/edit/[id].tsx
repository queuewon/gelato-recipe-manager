import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, type JSX } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import {
  RecipeForm,
  type RecipeFormValues,
} from '../../../../components/recipe/RecipeForm'
import { PASTEL_THEMES } from '../../../../constants/colors'
import { useRecipeStore } from '../../../../store/recipeStore'

const THEME = PASTEL_THEMES.pink

export default function RecipeEdit(): JSX.Element {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const recipeId = Number(id)

  const selectedRecipe = useRecipeStore((s) => s.selectedRecipe)
  const loadRecipeById = useRecipeStore((s) => s.loadRecipeById)
  const updateRecipe = useRecipeStore((s) => s.updateRecipe)

  useEffect(() => {
    if (Number.isFinite(recipeId)) {
      void loadRecipeById(recipeId)
    }
  }, [recipeId, loadRecipeById])

  const initial = useMemo<RecipeFormValues | undefined>(() => {
    if (!selectedRecipe || selectedRecipe.id !== recipeId) return undefined
    return {
      name: selectedRecipe.name,
      base_category: selectedRecipe.base_category,
      batch_size: selectedRecipe.batch_size,
      memo: selectedRecipe.memo,
      ingredients: selectedRecipe.ingredients.map((ri) => ({
        ingredient_id: ri.ingredient_id,
        amount: ri.amount,
      })),
    }
  }, [selectedRecipe, recipeId])

  const handleSubmit = async (values: RecipeFormValues): Promise<void> => {
    await updateRecipe(
      recipeId,
      {
        name: values.name,
        base_category: values.base_category,
        batch_size: values.batch_size,
        memo: values.memo,
      },
      values.ingredients,
    )
    router.replace(`/recipes/${recipeId}`)
  }

  if (!initial) {
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
        <Text style={{ fontSize: 17, fontWeight: '700', color: THEME.deep }}>
          레시피 수정
        </Text>
        <View style={{ width: 60 }} />
      </View>
      <RecipeForm initial={initial} onSubmit={handleSubmit} submitLabel="저장" />
    </View>
  )
}
