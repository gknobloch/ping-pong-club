import { FlatList, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'

export default function EquipesScreen() {
  const { teams, players, clubs } = useAppData()
  const { user } = useAuth()
  const router = useRouter()

  // Players and club_admins see only their club's teams; general_admin sees all
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
          const club = clubs.find((c) => c.id === team.clubId)
          const memberCount = team.playerIds?.length ?? 0
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/equipes/${team.id}`)}
            >
              <View style={[styles.colorBar, { backgroundColor: team.color ?? colors.accent }]} />
              <View style={styles.cardBody}>
                <Text style={styles.teamName}>{getTeamName(team, clubs)}</Text>
                {club && <Text style={styles.clubName}>{club.displayName}</Text>}
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
  teamName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  clubName: { fontSize: 12, color: colors.textSecondary },
  meta: { flexDirection: 'row', gap: 12, marginTop: 2 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  chevron: { fontSize: 22, color: colors.textSecondary, paddingRight: 12 },
})
