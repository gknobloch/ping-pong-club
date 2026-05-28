import { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { getRoleLabel, getDisplayName } from '@/utils/roles'
import { sortByName } from '@/utils/sortByName'
import { colors } from '@/constants/colors'
import type { User } from '@shared/types'

export default function LoginScreen() {
  const { login, availableUsers } = useAuth()
  const { players, loading } = useAppData()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // Admin accounts (no playerId) stay at the top; player accounts sorted by name below
  const { admins, playerUsers } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = q
      ? availableUsers.filter((u) => {
          const name = getDisplayName(u, players).toLowerCase()
          return name.includes(q) || u.email.toLowerCase().includes(q)
        })
      : availableUsers

    const adminRoles = new Set(['general_admin', 'club_admin'])
    const admins = all.filter((u) => adminRoles.has(u.role))
    const withPlayers = all
      .filter((u) => !adminRoles.has(u.role) && u.playerId)
      .map((u) => {
        const p = players.find((pl) => pl.id === u.playerId)
        return { user: u, lastName: p?.lastName ?? '', firstName: p?.firstName ?? '' }
      })
    const playerUsers = sortByName(withPlayers).map((x) => x.user)

    return { admins, playerUsers }
  }, [availableUsers, players, query])

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

  type Item =
    | { type: 'header'; label: string }
    | { type: 'user'; user: User }

  const items: Item[] = [
    ...(admins.length > 0 ? [{ type: 'header' as const, label: 'Administrateurs' }] : []),
    ...admins.map((u) => ({ type: 'user' as const, user: u })),
    ...(playerUsers.length > 0 ? [{ type: 'header' as const, label: 'Joueurs' }] : []),
    ...playerUsers.map((u) => ({ type: 'user' as const, user: u })),
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ping-Pong Club</Text>
        <Text style={styles.subtitle}>Choisissez votre compte</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher…"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.type === 'header' ? `header-${item.label}` : item.user.id
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.sectionHeader}>{item.label}</Text>
          }
          const { user } = item
          return (
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
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: 15 },
  header: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 6 },
  searchBar: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 2,
  },
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
