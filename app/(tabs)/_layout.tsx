import { Tabs } from 'expo-router'
import type { JSX } from 'react'

export default function TabsLayout(): JSX.Element {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1E90FF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarIconStyle: { display: 'none' },
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
  )
}
