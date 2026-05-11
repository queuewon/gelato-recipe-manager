import type { JSX } from 'react'
import { Text, View } from 'react-native'
import { PASTEL_THEMES } from '../../constants/colors'

interface EmptyStateProps {
  title: string
  subtitle?: string
}

export function EmptyState({ title, subtitle }: EmptyStateProps): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: PASTEL_THEMES.yellow.soft,
          marginBottom: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: PASTEL_THEMES.pink.soft,
          }}
        />
      </View>
      <Text className="text-lg font-bold text-gray-800">{title}</Text>
      {subtitle ? (
        <Text className="mt-2 text-center text-sm text-gray-500">
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}
