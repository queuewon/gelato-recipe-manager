import Constants from 'expo-constants'
import * as DocumentPicker from 'expo-document-picker'
import { useRouter } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { PASTEL_THEMES } from '../../../constants/colors'
import { useCategoryStore } from '../../../store/categoryStore'
import { useChecklistStore } from '../../../store/checklistStore'
import { useIngredientStore } from '../../../store/ingredientStore'
import { useRecipeStore } from '../../../store/recipeStore'
import {
  clearAllData,
  exportBackup,
  importBackup,
} from '../../../utils/backup'

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
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const loadCategories = useCategoryStore((s) => s.loadCategories)

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: PASTEL_THEMES.pink.soft,
          opacity: 0.5,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 100,
          left: -50,
          width: 130,
          height: 130,
          borderRadius: 65,
          backgroundColor: PASTEL_THEMES.yellow.soft,
          opacity: 0.4,
        }}
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            marginBottom: 20,
            fontSize: 24,
            fontWeight: '800',
            color: PASTEL_THEMES.pink.deep,
          }}
        >
          설정
        </Text>

        <Section
          title="카테고리 관리"
          theme={PASTEL_THEMES.pink}
        >
          <Pressable
            onPress={() => router.push('/settings/categories')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: PASTEL_THEMES.pink.ring,
              shadowColor: PASTEL_THEMES.pink.deep,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <Text className="text-base font-medium text-gray-900">
              카테고리 관리
            </Text>
            <Text
              style={{
                color: PASTEL_THEMES.pink.deep,
                fontSize: 20,
                opacity: 0.6,
              }}
            >
              ›
            </Text>
          </Pressable>
        </Section>

        <Section title="데이터 관리" theme={PASTEL_THEMES.blue}>
          <Pressable
            onPress={handleExport}
            disabled={busy}
            style={{
              marginBottom: 10,
              alignItems: 'center',
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: busy ? '#E5E7EB' : PASTEL_THEMES.blue.deep,
              shadowColor: PASTEL_THEMES.blue.deep,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: busy ? 0 : 0.2,
              shadowRadius: 6,
              elevation: busy ? 0 : 2,
            }}
          >
            <Text className="text-sm font-bold text-white">백업하기</Text>
          </Pressable>
          <Pressable
            onPress={handleImport}
            disabled={busy}
            style={{
              alignItems: 'center',
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: busy ? '#E5E7EB' : PASTEL_THEMES.blue.accent,
              backgroundColor: '#FFFFFF',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: busy ? '#9CA3AF' : PASTEL_THEMES.blue.deep,
              }}
            >
              백업에서 복원
            </Text>
          </Pressable>
        </Section>

        <Section title="단위 설정" theme={PASTEL_THEMES.yellow}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: PASTEL_THEMES.yellow.ring,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text className="text-base text-gray-900">기본 단위: g</Text>
            <Text className="mt-1 text-xs text-gray-500">
              현재는 그램(g)만 지원해요. 추후 확장 예정.
            </Text>
          </View>
        </Section>

        <Section
          title="데이터 초기화"
          theme={{
            soft: '#FFE4E6',
            deep: '#BE123C',
            ring: '#FECACA',
          }}
        >
          <Pressable
            onPress={handleReset}
            disabled={busy}
            style={{
              alignItems: 'center',
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: busy ? '#E5E7EB' : '#FECACA',
              backgroundColor: '#FFF1F2',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: busy ? '#9CA3AF' : '#BE123C',
              }}
            >
              모든 데이터 삭제
            </Text>
          </Pressable>
        </Section>

        <View className="mt-2 items-center">
          <Text className="text-xs text-gray-400">앱 버전 {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

interface SectionTheme {
  soft: string
  deep: string
  ring: string
}

interface SectionProps {
  title: string
  theme: SectionTheme
  children: React.ReactNode
}

function Section({ title, theme, children }: SectionProps): JSX.Element {
  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center" style={{ gap: 8 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.deep,
          }}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: theme.deep,
            letterSpacing: 0.4,
          }}
        >
          {title.toUpperCase()}
        </Text>
      </View>
      {children}
    </View>
  )
}
