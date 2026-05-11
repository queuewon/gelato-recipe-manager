import type { JSX } from 'react'
import { Pressable, Text } from 'react-native'
import { PASTEL_THEMES } from '../../constants/colors'

interface FilterChipProps {
  label: string
  isActive: boolean
  onPress: () => void
}

const ACTIVE = PASTEL_THEMES.pink

export function FilterChip({
  label,
  isActive,
  onPress,
}: FilterChipProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: isActive ? ACTIVE.soft : '#FFFFFF',
        borderWidth: 1,
        borderColor: isActive ? ACTIVE.accent : '#E5E7EB',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: isActive ? '700' : '500',
          color: isActive ? ACTIVE.deep : '#6B7280',
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}
