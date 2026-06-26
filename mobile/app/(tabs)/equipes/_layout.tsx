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
    </Stack>
  )
}
