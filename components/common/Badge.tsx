import type { JSX } from 'react'
import { Text, View } from 'react-native'
import { CATEGORY_COLORS } from '../../constants/colors'

interface BadgeProps {
  label: string
  category: string
}

const FALLBACK = { bg: '#F3F4F6', text: '#374151' }

export function Badge({ label, category }: BadgeProps): JSX.Element {
  const color = CATEGORY_COLORS[category] ?? FALLBACK
  return (
    <View
      className="self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: color.bg }}
    >
      <Text className="text-xs font-semibold" style={{ color: color.text }}>
        {label}
      </Text>
    </View>
  )
}
