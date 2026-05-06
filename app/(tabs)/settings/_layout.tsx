import { Stack } from 'expo-router'
import type { JSX } from 'react'

export default function SettingsLayout(): JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />
}
