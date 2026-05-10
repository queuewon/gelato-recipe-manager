import type { JSX } from 'react'
import { Pressable, View } from 'react-native'
import { LABEL_PALETTE } from '../../constants/colors'

interface ColorPickerProps {
  value: string
  onChange: (key: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps): JSX.Element {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {LABEL_PALETTE.map((c) => {
        const selected = c.key === value
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            hitSlop={6}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: c.bg,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? c.text : '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: c.text,
              }}
            />
          </Pressable>
        )
      })}
    </View>
  )
}
