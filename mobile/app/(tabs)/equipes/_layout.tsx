import { Stack } from 'expo-router'
import { colors } from '@/constants/colors'

export default function EquipesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Équipes' }} />
      <Stack.Screen name="[id]" options={{ title: 'Équipe' }} />
    </Stack>
  )
}
