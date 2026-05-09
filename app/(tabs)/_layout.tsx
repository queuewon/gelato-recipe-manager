import { Tabs } from 'expo-router'
import type { JSX } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function TabsLayout(): JSX.Element {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#F8FAFC]">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#1E90FF',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarIcon: () => null,
          tabBarLabelStyle: { fontSize: 13 },
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: '홈' }} />
        <Tabs.Screen name="recipes" options={{ title: '레시피' }} />
        <Tabs.Screen name="ingredients" options={{ title: '재료' }} />
        <Tabs.Screen name="checklist" options={{ title: '오늘생산' }} />
        <Tabs.Screen name="settings" options={{ title: '설정' }} />
      </Tabs>
    </SafeAreaView>
  )
}
