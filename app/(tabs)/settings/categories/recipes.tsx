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
  PASTEL_THEMES,
  getLabelColor,
} from '../../../../constants/colors'
import { useCategoryStore } from '../../../../store/categoryStore'

const THEME = PASTEL_THEMES.pink

export default function RecipeCategoriesScreen(): JSX.Element {
  const router = useRouter()

  const recipeCategoryLabels = useCategoryStore((s) => s.recipeCategoryLabels)
  const loadCategories = useCategoryStore((s) => s.loadCategories)
  const addRecipeCategory = useCategoryStore((s) => s.addRecipeCategory)
  const deleteRecipeCategory = useCategoryStore((s) => s.deleteRecipeCategory)
  const updateRecipeCategoryColor = useCategoryStore(
    (s) => s.updateRecipeCategoryColor,
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
      await addRecipeCategory(trimmed, newColor)
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
          void deleteRecipeCategory(name).catch((e) => {
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
      await updateRecipeCategoryColor(name, color)
    } catch (e) {
      Alert.alert('색상 변경 실패', e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
        <Text style={{ color: THEME.deep, fontSize: 17, fontWeight: '700' }}>
          레시피 카테고리
        </Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: THEME.ring,
            shadowColor: THEME.deep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View className="mb-3 flex-row items-center" style={{ gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: THEME.deep,
              }}
            />
            <Text
              style={{ color: THEME.deep, fontSize: 13, fontWeight: '700' }}
            >
              등록된 카테고리
            </Text>
          </View>

          {recipeCategoryLabels.length === 0 ? (
            <View
              style={{
                paddingVertical: 14,
                paddingHorizontal: 12,
                backgroundColor: THEME.softer,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: THEME.deep, opacity: 0.6, fontSize: 13 }}>
                카테고리가 없어요. 아래에서 추가해보세요.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {recipeCategoryLabels.map((cat) => {
                const color = getLabelColor(cat.color)
                const isEditing = editingName === cat.name
                return (
                  <View
                    key={cat.name}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isEditing ? THEME.accent : THEME.ring,
                    }}
                  >
                    <View className="flex-row items-center justify-between px-3 py-3">
                      <Pressable
                        className="flex-1 flex-row items-center"
                        onPress={() =>
                          setEditingName(isEditing ? null : cat.name)
                        }
                        style={{ gap: 10 }}
                      >
                        <View
                          style={{
                            backgroundColor: color.bg,
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                            borderRadius: 999,
                          }}
                        >
                          <Text
                            style={{
                              color: color.text,
                              fontSize: 13,
                              fontWeight: '700',
                            }}
                          >
                            {cat.name}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: THEME.deep,
                            opacity: 0.6,
                            fontSize: 12,
                          }}
                        >
                          {isEditing ? '닫기' : '색상 변경'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(cat.name)}
                        hitSlop={12}
                        style={{
                          backgroundColor: '#FFE4E6',
                          paddingHorizontal: 12,
                          paddingVertical: 5,
                          borderRadius: 999,
                        }}
                      >
                        <Text
                          style={{
                            color: '#BE123C',
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          삭제
                        </Text>
                      </Pressable>
                    </View>
                    {isEditing && (
                      <View className="px-3 pb-3">
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
              })}
            </View>
          )}
        </View>

        <View
          style={{
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
          <View className="mb-3 flex-row items-center" style={{ gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: THEME.accent,
              }}
            />
            <Text
              style={{ color: THEME.deep, fontSize: 13, fontWeight: '700' }}
            >
              새 카테고리
            </Text>
          </View>
          <TextInput
            value={newCat}
            onChangeText={setNewCat}
            placeholder="카테고리 이름"
            placeholderTextColor="#C9A6B8"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            style={{
              backgroundColor: THEME.softer,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              color: '#1A1A2E',
              borderWidth: 1,
              borderColor: THEME.ring,
            }}
          />
          <Text
            style={{
              color: THEME.deep,
              opacity: 0.7,
              fontSize: 12,
              marginTop: 14,
              marginBottom: 10,
              fontWeight: '600',
            }}
          >
            라벨 색상
          </Text>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Pressable
            onPress={handleAdd}
            disabled={!newCat.trim()}
            style={{
              marginTop: 18,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              backgroundColor: newCat.trim() ? THEME.deep : THEME.ring,
              shadowColor: THEME.deep,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: newCat.trim() ? 0.25 : 0,
              shadowRadius: 6,
              elevation: newCat.trim() ? 2 : 0,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: 15,
              }}
            >
              추가하기
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
