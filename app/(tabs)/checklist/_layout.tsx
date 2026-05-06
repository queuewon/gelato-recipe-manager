import { Stack } from 'expo-router'
import type { JSX } from 'react'

export default function ChecklistLayout(): JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />
}
