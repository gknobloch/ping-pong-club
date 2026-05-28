import { useState } from 'react'
import { FlatList, View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { colors } from '@/constants/colors'
import type { PlayerStatus } from '@shared/types'
import { sortByName } from '@/utils/sortByName'

const STATUS_LABELS: Record<PlayerStatus, string> = {
  active: 'Actif',
  pending_validation: 'En attente',
  archived: 'Archivé',
}

const STATUS_COLORS: Record<PlayerStatus, { bg: string; text: string }> = {
  active: { bg: '#dcfce7', text: '#16a34a' },
  pending_validation: { bg: '#fef3c7', text: '#d97706' },
  archived: { bg: '#f1f5f9', text: colors.textSecondary },
}

export default function AdminPlayersScreen() {
  const { players, clubs } = useAppData()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<PlayerStatus | 'all'>('all')

  const visiblePlayers =
    user?.role === 'general_admin'
      ? players
      : players.filter((p) => user?.clubIds?.includes(p.clubId ?? ''))

  const filtered = sortByName(
    visiblePlayers.filter((p) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus
      return matchesQuery && matchesStatus
    }),
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.input}
          placeholder="Rechercher…"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
        <View style={styles.filters}>
          {(['all', 'active', 'pending_validation', 'archived'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setFilterStatus(s)}
              style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>
                {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: p }) => {
          const club = clubs.find((c) => c.id === p.clubId)
          const sc = STATUS_COLORS[p.status]
          return (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.initials}>{p.firstName[0]}{p.lastName[0]}</Text>
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>{p.firstName} {p.lastName}</Text>
                <Text style={styles.club}>{club?.displayName}</Text>
                {p.email && <Text style={styles.email}>{p.email}</Text>}
              </View>
              <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.badgeText, { color: sc.text }]}>
                  {STATUS_LABELS[p.status]}
                </Text>
              </View>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toolbar: { padding: 12, gap: 8 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 12, gap: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#fff', fontWeight: '700', fontSize: 15 },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  club: { fontSize: 12, color: colors.textSecondary },
  email: { fontSize: 12, color: colors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
})
