import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as DocumentPicker from 'expo-document-picker'
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
import { useCategoryStore } from '../../../store/categoryStore'
import { useChecklistStore } from '../../../store/checklistStore'
import { useIngredientStore } from '../../../store/ingredientStore'
import { useRecipeStore } from '../../../store/recipeStore'
import {
  clearAllData,
  exportBackup,
  importBackup,
} from '../../../utils/backup'

const STORE_NAME_KEY = 'gelato.storeName'
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'

async function reloadAllStores(): Promise<void> {
  await Promise.all([
    useRecipeStore.getState().loadRecipes(),
    useIngredientStore.getState().loadIngredients(),
    useIngredientStore.getState().loadSuppliers(),
    useChecklistStore.getState().loadTodayChecklist(),
    useCategoryStore.getState().loadCategories(),
  ])
}

export default function Settings(): JSX.Element {
  const [storeName, setStoreName] = useState('')
  const [storeNameSaved, setStoreNameSaved] = useState('')
  const [busy, setBusy] = useState(false)

  const recipeCategories = useCategoryStore((s) => s.recipeCategories)
  const ingredientCategories = useCategoryStore((s) => s.ingredientCategories)
  const loadCategories = useCategoryStore((s) => s.loadCategories)
  const addRecipeCategory = useCategoryStore((s) => s.addRecipeCategory)
  const addIngredientCategory = useCategoryStore((s) => s.addIngredientCategory)
  const deleteRecipeCategory = useCategoryStore((s) => s.deleteRecipeCategory)
  const deleteIngredientCategory = useCategoryStore((s) => s.deleteIngredientCategory)

  const [newRecipeCat, setNewRecipeCat] = useState('')
  const [newIngCat, setNewIngCat] = useState('')

  useEffect(() => {
    void loadCategories()
    void (async () => {
      try {
        const v = await AsyncStorage.getItem(STORE_NAME_KEY)
        if (v) {
          setStoreName(v)
          setStoreNameSaved(v)
        }
      } catch (e) {
        console.error('[settings] load store name failed:', e)
      }
    })()
  }, [loadCategories])

  const handleSaveStoreName = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORE_NAME_KEY, storeName.trim())
      setStoreNameSaved(storeName.trim())
      Alert.alert('저장됨', '매장 정보가 저장되었어요')
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : String(e))
    }
  }

  const handleAddRecipeCat = async (): Promise<void> => {
    const trimmed = newRecipeCat.trim()
    if (!trimmed) return
    try {
      await addRecipeCategory(trimmed)
      setNewRecipeCat('')
    } catch (e) {
      Alert.alert('추가 실패', e instanceof Error ? e.message : String(e))
    }
  }

  const handleAddIngCat = async (): Promise<void> => {
    const trimmed = newIngCat.trim()
    if (!trimmed) return
    try {
      await addIngredientCategory(trimmed)
      setNewIngCat('')
    } catch (e) {
      Alert.alert('추가 실패', e instanceof Error ? e.message : String(e))
    }
  }

  const handleDeleteRecipeCat = (name: string): void => {
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

  const handleDeleteIngCat = (name: string): void => {
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

  const handleExport = async (): Promise<void> => {
    setBusy(true)
    try {
      await exportBackup()
    } catch (e) {
      Alert.alert('백업 실패', e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async (): Promise<void> => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      })
      if (res.canceled) return
      const fileUri = res.assets[0]?.uri
      if (!fileUri) return
      Alert.alert(
        '복원 확인',
        '현재 데이터가 모두 삭제되고 백업 파일로 대체됩니다. 계속하시겠어요?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '복원',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                setBusy(true)
                try {
                  await importBackup(fileUri)
                  await reloadAllStores()
                  Alert.alert('복원 완료', '백업 파일에서 데이터를 복원했어요')
                } catch (e) {
                  Alert.alert(
                    '복원 실패',
                    e instanceof Error ? e.message : String(e),
                  )
                } finally {
                  setBusy(false)
                }
              })()
            },
          },
        ],
      )
    } catch (e) {
      Alert.alert('파일 선택 실패', e instanceof Error ? e.message : String(e))
    }
  }

  const handleReset = (): void => {
    Alert.alert(
      '데이터 초기화',
      '모든 레시피, 재료, 이력이 삭제됩니다. 계속하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '계속',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '정말 초기화할까요?',
              '되돌릴 수 없어요. 백업을 먼저 하는 것을 권장합니다.',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '초기화',
                  style: 'destructive',
                  onPress: () => {
                    void (async () => {
                      setBusy(true)
                      try {
                        await clearAllData()
                        await reloadAllStores()
                        Alert.alert('초기화 완료')
                      } catch (e) {
                        Alert.alert(
                          '초기화 실패',
                          e instanceof Error ? e.message : String(e),
                        )
                      } finally {
                        setBusy(false)
                      }
                    })()
                  },
                },
              ],
            )
          },
        },
      ],
    )
  }

  const storeNameDirty = storeName.trim() !== storeNameSaved.trim()

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F8FAFC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-5 text-2xl font-bold text-gray-900">설정</Text>

        {/* Store Info */}
        <Section title="매장 정보">
          <Text className="mb-2 text-sm text-gray-500">매장명</Text>
          <TextInput
            value={storeName}
            onChangeText={setStoreName}
            placeholder="예: 누나네 젤라또"
            placeholderTextColor="#9CA3AF"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
          />
          <Pressable
            onPress={handleSaveStoreName}
            disabled={!storeNameDirty}
            className={`mt-3 items-center rounded-xl py-3 ${
              storeNameDirty ? 'bg-[#1E90FF]' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                storeNameDirty ? 'text-white' : 'text-gray-500'
              }`}
            >
              저장
            </Text>
          </Pressable>
        </Section>

        {/* Category Management */}
        <Section title="카테고리 관리">
          <Text className="mb-2 text-sm font-medium text-gray-700">레시피 카테고리</Text>
          <View className="mb-3 rounded-xl border border-gray-200 bg-white">
            {recipeCategories.map((cat, idx) => (
              <View
                key={cat}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  idx < recipeCategories.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <Text className="text-base text-gray-900">{cat}</Text>
                <Pressable onPress={() => handleDeleteRecipeCat(cat)} hitSlop={8}>
                  <Text className="text-base text-red-400">×</Text>
                </Pressable>
              </View>
            ))}
            {recipeCategories.length === 0 && (
              <View className="px-4 py-3">
                <Text className="text-sm text-gray-400">카테고리가 없어요</Text>
              </View>
            )}
          </View>
          <View className="flex-row" style={{ gap: 8 }}>
            <TextInput
              value={newRecipeCat}
              onChangeText={setNewRecipeCat}
              placeholder="새 카테고리"
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              onSubmitEditing={handleAddRecipeCat}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-900"
            />
            <Pressable
              onPress={handleAddRecipeCat}
              disabled={!newRecipeCat.trim()}
              className={`items-center justify-center rounded-xl px-4 py-2.5 ${
                newRecipeCat.trim() ? 'bg-[#1E90FF]' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  newRecipeCat.trim() ? 'text-white' : 'text-gray-400'
                }`}
              >
                추가
              </Text>
            </Pressable>
          </View>

          <Text className="mb-2 mt-5 text-sm font-medium text-gray-700">재료 카테고리</Text>
          <View className="mb-3 rounded-xl border border-gray-200 bg-white">
            {ingredientCategories.map((cat, idx) => (
              <View
                key={cat}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  idx < ingredientCategories.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <Text className="text-base text-gray-900">{cat}</Text>
                <Pressable onPress={() => handleDeleteIngCat(cat)} hitSlop={8}>
                  <Text className="text-base text-red-400">×</Text>
                </Pressable>
              </View>
            ))}
            {ingredientCategories.length === 0 && (
              <View className="px-4 py-3">
                <Text className="text-sm text-gray-400">카테고리가 없어요</Text>
              </View>
            )}
          </View>
          <View className="flex-row" style={{ gap: 8 }}>
            <TextInput
              value={newIngCat}
              onChangeText={setNewIngCat}
              placeholder="새 카테고리"
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              onSubmitEditing={handleAddIngCat}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-900"
            />
            <Pressable
              onPress={handleAddIngCat}
              disabled={!newIngCat.trim()}
              className={`items-center justify-center rounded-xl px-4 py-2.5 ${
                newIngCat.trim() ? 'bg-[#1E90FF]' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  newIngCat.trim() ? 'text-white' : 'text-gray-400'
                }`}
              >
                추가
              </Text>
            </Pressable>
          </View>
        </Section>

        {/* Data Management */}
        <Section title="데이터 관리">
          <Pressable
            onPress={handleExport}
            disabled={busy}
            className={`mb-2 items-center rounded-xl py-3 ${
              busy ? 'bg-gray-300' : 'bg-[#1E90FF]'
            }`}
          >
            <Text className="text-sm font-semibold text-white">백업하기</Text>
          </Pressable>
          <Pressable
            onPress={handleImport}
            disabled={busy}
            className={`items-center rounded-xl border py-3 ${
              busy ? 'border-gray-200' : 'border-[#1E90FF]'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                busy ? 'text-gray-400' : 'text-[#1E90FF]'
              }`}
            >
              백업에서 복원
            </Text>
          </Pressable>
        </Section>

        {/* Unit Setting */}
        <Section title="단위 설정">
          <View className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <Text className="text-base text-gray-900">기본 단위: g</Text>
            <Text className="mt-1 text-xs text-gray-500">
              현재는 그램(g)만 지원해요. 추후 확장 예정.
            </Text>
          </View>
        </Section>

        {/* Reset */}
        <Section title="데이터 초기화">
          <Pressable
            onPress={handleReset}
            disabled={busy}
            className={`items-center rounded-xl border py-3 ${
              busy ? 'border-gray-200' : 'border-red-300'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                busy ? 'text-gray-400' : 'text-red-500'
              }`}
            >
              모든 데이터 삭제
            </Text>
          </Pressable>
        </Section>

        {/* App Version */}
        <View className="mt-2 items-center">
          <Text className="text-xs text-gray-400">앱 버전 {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps): JSX.Element {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-base font-semibold text-gray-900">
        {title}
      </Text>
      {children}
    </View>
  )
}
