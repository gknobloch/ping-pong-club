import { Stack } from 'expo-router'
import { colors } from '@/constants/colors'

export default function JourneesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Journées' }} />
      <Stack.Screen name="[id]" options={{ title: 'Journée' }} />
    </Stack>
  )
}
