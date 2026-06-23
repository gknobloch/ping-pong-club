import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { colors } from '@/constants/colors'
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
        {/* Week detail lives above the tabs so it can be opened from either
            Accueil or Journées and "back" returns to the originating tab. */}
        <Stack.Screen
          name="week/[id]"
          options={{
            headerShown: true,
            title: 'Journée',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
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
      <AuthedRoutes />
      <StatusBar style="auto" />
    </AuthProvider>
  )
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------
export default function RootLayout() {
  return (
    <DataProvider>
      <InnerLayout />
    </DataProvider>
  )
}
