import { ScrollView, View, Text, StyleSheet, SafeAreaView, RefreshControl } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { useAppData } from '@/contexts/DataContext'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import { GameSummary } from '@/components/GameSummary'
import { formatWeekRange, getSundayOf } from '@/utils/weeks'

// ---------------------------------------------------------------------------
// Week detail — all games of a calendar week. Lives on the root stack (above
// the tabs) so it can be opened from either Accueil or Journées and "back"
// returns to wherever it was opened from.
// ---------------------------------------------------------------------------
export default function WeekDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const { matchDays, games, teams, clubs, divisions, groups, refreshing, refresh } = useAppData()

  // id is a Monday date string e.g. "2025-09-22"
  const mondayStr = id ?? ''
  const sundayStr = mondayStr ? getSundayOf(mondayStr) : ''

  useEffect(() => {
    if (mondayStr) navigation.setOptions({ title: formatWeekRange(mondayStr) })
  }, [mondayStr, navigation])

  // All matchDays in this calendar week
  const weekMatchDays = useMemo(
    () => matchDays.filter((md) => md.date >= mondayStr && md.date <= sundayStr),
    [matchDays, mondayStr, sundayStr],
  )

  // All games for this week, sorted by our team's number
  // "Our" teams are identified by having a roster (playerIds.length > 0)
  const weekGames = useMemo(() => {
    const mds = new Set(weekMatchDays.map((md) => md.id))
    return games
      .filter((g) => mds.has(g.matchDayId))
      .sort((a, b) => {
        const ourTeam = (g: typeof a) =>
          teams.find((t) => (t.id === g.homeTeamId || t.id === g.awayTeamId) && t.playerIds.length > 0)
        return (ourTeam(a)?.number ?? 99) - (ourTeam(b)?.number ?? 99)
      })
  }, [games, weekMatchDays, teams])

  if (!mondayStr) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Semaine introuvable.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {/* Week summary header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{formatWeekRange(mondayStr)}</Text>
          <Text style={styles.headerMeta}>
            {weekGames.length} match{weekGames.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Games ordered by team number */}
        {weekGames.map((game) => {
          const homeTeam = teams.find((t) => t.id === game.homeTeamId)
          const awayTeam = teams.find((t) => t.id === game.awayTeamId)
          const homeTeamName = homeTeam ? getTeamName(homeTeam, clubs) : '?'
          const awayTeamName = awayTeam ? getTeamName(awayTeam, clubs) : '?'
          const ourTeam = [homeTeam, awayTeam].find((t) => t && t.playerIds.length > 0) ?? null

          // Division via group
          const group = groups.find((g) => ourTeam && g.teamIds?.includes(ourTeam.id))
          const division = divisions.find((d) => d.id === group?.divisionId)

          // Game date (from its matchDay)
          const matchDay = matchDays.find((md) => md.id === game.matchDayId)
          const gameDate = matchDay
            ? new Date(matchDay.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            : null

          const roundLabel = ourTeam ? `Équipe ${ourTeam.number}` : undefined
          const isHome = ourTeam ? game.homeTeamId === ourTeam.id : undefined

          return (
            <View
              key={game.id}
              style={[
                styles.gameCard,
                { borderLeftWidth: 6, borderLeftColor: ourTeam?.color ?? colors.accent },
              ]}
            >
              {/* Game header */}
              <View style={styles.gameHeader}>
                <GameSummary
                  teamLabel={roundLabel}
                  isHome={isHome}
                  title={`${homeTeamName} – ${awayTeamName}`}
                  dateLabel={gameDate ?? undefined}
                  time={game.time}
                  matchDayNumber={matchDay?.number}
                  divisionLabel={division?.displayName}
                />
              </View>
            </View>
          )
        })}

        {weekGames.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.empty}>Aucun match pour cette semaine.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12 },
  notFound: { padding: 24, color: colors.textSecondary, textAlign: 'center' },

  headerCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1 },
  headerMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  gameCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  gameHeader: { padding: 14, gap: 4 },

  empty: { fontSize: 14, color: colors.textSecondary },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
})
