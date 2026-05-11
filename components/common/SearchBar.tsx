import type { JSX } from 'react'
import { TextInput, View } from 'react-native'
import { PASTEL_THEMES } from '../../constants/colors'

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
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PASTEL_THEMES.pink.ring,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: PASTEL_THEMES.pink.deep,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C9A6B8"
        style={{ fontSize: 15, color: '#1A1A2E' }}
      />
    </View>
  )
}
