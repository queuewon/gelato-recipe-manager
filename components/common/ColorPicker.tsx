import type { JSX } from 'react'
import { Pressable, View } from 'react-native'
import { LABEL_PALETTE } from '../../constants/colors'

interface ColorPickerProps {
  value: string
  onChange: (key: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps): JSX.Element {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 12 }}>
      {LABEL_PALETTE.map((c) => {
        const selected = c.key === value
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            hitSlop={6}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: c.bg,
              borderWidth: selected ? 2.5 : 1,
              borderColor: selected ? c.text : '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: c.text,
              shadowOffset: { width: 0, height: selected ? 3 : 1 },
              shadowOpacity: selected ? 0.25 : 0.08,
              shadowRadius: selected ? 6 : 2,
              elevation: selected ? 3 : 1,
            }}
          >
            <View
              style={{
                width: selected ? 18 : 14,
                height: selected ? 18 : 14,
                borderRadius: selected ? 9 : 7,
                backgroundColor: c.text,
              }}
            />
          </Pressable>
        )
      })}
    </View>
  )
}
