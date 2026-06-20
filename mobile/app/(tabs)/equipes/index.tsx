import { FlatList, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'

export default function EquipesScreen() {
  const { teams, players, clubs, divisions } = useAppData()
  const { user } = useAuth()
  const router = useRouter()

  const visibleTeams =
    user?.role === 'general_admin'
      ? teams
      : teams.filter((t) => t.clubId === user?.clubId)

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={visibleTeams}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: team }) => {
          const captain = players.find((p) => p.id === team.captainId)
          const division = divisions.find((d) => d.id === team.divisionId)
          const memberCount = team.playerIds?.length ?? 0
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/equipes/${team.id}`)}
            >
              <View style={[styles.colorBar, { backgroundColor: team.color ?? colors.accent }]} />
              <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.teamName}>{getTeamName(team, clubs)}</Text>
                  {division && <Text style={styles.levelBadge}>{division.displayName}</Text>}
                </View>
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{memberCount} joueur{memberCount > 1 ? 's' : ''}</Text>
                  {captain && (
                    <Text style={styles.metaText}>
                      Cap. {captain.firstName} {captain.lastName}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  colorBar: { width: 6, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 14, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  levelBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  meta: { flexDirection: 'row', gap: 12, marginTop: 2 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  chevron: { fontSize: 22, color: colors.textSecondary, paddingRight: 12 },
})
