import { useRouter } from 'expo-router'
import { useEffect, type JSX } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useChecklistStore } from '../../store/checklistStore'
import type { ChecklistStatus } from '../../types'

const PRIMARY = '#1E90FF'

function statusMeta(s: ChecklistStatus): {
  label: string
  bg: string
  text: string
} {
  switch (s) {
    case 'done':
      return { label: '완료', bg: '#D1FAE5', text: '#065F46' }
    case 'in_progress':
      return { label: '진행중', bg: '#FEF3C7', text: '#92400E' }
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
  onPress?: () => void
  disabled?: boolean
}

function MenuCard({
  title,
  subtitle,
  onPress,
  disabled,
}: MenuCardProps): JSX.Element {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      className={`rounded-2xl border border-gray-200 bg-white p-4 ${
        disabled ? 'opacity-50' : ''
      }`}
      style={{ width: '48%' }}
    >
      <Text className="text-base font-semibold text-gray-900">{title}</Text>
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
          <Text className="text-2xl font-bold text-gray-900">Gelato</Text>
          <Text className="text-sm text-gray-500">Recipe Manager</Text>
        </View>
        <Pressable className="rounded-full border border-gray-200 px-3 py-1.5">
          <Text className="text-sm text-gray-700">알림</Text>
        </Pressable>
      </View>

      {/* Greeting */}
      <View className="px-5 py-5">
        <Text className="text-2xl font-bold text-gray-900">안녕, 누나! 👋</Text>
        <Text className="mt-1 text-base text-gray-600">
          오늘도 맛있는 젤라또 만들자!
        </Text>
      </View>

      {/* Today Production */}
      <View className="mx-5 mb-6 rounded-2xl border border-gray-200 bg-white p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">
            오늘 생산할 메뉴
          </Text>
          <Text className="text-sm text-gray-500">
            {done} / {total} 완료
          </Text>
        </View>

        <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <View
            className="h-full rounded-full"
            style={{ width: `${progressPct}%`, backgroundColor: PRIMARY }}
          />
        </View>

        {preview.length === 0 ? (
          <View className="mt-4 items-center py-6">
            <Text className="text-sm text-gray-500">
              오늘 생산할 메뉴가 없어요
            </Text>
            <Pressable
              onPress={() => router.push('/checklist')}
              className="mt-3 rounded-full bg-[#E8F4FF] px-4 py-2"
            >
              <Text className="text-sm font-medium text-[#1E90FF]">
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
                      className={`mr-3 h-5 w-5 items-center justify-center rounded border ${
                        checked
                          ? 'border-[#1E90FF] bg-[#1E90FF]'
                          : 'border-gray-300 bg-white'
                      }`}
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
        <Text className="mb-3 text-base font-semibold text-gray-900">
          바로가기
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          <MenuCard
            title="레시피 목록"
            subtitle="등록된 젤라또"
            onPress={() => router.push('/recipes')}
          />
          <MenuCard
            title="재료 관리"
            subtitle="가격 & 재고"
            onPress={() => router.push('/ingredients')}
          />
          <MenuCard title="원가 분석" subtitle="추후 지원" disabled />
          <MenuCard
            title="오늘 생산"
            subtitle="체크리스트"
            onPress={() => router.push('/checklist')}
          />
        </View>
      </View>
    </ScrollView>
  )
}
