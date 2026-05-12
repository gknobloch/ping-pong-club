import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { getRoleLabel, getDisplayName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import type { User } from '@shared/types'

export default function LoginScreen() {
  const { login, availableUsers } = useAuth()
  const { players, loading } = useAppData()
  const [selecting, setSelecting] = useState<string | null>(null)

  async function handleSelect(user: User) {
    setSelecting(user.id)
    await login(user.id)
    setSelecting(null)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ping-Pong Club</Text>
        <Text style={styles.subtitle}>Choisissez votre compte</Text>
      </View>

      <FlatList
        data={availableUsers}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: user }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect(user)}
            disabled={selecting === user.id}
          >
            <View style={styles.cardBody}>
              <Text style={styles.name}>{getDisplayName(user, players)}</Text>
              <Text style={styles.role}>{getRoleLabel(user.role)}</Text>
            </View>
            {selecting === user.id && (
              <ActivityIndicator size="small" color={colors.accent} />
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: 15 },
  header: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 6 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  role: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
})
