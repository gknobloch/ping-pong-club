import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import { Switcher } from '@/components/Switcher'
import { TeamBadge } from '@/components/TeamBadge'
import { todayIso } from '@/utils/weeks'
import type { Game, MatchDay, Team } from '@shared/types'

// ---------------------------------------------------------------------------
// Player match list — a player's matches for a phase, aligned with the
// Équipes / Journées screens: a < > phase switcher, then a team-style match
// list. Each row opens the match detail (like a Journées card). Games played
// for a team other than the one the player is rostered on are tagged "Renfort".
//
// Defaults to the logged-in player (Accueil → "Tous mes matchs"); pass a
// `playerId` param to show any player's matches (Joueur detail → "Matchs").
// ---------------------------------------------------------------------------
export default function MesMatchsScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { playerId } = useLocalSearchParams<{ playerId?: string }>()
  const { user } = useAuth()
  const {
    clubs, teams, players, matchDays, games, phases, gameSelections, refreshing, refresh,
  } = useAppData()

  const today = todayIso()
  // The player whose matches we show — the param, else the logged-in player.
  const targetPlayerId = playerId ?? (user?.isPlayer ? user.id : undefined)
  const targetPlayer = useMemo(
    () => players.find((p) => p.id === targetPlayerId),
    [players, targetPlayerId],
  )
  const targetClubId = targetPlayer?.clubId
  const mdMap = useMemo(() => new Map(matchDays.map((md) => [md.id, md])), [matchDays])

  // Title: "Mes matchs" for the current user, the player's name otherwise.
  useEffect(() => {
    const isSelf = targetPlayerId === user?.id
    navigation.setOptions({
      title: isSelf
        ? 'Mes matchs'
        : targetPlayer
          ? `${targetPlayer.firstName} ${targetPlayer.lastName}`
          : 'Matchs',
    })
  }, [navigation, targetPlayerId, targetPlayer, user?.id])

  // The team the player is rostered on, per phase.
  const teamByPhase = useMemo(() => {
    const map = new Map<string, Team>()
    if (targetPlayerId) {
      for (const t of teams) if (t.playerIds.includes(targetPlayerId)) map.set(t.phaseId, t)
    }
    return map
  }, [teams, targetPlayerId])

  // Phases the player took part in (rostered or fielded as a renfort).
  const participated = useMemo(() => {
    const s = new Set<string>()
    for (const phaseId of teamByPhase.keys()) s.add(phaseId)
    if (targetPlayerId) {
      for (const sel of gameSelections) {
        if (!sel.playerIds.includes(targetPlayerId)) continue
        const t = teams.find((x) => x.id === sel.teamId)
        if (t) s.add(t.phaseId)
      }
    }
    return s
  }, [teamByPhase, gameSelections, teams, targetPlayerId])

  // Phases for the < > switcher (chronological by name); default active.
  const orderedPhases = useMemo(
    () =>
      phases
        .filter((p) => participated.has(p.id))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [phases, participated],
  )
  const activePhase = phases.find((p) => p.isActive)
  const fallbackPhase =
    activePhase && participated.has(activePhase.id)
      ? activePhase
      : orderedPhases[orderedPhases.length - 1]
  const [phaseId, setPhaseId] = useState<string | undefined>(undefined)
  const phase = phases.find((p) => p.id === phaseId) ?? fallbackPhase
  const phaseIndex = orderedPhases.findIndex((p) => p.id === phase?.id)

  function selectPhase(i: number) {
    const p = orderedPhases[i]
    if (p) setPhaseId(p.id)
  }

  // The player's games for the selected phase: every game of their rostered
  // team, plus any game they were fielded in for another team of their club.
  const playerGames = useMemo(() => {
    if (!phase || !targetPlayerId) return [] as { game: Game; team: Team; md: MatchDay; isRenfort: boolean }[]
    const assigned = teamByPhase.get(phase.id)
    const phaseTeams = teams.filter(
      (t) => t.phaseId === phase.id && (targetClubId ? t.clubId === targetClubId : t.id === assigned?.id),
    )
    const out: { game: Game; team: Team; md: MatchDay; isRenfort: boolean }[] = []
    const seen = new Set<string>()
    for (const t of phaseTeams) {
      const isAssigned = assigned ? t.id === assigned.id : false
      for (const g of games) {
        if (g.homeTeamId !== t.id && g.awayTeamId !== t.id) continue
        if (!isAssigned) {
          const sel = gameSelections.find((s) => s.teamId === t.id && s.gameId === g.id)
          if (!sel?.playerIds.includes(targetPlayerId)) continue
        }
        const md = mdMap.get(g.matchDayId)
        if (!md || seen.has(g.id)) continue
        seen.add(g.id)
        out.push({ game: g, team: t, md, isRenfort: !isAssigned })
      }
    }
    return out.sort((a, b) => a.md.date.localeCompare(b.md.date))
  }, [phase, targetPlayerId, targetClubId, teamByPhase, teams, games, gameSelections, mdMap])

  function opponentName(game: Game, team: Team): string {
    const oppId = game.homeTeamId === team.id ? game.awayTeamId : game.homeTeamId
    const opp = teams.find((t) => t.id === oppId)
    return opp ? getTeamName(opp, clubs) : '—'
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {!targetPlayerId || orderedPhases.length === 0 ? (
          <Text style={styles.empty}>Aucun match à afficher.</Text>
        ) : (
          <>
            {phase ? (
              <Switcher
                title={`Saison ${phase.displayName}`}
                onPrev={phaseIndex > 0 ? () => selectPhase(phaseIndex - 1) : undefined}
                onNext={
                  phaseIndex < orderedPhases.length - 1 ? () => selectPhase(phaseIndex + 1) : undefined
                }
              />
            ) : null}

            {playerGames.length === 0 ? (
              <Text style={styles.empty}>Aucun match pour cette phase.</Text>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Matchs ({playerGames.length})</Text>
                {playerGames.map(({ game, team, md, isRenfort }) => {
                  const isHome = game.homeTeamId === team.id
                  const isPast = md.date < today
                  const dateLabel = new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })
                  return (
                    <TouchableOpacity
                      key={game.id}
                      style={styles.gameBlock}
                      onPress={() =>
                        router.push({ pathname: '/match/[id]', params: { id: game.id, teamId: team.id } })
                      }
                    >
                      <View style={styles.gameHeader}>
                        <View style={styles.gameLeft}>
                          <Text style={[styles.gameJ, isPast && styles.gameJPast]}>J{md.number}</Text>
                          <Ionicons
                            name={isHome ? 'home' : 'paper-plane-outline'}
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.gameOpponent} numberOfLines={1}>{opponentName(game, team)}</Text>
                        </View>
                        <View style={styles.gameRight}>
                          <Text style={styles.gameDate}>{dateLabel}</Text>
                          {game.time && <Text style={styles.gameTime}>{game.time}</Text>}
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textSecondary}
                          style={styles.chevron}
                        />
                      </View>
                      <View style={styles.badgeRow}>
                        <TeamBadge color={team.color} label={`Équipe ${team.number}`} />
                        {isRenfort && (
                          <View style={styles.renfortTag}>
                            <Text style={styles.renfortText}>Renfort</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12 },
  empty: { fontSize: 14, color: colors.textSecondary },

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

  gameBlock: { borderTopWidth: 1, borderTopColor: colors.border },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  gameLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  gameJ: { fontSize: 12, fontWeight: '700', color: colors.accent, minWidth: 24 },
  gameJPast: { color: colors.textSecondary },
  gameOpponent: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  gameRight: { alignItems: 'flex-end' },
  gameDate: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  gameTime: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  chevron: { marginLeft: 2 },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  renfortTag: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  renfortText: { fontSize: 11, fontWeight: '600', color: colors.accent },
})
