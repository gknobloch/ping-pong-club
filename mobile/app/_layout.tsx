import { useEffect } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
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
        {/* The tabs host everything, including the shared detail screens (in the
            hidden (detail) group), so the tab bar stays visible while drilling
            in — see app/(tabs)/(detail)/_layout.tsx (#153). */}
        <Stack.Screen name="(tabs)" />
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
