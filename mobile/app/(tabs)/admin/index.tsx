import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { colors } from '@/constants/colors'

interface AdminTileProps {
  title: string
  count: number
  onPress: () => void
}

function AdminTile({ title, count, onPress }: AdminTileProps) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress}>
      <Text style={styles.tileCount}>{count}</Text>
      <Text style={styles.tileTitle}>{title}</Text>
    </TouchableOpacity>
  )
}

export default function AdminScreen() {
  const { clubs, teams, players } = useAppData()
  const { user } = useAuth()
  const router = useRouter()

  const isGenAdmin = user?.role === 'general_admin'

  const myClubs = isGenAdmin
    ? clubs
    : clubs.filter((c) => user?.clubIds?.includes(c.id))
  const myTeams = isGenAdmin
    ? teams
    : teams.filter((t) => user?.clubIds?.includes(t.clubId ?? ''))
  const myPlayers = isGenAdmin
    ? players
    : players.filter((p) => user?.clubIds?.includes(p.clubId ?? ''))

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Administration</Text>

        <View style={styles.grid}>
          {isGenAdmin && (
            <AdminTile title="Clubs" count={myClubs.length} onPress={() => router.push('/(tabs)/admin/clubs')} />
          )}
          <AdminTile title="Équipes" count={myTeams.length} onPress={() => router.push('/(tabs)/admin/equipes')} />
          <AdminTile title="Joueurs" count={myPlayers.length} onPress={() => router.push('/(tabs)/admin/joueurs')} />
        </View>

        {/* Quick stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <StatRow label="Joueurs actifs" value={myPlayers.filter((p) => p.status === 'active').length} />
          <StatRow label="Joueurs en attente" value={myPlayers.filter((p) => p.status === 'pending_validation').length} />
          <StatRow label="Équipes" value={myTeams.length} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flex: 1,
    minWidth: 130,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  tileCount: { fontSize: 32, fontWeight: '700', color: colors.accent },
  tileTitle: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  statLabel: { fontSize: 14, color: colors.textPrimary },
  statValue: { fontSize: 14, fontWeight: '600', color: colors.accent },
})
