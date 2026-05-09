import { useRouter } from 'expo-router'
import { type JSX } from 'react'
import { Pressable, Text, View } from 'react-native'

export default function CategoriesIndex(): JSX.Element {
  const router = useRouter()

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">카테고리 관리</Text>
        <View style={{ width: 72 }} />
      </View>

      <View className="px-5 pt-4" style={{ gap: 12 }}>
        <Pressable
          onPress={() => router.push('/settings/categories/recipes')}
          className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <Text className="text-base text-gray-900">레시피 카테고리</Text>
          <Text className="text-lg text-gray-400">›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings/categories/ingredients')}
          className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <Text className="text-base text-gray-900">재료 카테고리</Text>
          <Text className="text-lg text-gray-400">›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings/categories/units')}
          className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <Text className="text-base text-gray-900">포장 단위</Text>
          <Text className="text-lg text-gray-400">›</Text>
        </Pressable>
      </View>
    </View>
  )
}
