import { useRouter } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useCategoryStore } from '../../../../store/categoryStore'

export default function RecipeCategoriesScreen(): JSX.Element {
  const router = useRouter()

  const recipeCategories = useCategoryStore((s) => s.recipeCategories)
  const loadCategories = useCategoryStore((s) => s.loadCategories)
  const addRecipeCategory = useCategoryStore((s) => s.addRecipeCategory)
  const deleteRecipeCategory = useCategoryStore((s) => s.deleteRecipeCategory)

  const [newCat, setNewCat] = useState('')

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const handleAdd = async (): Promise<void> => {
    const trimmed = newCat.trim()
    if (!trimmed) return
    try {
      await addRecipeCategory(trimmed)
      setNewCat('')
    } catch (e) {
      Alert.alert('추가 실패', e instanceof Error ? e.message : String(e))
    }
  }

  const handleDelete = (name: string): void => {
    Alert.alert('카테고리 삭제', `'${name}' 카테고리를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void deleteRecipeCategory(name).catch((e) => {
            Alert.alert('삭제 실패', e instanceof Error ? e.message : String(e))
          })
        },
      },
    ])
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F8FAFC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">
          레시피 카테고리
        </Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4 rounded-xl border border-gray-200 bg-white">
          {recipeCategories.length === 0 ? (
            <View className="px-4 py-4">
              <Text className="text-sm text-gray-400">
                카테고리가 없어요. 아래에서 추가해보세요.
              </Text>
            </View>
          ) : (
            recipeCategories.map((cat, idx) => (
              <View
                key={cat}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  idx < recipeCategories.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                <Text className="text-base text-gray-900">{cat}</Text>
                <Pressable
                  onPress={() => handleDelete(cat)}
                  hitSlop={12}
                  className="rounded-full bg-red-50 px-3 py-1"
                >
                  <Text className="text-sm text-red-400">삭제</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View className="flex-row" style={{ gap: 8 }}>
          <TextInput
            value={newCat}
            onChangeText={setNewCat}
            placeholder="새 카테고리 이름"
            placeholderTextColor="#9CA3AF"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
          />
          <Pressable
            onPress={handleAdd}
            disabled={!newCat.trim()}
            className={`items-center justify-center rounded-xl px-5 ${
              newCat.trim() ? 'bg-[#1E90FF]' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                newCat.trim() ? 'text-white' : 'text-gray-400'
              }`}
            >
              추가
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
