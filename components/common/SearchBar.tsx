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
    <View className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="text-base text-gray-800"
      />
    </View>
  )
}
