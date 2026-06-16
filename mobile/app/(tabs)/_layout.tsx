import type { ComponentProps } from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import { colors } from '@/constants/colors'

type IconName = ComponentProps<typeof Ionicons>['name']

// Monochrome tab icons, tinted by the active/inactive tab color.
function tabIcon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  )
}

export default function TabLayout() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'general_admin' || user?.role === 'club_admin'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="journees"
        options={{ title: 'Journées', headerShown: false, tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tabs.Screen
        name="equipes"
        options={{ title: 'Équipes', headerShown: false, tabBarIcon: tabIcon('people-outline') }}
      />
      <Tabs.Screen
        name="joueurs"
        options={{ title: 'Joueurs', headerShown: false, tabBarIcon: tabIcon('person-outline') }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          headerShown: false,
          tabBarIcon: tabIcon('settings-outline'),
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{ title: 'Mon Compte', tabBarIcon: tabIcon('person-circle-outline') }}
      />
    </Tabs>
  )
}
