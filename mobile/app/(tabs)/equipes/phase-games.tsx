import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { useAppData } from '@/contexts/DataContext'
import { getTeamName } from '@/utils/roles'
import { sortByName } from '@/utils/sortByName'
import { colors } from '@/constants/colors'
import type { Player } from '@shared/types'

export default function PhaseGamesScreen() {
  const { teamId, label } = useLocalSearchParams<{ teamId: string; label: string }>()
  const { teams, players, clubs, matchDays, games, gameSelections } = useAppData()
  const navigation = useNavigation()
  const router = useRouter()

  useEffect(() => {
    if (label) navigation.setOptions({ title: label })
  }, [label, navigation])

  const team = teams.find((t) => t.id === teamId)

  const teamGames = useMemo(() => {
    if (!team) return []
    const mdInGroup = new Set(
      matchDays.filter((md) => md.groupId === team.groupId).map((md) => md.id),
    )
    return games
      .filter(
        (g) =>
          (g.homeTeamId === teamId || g.awayTeamId === teamId) && mdInGroup.has(g.matchDayId),
      )
      .map((g) => ({ ...g, matchDay: matchDays.find((md) => md.id === g.matchDayId) }))
      .sort((a, b) => (a.matchDay?.date ?? '').localeCompare(b.matchDay?.date ?? ''))
  }, [team, teamId, matchDays, games])

  const teamSelections = useMemo(
    () => gameSelections.filter((s) => s.teamId === teamId),
    [gameSelections, teamId],
  )

  const { rosterPlayers, borrowedPlayers, playedCount } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const sel of teamSelections) {
      for (const pid of sel.playerIds) {
        counts.set(pid, (counts.get(pid) ?? 0) + 1)
      }
    }
    const rosterIds = new Set(team?.playerIds ?? [])
    const borrowedIds = [...counts.keys()].filter((pid) => !rosterIds.has(pid))
    const roster = sortByName(
      (team?.playerIds ?? [])
        .map((pid) => players.find((p) => p.id === pid))
        .filter(Boolean) as Player[],
    )
    const borrowed = sortByName(
      borrowedIds.map((pid) => players.find((p) => p.id === pid)).filter(Boolean) as Player[],
    )
    return { rosterPlayers: roster, borrowedPlayers: borrowed, playedCount: counts }
  }, [team, teamSelections, players])

  const totalGames = teamGames.length
  const today = new Date().toISOString().slice(0, 10)

  if (!team) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>Équipe introuvable.</Text>
      </SafeAreaView>
    )
  }

  function openPlayer(playerId: string) {
    router.push({ pathname: '/(tabs)/equipes/player-detail', params: { id: playerId } })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Member stats */}
        {(rosterPlayers.length > 0 || borrowedPlayers.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Joueurs ({rosterPlayers.length + borrowedPlayers.length})</Text>
            {rosterPlayers.map((p) => (
              <TouchableOpacity key={p.id} style={styles.memberRow} onPress={() => openPlayer(p.id)}>
                <Text style={styles.memberName}>{p.firstName} {p.lastName}</Text>
                {p.id === team.captainId && <Text style={styles.capBadge}>Cap.</Text>}
                <Text style={styles.gamesCount}>{playedCount.get(p.id) ?? 0}/{totalGames}</Text>
              </TouchableOpacity>
            ))}
            {borrowedPlayers.map((p) => (
              <TouchableOpacity key={p.id} style={styles.memberRow} onPress={() => openPlayer(p.id)}>
                <Text style={styles.memberName}>{p.firstName} {p.lastName}</Text>
                <Text style={styles.renforceBadge}>Renfort</Text>
                <Text style={styles.gamesCount}>{playedCount.get(p.id) ?? 0}/{totalGames}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Games list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matchs ({totalGames})</Text>
          {teamGames.map((g) => {
            const md = g.matchDay
            const dateLabel = md
              ? new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })
              : ''
            const isHome = g.homeTeamId === teamId
            const oppTeam = teams.find((t) => t.id === (isHome ? g.awayTeamId : g.homeTeamId))
            const oppName = oppTeam ? getTeamName(oppTeam, clubs) : '—'
            const isPast = md ? md.date < today : false

            const sel = teamSelections.find((s) => s.gameId === g.id)
            const gamePlayers = (sel?.playerIds ?? [])
              .map((pid) => players.find((p) => p.id === pid))
              .filter(Boolean) as Player[]

            return (
              <View key={g.id} style={styles.gameBlock}>
                <View style={styles.gameHeader}>
                  {/* Left: J# · icon · opponent */}
                  <View style={styles.gameLeft}>
                    {md && (
                      <Text style={[styles.gameJ, isPast && styles.gameJPast]}>J{md.number}</Text>
                    )}
                    <Ionicons
                      name={isHome ? 'home' : 'paper-plane-outline'}
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.gameOpponent} numberOfLines={1}>{oppName}</Text>
                  </View>
                  {/* Right: date / time stacked */}
                  <View style={styles.gameRight}>
                    <Text style={styles.gameDate}>{dateLabel}</Text>
                    {g.time && <Text style={styles.gameTime}>{g.time}</Text>}
                  </View>
                </View>

                {/* Players who played */}
                {gamePlayers.length > 0 && (
                  <View style={styles.gamePlayers}>
                    {gamePlayers.map((p) => (
                      <TouchableOpacity key={p.id} onPress={() => openPlayer(p.id)}>
                        <Text style={styles.gamePlayer}>{p.firstName} {p.lastName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )
          })}
          {totalGames === 0 && <Text style={styles.empty}>Aucun match trouvé.</Text>}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { gap: 12, padding: 16, paddingBottom: 32 },
  empty: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', padding: 24 },

  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },

  // Member rows
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  memberName: { flex: 1, fontSize: 14, color: colors.textPrimary },
  capBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  renforceBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gamesCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },

  // Game blocks
  gameBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  gameLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  gameJ: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    minWidth: 24,
  },
  gameJPast: { color: colors.textSecondary },
  gameOpponent: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  gameRight: {
    alignItems: 'flex-end',
  },
  gameDate: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  gameTime: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  // Players per game
  gamePlayers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  gamePlayer: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
})
