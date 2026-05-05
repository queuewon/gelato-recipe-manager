import { Stack } from 'expo-router'
import { useEffect, useState, type JSX } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { initDB } from '../db/schema'
import '../global.css'

export default function RootLayout(): JSX.Element {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await initDB()
        if (!cancelled) setReady(true)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC] px-6">
        <Text className="text-base text-red-600">DB 초기화 실패: {error}</Text>
      </View>
    )
  }

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}
