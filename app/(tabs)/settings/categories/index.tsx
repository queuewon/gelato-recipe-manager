import { useRouter } from 'expo-router'
import { type JSX } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { PASTEL_THEMES, type PastelTheme } from '../../../../constants/colors'

interface HubCardProps {
  theme: PastelTheme
  title: string
  subtitle: string
  onPress: () => void
}

function HubCard({ theme, title, subtitle, onPress }: HubCardProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: theme.softer,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.ring,
        shadowColor: theme.deep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -28,
          right: -28,
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: theme.soft,
          opacity: 0.85,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -22,
          right: 38,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: theme.accent,
          opacity: 0.35,
        }}
      />
      <View className="flex-row items-center justify-between">
        <View style={{ flex: 1 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: theme.soft,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              marginBottom: 10,
            }}
          >
            <Text
              style={{ color: theme.deep, fontSize: 11, fontWeight: '700' }}
            >
              LABEL
            </Text>
          </View>
          <Text
            style={{
              color: theme.deep,
              fontSize: 18,
              fontWeight: '700',
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: theme.deep,
              opacity: 0.6,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        </View>
        <Text style={{ color: theme.deep, fontSize: 26, opacity: 0.6 }}>›</Text>
      </View>
    </Pressable>
  )
}

export default function CategoriesIndex(): JSX.Element {
  const router = useRouter()

  return (
    <View className="flex-1 bg-[#FFFBF7]">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-base text-gray-700">← 뒤로가기</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">
          카테고리 관리
        </Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
      >
        <View
          style={{
            backgroundColor: '#FFF',
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: '#F1E9F8',
          }}
        >
          <Text className="text-base font-semibold text-gray-900">
            라벨을 예쁘게 정리해요
          </Text>
          <Text className="mt-1 text-xs text-gray-500">
            레시피·재료·단위 라벨에 색상을 입혀 한눈에 구분할 수 있어요.
          </Text>
        </View>

        <HubCard
          theme={PASTEL_THEMES.pink}
          title="레시피 카테고리"
          subtitle="과일, 차, 곡물 등 레시피를 분류해요"
          onPress={() => router.push('/settings/categories/recipes')}
        />
        <HubCard
          theme={PASTEL_THEMES.yellow}
          title="재료 카테고리"
          subtitle="유제품, 견과 등 재료를 묶어요"
          onPress={() => router.push('/settings/categories/ingredients')}
        />
        <HubCard
          theme={PASTEL_THEMES.blue}
          title="포장 단위"
          subtitle="개, 봉, 통 같은 단위를 관리해요"
          onPress={() => router.push('/settings/categories/units')}
        />
      </ScrollView>
    </View>
  )
}
