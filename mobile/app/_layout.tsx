import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { colors } from '@/constants/colors'
import { DataProvider, useAppData } from '@/contexts/DataContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// ---------------------------------------------------------------------------
// Auth guard — redirects unauthenticated users to /login
// ---------------------------------------------------------------------------
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // wait for the persisted session to restore
    const inLoginScreen = segments[0] === 'login'
    if (!isAuthenticated && !inLoginScreen) {
      router.replace('/login')
    } else if (isAuthenticated && inLoginScreen) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, loading, segments, router])

  return <>{children}</>
}

// ---------------------------------------------------------------------------
// Inner layout — has access to DataContext
// ---------------------------------------------------------------------------
function InnerLayout() {
  const { users } = useAppData()

  return (
    <AuthProvider apiUsers={users}>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
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
        </Stack>
        <StatusBar style="auto" />
      </AuthGuard>
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
