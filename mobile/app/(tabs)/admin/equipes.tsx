import { FlatList, View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'

export default function AdminTeamsScreen() {
  const { teams, players, clubs } = useAppData()
  const { user } = useAuth()

  const visibleTeams =
    user?.role === 'general_admin'
      ? teams
      : teams.filter((t) => user?.clubIds?.includes(t.clubId ?? ''))

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={visibleTeams}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: team }) => {
          const captain = players.find((p) => p.id === team.captainId)
          const club = clubs.find((c) => c.id === team.clubId)
          const memberCount = team.playerIds?.length ?? 0
          return (
            <View style={styles.card}>
              <View style={[styles.colorBar, { backgroundColor: team.color ?? colors.accent }]} />
              <View style={styles.body}>
                <Text style={styles.name}>{getTeamName(team, clubs)}</Text>
                {club && <Text style={styles.club}>{club.displayName}</Text>}
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{memberCount} joueur{memberCount > 1 ? 's' : ''}</Text>
                  {captain && (
                    <Text style={styles.metaText}>
                      Cap. {captain.firstName} {captain.lastName}
                    </Text>
                  )}
                </View>
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
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  colorBar: { width: 6, alignSelf: 'stretch' },
  body: { flex: 1, padding: 14, gap: 4 },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  club: { fontSize: 12, color: colors.textSecondary },
  meta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
})
