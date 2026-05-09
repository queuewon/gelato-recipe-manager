import type { JSX } from 'react'
import { TextInput, View } from 'react-native'

interface SearchBarProps {
  placeholder: string
  value: string
  onChangeText: (text: string) => void
}

export function SearchBar({
  placeholder,
  value,
  onChangeText,
}: SearchBarProps): JSX.Element {
  return (
    <View className="rounded-xl border border-[#EFE0E8] bg-white px-4 py-3">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0A8B3"
        className="text-base text-[#2D2040]"
      />
    </View>
  )
}
