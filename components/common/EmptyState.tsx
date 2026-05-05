import type { JSX } from 'react'
import { Text, View } from 'react-native'

interface EmptyStateProps {
  title: string
  subtitle?: string
}

export function EmptyState({ title, subtitle }: EmptyStateProps): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-lg font-semibold text-gray-700">{title}</Text>
      {subtitle ? (
        <Text className="mt-2 text-center text-sm text-gray-500">
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}
