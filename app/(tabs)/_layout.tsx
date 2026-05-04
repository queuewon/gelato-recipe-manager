import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1E90FF',
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 13 },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="recipes" options={{ title: '레시피' }} />
      <Tabs.Screen name="ingredients" options={{ title: '재료' }} />
      <Tabs.Screen name="checklist" options={{ title: '생산' }} />
      <Tabs.Screen name="settings" options={{ title: '설정' }} />
    </Tabs>
  )
}
