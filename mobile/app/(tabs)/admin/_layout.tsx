import { Stack } from 'expo-router'
import { colors } from '@/constants/colors'

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Administration' }} />
      <Stack.Screen name="clubs" options={{ title: 'Clubs' }} />
      <Stack.Screen name="equipes" options={{ title: 'Équipes' }} />
      <Stack.Screen name="joueurs" options={{ title: 'Joueurs' }} />
    </Stack>
  )
}
