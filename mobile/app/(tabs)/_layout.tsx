import { Tabs } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { colors } from '@/constants/colors'
import { Text } from 'react-native'

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
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
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journees"
        options={{
          title: 'Journées',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="equipes"
        options={{
          title: 'Équipes',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="🏓" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="joueurs"
        options={{
          title: 'Joueurs',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: 'Mon Compte',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
