import { useEffect } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'
import { OfflineBanner } from '@/components/OfflineBanner'
import { DataProvider, useAppData } from '@/contexts/DataContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Hold the native splash until the persisted session has been restored —
// otherwise the splash hides while expo-router is still mounting the right
// screen, briefly revealing the (tabs) Accueil behind it.
SplashScreen.preventAutoHideAsync().catch(() => {})

// ---------------------------------------------------------------------------
// Stack with declarative auth gating
//
// `Stack.Protected` (expo-router 5) hides a screen from the navigator when
// its guard is false, so we never render the (tabs) screen for an
// unauthenticated user. While the session is still being restored we keep
// login visible (with the splash still up on top), so the first thing the
// user sees once the splash dismisses is the right screen for their state.
// ---------------------------------------------------------------------------
function AuthedRoutes() {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {})
  }, [loading])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={loading || !isAuthenticated}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={!loading && isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        {/* The player's full match list, opened from the Accueil dashboard. */}
        <Stack.Screen
          name="mes-matchs"
          options={{
            headerShown: true,
            title: 'Mes matchs',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        {/* Match detail (availabilities + line-up), opened from Journées. */}
        <Stack.Screen
          name="match/[id]"
          options={{
            headerShown: true,
            title: 'Match',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        {/* Player detail — on the root stack so it always gets a back button,
            whatever tab/screen opened it (Joueurs, Équipes, a quick view…). */}
        <Stack.Screen
          name="player/[id]"
          options={{
            headerShown: true,
            title: 'Joueur',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
      </Stack.Protected>
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Inner layout — has access to DataContext
// ---------------------------------------------------------------------------
function InnerLayout() {
  const { users } = useAppData()

  return (
    <AuthProvider apiUsers={users}>
      {/* Banner sits above the navigator so it pushes screen headers down
          rather than overlapping them; it renders nothing when online. */}
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <AuthedRoutes />
      </View>
      <StatusBar style="auto" />
    </AuthProvider>
  )
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <InnerLayout />
      </DataProvider>
    </SafeAreaProvider>
  )
}
