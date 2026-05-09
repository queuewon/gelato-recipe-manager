import type { JSX } from 'react'
import { Pressable, Text } from 'react-native'

interface FilterChipProps {
  label: string
  isActive: boolean
  onPress: () => void
}

export function FilterChip({
  label,
  isActive,
  onPress,
}: FilterChipProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className={
        isActive
          ? 'rounded-full border border-[#85BBFF] bg-[#E0EFFF] px-4 py-2'
          : 'rounded-full border border-[#EFE0E8] bg-white px-4 py-2'
      }
    >
      <Text
        className={
          isActive
            ? 'text-sm font-medium text-[#85BBFF]'
            : 'text-sm text-gray-600'
        }
      >
        {label}
      </Text>
    </Pressable>
  )
}
