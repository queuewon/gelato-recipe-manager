import { useRouter } from 'expo-router'
import type { JSX } from 'react'
import { Pressable, Text, View } from 'react-native'
import {
  RecipeForm,
  type RecipeFormValues,
} from '../../../components/recipe/RecipeForm'
import { useRecipeStore } from '../../../store/recipeStore'

export default function RecipeNew(): JSX.Element {
  const router = useRouter()
  const createRecipe = useRecipeStore((s) => s.createRecipe)

  const handleSubmit = async (values: RecipeFormValues): Promise<void> => {
    const newId = await createRecipe(
      {
        name: values.name,
        base_category: values.base_category,
        batch_size: values.batch_size,
        memo: values.memo,
        is_deleted: 0,
      },
      values.ingredients,
    )
    router.replace(`/recipes/${newId}`)
  }

  return (
    <View className="flex-1 bg-[#FFF9FB]">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">레시피 등록</Text>
        <View style={{ width: 60 }} />
      </View>
      <RecipeForm onSubmit={handleSubmit} submitLabel="등록" />
    </View>
  )
}
