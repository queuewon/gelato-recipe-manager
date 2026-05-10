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
import { ColorPicker } from '../../../../components/common/ColorPicker'
import {
  DEFAULT_LABEL_COLOR_KEY,
  getLabelColor,
} from '../../../../constants/colors'
import { useCategoryStore } from '../../../../store/categoryStore'

export default function IngredientCategoriesScreen(): JSX.Element {
  const router = useRouter()

  const ingredientCategoryLabels = useCategoryStore(
    (s) => s.ingredientCategoryLabels,
  )
  const loadCategories = useCategoryStore((s) => s.loadCategories)
  const addIngredientCategory = useCategoryStore((s) => s.addIngredientCategory)
  const deleteIngredientCategory = useCategoryStore(
    (s) => s.deleteIngredientCategory,
  )
  const updateIngredientCategoryColor = useCategoryStore(
    (s) => s.updateIngredientCategoryColor,
  )

  const [newCat, setNewCat] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_LABEL_COLOR_KEY)
  const [editingName, setEditingName] = useState<string | null>(null)

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const handleAdd = async (): Promise<void> => {
    const trimmed = newCat.trim()
    if (!trimmed) return
    try {
      await addIngredientCategory(trimmed, newColor)
      setNewCat('')
      setNewColor(DEFAULT_LABEL_COLOR_KEY)
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
          void deleteIngredientCategory(name).catch((e) => {
            Alert.alert('삭제 실패', e instanceof Error ? e.message : String(e))
          })
        },
      },
    ])
  }

  const handleColorChange = async (
    name: string,
    color: string,
  ): Promise<void> => {
    try {
      await updateIngredientCategoryColor(name, color)
    } catch (e) {
      Alert.alert('색상 변경 실패', e instanceof Error ? e.message : String(e))
    }
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
          재료 카테고리
        </Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4 rounded-xl border border-gray-200 bg-white">
          {ingredientCategoryLabels.length === 0 ? (
            <View className="px-4 py-4">
              <Text className="text-sm text-gray-400">
                카테고리가 없어요. 아래에서 추가해보세요.
              </Text>
            </View>
          ) : (
            ingredientCategoryLabels.map((cat, idx) => {
              const color = getLabelColor(cat.color)
              const isEditing = editingName === cat.name
              return (
                <View
                  key={cat.name}
                  className={
                    idx < ingredientCategoryLabels.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }
                >
                  <View className="flex-row items-center justify-between px-4 py-3">
                    <Pressable
                      className="flex-1 flex-row items-center"
                      onPress={() =>
                        setEditingName(isEditing ? null : cat.name)
                      }
                    >
                      <View
                        style={{
                          backgroundColor: color.bg,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{ color: color.text, fontSize: 12, fontWeight: '600' }}
                        >
                          {cat.name}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-400">
                        {isEditing ? '닫기' : '색상 변경'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(cat.name)}
                      hitSlop={12}
                      className="rounded-full bg-red-50 px-3 py-1"
                    >
                      <Text className="text-sm text-red-400">삭제</Text>
                    </Pressable>
                  </View>
                  {isEditing && (
                    <View className="px-4 pb-3">
                      <ColorPicker
                        value={cat.color}
                        onChange={(c) => {
                          void handleColorChange(cat.name, c)
                        }}
                      />
                    </View>
                  )}
                </View>
              )
            })
          )}
        </View>

        <View className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
          <Text className="mb-2 text-sm font-medium text-gray-700">
            새 카테고리
          </Text>
          <TextInput
            value={newCat}
            onChangeText={setNewCat}
            placeholder="카테고리 이름"
            placeholderTextColor="#9CA3AF"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
          />
          <Text className="mb-2 mt-3 text-xs text-gray-500">색상</Text>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Pressable
            onPress={handleAdd}
            disabled={!newCat.trim()}
            className={`mt-4 items-center justify-center rounded-xl py-3 ${
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
