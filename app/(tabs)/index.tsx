import { useRouter } from 'expo-router'
import { useEffect, type JSX } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { PASTEL_THEMES, type PastelTheme } from '../../constants/colors'
import { useChecklistStore } from '../../store/checklistStore'
import type { ChecklistStatus } from '../../types'

function statusMeta(s: ChecklistStatus): {
  label: string
  bg: string
  text: string
} {
  switch (s) {
    case 'done':
      return { label: '완료', bg: '#D1FAE5', text: '#065F46' }
    case 'in_progress':
      return { label: '진행중', bg: PASTEL_THEMES.yellow.soft, text: PASTEL_THEMES.yellow.deep }
    case 'pending':
      return { label: '대기', bg: '#F3F4F6', text: '#374151' }
  }
}

function nextStatus(s: ChecklistStatus): ChecklistStatus {
  if (s === 'pending') return 'in_progress'
  if (s === 'in_progress') return 'done'
  return 'pending'
}

interface MenuCardProps {
  title: string
  subtitle: string
  theme: PastelTheme
  onPress?: () => void
}

function MenuCard({ title, subtitle, theme, onPress }: MenuCardProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.ring,
        shadowColor: theme.deep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: theme.soft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: theme.deep,
          }}
        />
      </View>
      <Text className="text-base font-bold text-gray-900">{title}</Text>
      <Text className="mt-1 text-xs text-gray-500">{subtitle}</Text>
    </Pressable>
  )
}

export default function Home(): JSX.Element {
  const router = useRouter()
  const checklist = useChecklistStore((s) => s.checklist)
  const loadTodayChecklist = useChecklistStore((s) => s.loadTodayChecklist)
  const updateStatus = useChecklistStore((s) => s.updateStatus)

  useEffect(() => {
    void loadTodayChecklist()
  }, [loadTodayChecklist])

  const total = checklist.length
  const done = checklist.filter((c) => c.status === 'done').length
  const progressPct = total > 0 ? (done / total) * 100 : 0
  const preview = checklist.slice(0, 5)

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: PASTEL_THEMES.pink.deep,
            }}
          >
            Indigo Gelato
          </Text>
          <Text className="text-sm text-gray-500">Recipe Manager</Text>
        </View>
      </View>

      {/* Greeting */}
      <View className="px-5 py-5">
        <Text className="text-2xl font-bold text-gray-900">안녕, 누나!</Text>
        <Text className="mt-1 text-base text-gray-600">
          오늘도 맛있는 젤라또 만들자! (김경원이 만들어준 어플 ^^b)
        </Text>
      </View>

      {/* Today Production */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 24,
          backgroundColor: '#FFFFFF',
          borderRadius: 22,
          padding: 18,
          borderWidth: 1,
          borderColor: PASTEL_THEMES.blue.ring,
          shadowColor: PASTEL_THEMES.blue.deep,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: PASTEL_THEMES.blue.deep,
              }}
            />
            <Text
              style={{
                color: PASTEL_THEMES.blue.deep,
                fontWeight: '700',
                fontSize: 15,
              }}
            >
              오늘 생산할 메뉴
            </Text>
          </View>
          <Text className="text-sm text-gray-500">
            {done} / {total} 완료
          </Text>
        </View>

        <View
          style={{
            marginTop: 12,
            height: 10,
            width: '100%',
            borderRadius: 999,
            backgroundColor: PASTEL_THEMES.blue.soft,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              borderRadius: 999,
              width: `${progressPct}%`,
              backgroundColor: PASTEL_THEMES.blue.deep,
            }}
          />
        </View>

        {preview.length === 0 ? (
          <View className="mt-4 items-center py-6">
            <Text className="text-sm text-gray-500">
              오늘 생산할 메뉴가 없네... 까먹은거 아니지?
            </Text>
            <Pressable
              onPress={() => router.push('/checklist')}
              style={{
                marginTop: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: PASTEL_THEMES.blue.soft,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: PASTEL_THEMES.blue.deep,
                }}
              >
                메뉴 추가하기
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="mt-3">
            {preview.map((item) => {
              const meta = statusMeta(item.status)
              const checked = item.status === 'done'
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    void updateStatus(item.id, nextStatus(item.status))
                  }}
                  className="flex-row items-center justify-between border-t border-gray-100 py-3"
                >
                  <View className="flex-1 flex-row items-center">
                    <View
                      style={{
                        marginRight: 12,
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: checked
                          ? PASTEL_THEMES.blue.deep
                          : '#FFFFFF',
                        borderColor: checked
                          ? PASTEL_THEMES.blue.deep
                          : PASTEL_THEMES.blue.accent,
                      }}
                    >
                      {checked ? (
                        <Text className="text-xs font-bold text-white">✓</Text>
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-base ${
                          checked
                            ? 'text-gray-400 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.recipe.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {item.batch_size.toLocaleString()} g
                      </Text>
                    </View>
                  </View>
                  <View
                    className="rounded-full px-2.5 py-1"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: meta.text }}
                    >
                      {meta.label}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}
      </View>

      {/* Menu Grid */}
      <View className="px-5">
        <View className="mb-3 flex-row items-center" style={{ gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: PASTEL_THEMES.pink.deep,
            }}
          />
          <Text className="text-base font-bold text-gray-900">바로가기</Text>
        </View>
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          <MenuCard
            theme={PASTEL_THEMES.pink}
            title="레시피 목록"
            subtitle="등록된 젤라또"
            onPress={() => router.push('/recipes')}
          />
          <MenuCard
            theme={PASTEL_THEMES.yellow}
            title="재료 관리"
            subtitle="가격 & 재고"
            onPress={() => router.push('/ingredients')}
          />
          <MenuCard
            theme={PASTEL_THEMES.blue}
            title="오늘 생산"
            subtitle="체크리스트"
            onPress={() => router.push('/checklist')}
          />
        </View>
      </View>
    </ScrollView>
  )
}
