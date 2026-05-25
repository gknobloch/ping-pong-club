import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { useAppData } from '@/contexts/DataContext'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { teams, players, clubs } = useAppData()
  const navigation = useNavigation()

  const team = teams.find((t) => t.id === id)
  const club = clubs.find((c) => c.id === team?.clubId)
  const captain = players.find((p) => p.id === team?.captainId)
  const members = (team?.playerIds ?? [])
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean) as typeof players

  useEffect(() => {
    if (team) navigation.setOptions({ title: getTeamName(team, clubs) })
  }, [team, clubs, navigation])

  if (!team) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Équipe introuvable.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={[styles.banner, { backgroundColor: team.color ?? colors.accent }]}>
          <Text style={styles.bannerName}>{getTeamName(team, clubs)}</Text>
          {club && <Text style={styles.bannerClub}>{club.displayName}</Text>}
        </View>

        {/* Captain */}
        {captain && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capitaine</Text>
            <View style={styles.playerRow}>
              <Text style={styles.playerName}>
                {captain.firstName} {captain.lastName}
              </Text>
              <Text style={styles.badge}>Cap.</Text>
            </View>
          </View>
        )}

        {/* Roster */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Joueurs ({members.length})</Text>
          {members.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <Text style={styles.playerName}>
                {p.firstName} {p.lastName}
              </Text>
              {p.id === team.captainId && <Text style={styles.badge}>Cap.</Text>}
            </View>
          ))}
          {members.length === 0 && (
            <Text style={styles.empty}>Aucun joueur dans cette équipe.</Text>
          )}
        </View>

        {/* Schedule */}
        {(team.defaultDay || team.defaultTime) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendrier</Text>
            {team.defaultDay && team.defaultTime && (
              <Text style={styles.infoText}>🕐 {team.defaultDay} {team.defaultTime}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { gap: 12 },
  notFound: { padding: 24, color: colors.textSecondary, textAlign: 'center' },
  banner: { padding: 24, gap: 4 },
  bannerName: { fontSize: 24, fontWeight: '700', color: '#fff' },
  bannerClub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playerName: { fontSize: 15, color: colors.textPrimary },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  empty: { fontSize: 14, color: colors.textSecondary },
  infoText: { fontSize: 14, color: colors.textPrimary },
})
