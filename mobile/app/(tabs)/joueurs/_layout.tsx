import { Stack } from 'expo-router'
import { colors } from '@/constants/colors'

export default function JoueursLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Joueurs' }} />
      <Stack.Screen name="[id]" options={{ title: 'Joueur' }} />
    </Stack>
  )
}
