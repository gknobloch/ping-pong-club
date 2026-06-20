import { Stack } from 'expo-router'
import { colors } from '@/constants/colors'

export default function EquipesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Équipes' }} />
      <Stack.Screen name="[id]" options={{ title: 'Équipe' }} />
      <Stack.Screen name="phase-games" options={{ title: 'Matchs' }} />
      <Stack.Screen name="player-detail" options={{ title: 'Joueur' }} />
    </Stack>
  )
}
