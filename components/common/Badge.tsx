import type { JSX } from 'react'
import { Text, View } from 'react-native'
import { getLabelColor } from '../../constants/colors'
import { useCategoryStore } from '../../store/categoryStore'

interface BadgeProps {
  label: string
  category: string
}

export function Badge({ label, category }: BadgeProps): JSX.Element {
  const colorKey = useCategoryStore((s) => s.labelColors[category])
  const color = getLabelColor(colorKey)
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
