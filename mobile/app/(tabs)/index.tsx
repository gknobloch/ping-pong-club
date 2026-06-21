import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { canManageTeam, getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import { Avatar } from '@/components/Avatar'
import { ClubLogo } from '@/components/ClubLogo'
import { NextMatchCard } from '@/components/NextMatchCard'
import { CaptainSelectionSheet } from '@/components/CaptainSelectionSheet'
import { sortByName } from '@/utils/sortByName'
import { getMondayOf, todayIso } from '@/utils/weeks'
import type { AvailabilityStatus, Player, Team } from '@shared/types'

// ---------------------------------------------------------------------------
// Home screen — player dashboard
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const router = useRouter()
  const { user, displayName } = useAuth()
  const {
    clubs, seasons, teams, players, matchDays, games,
    phases, divisions, groups,
    gameAvailabilities, gameSelections,
    setAvailability, setGameSelection,
    refreshing, refresh,
  } = useAppData()

  const [showCompose, setShowCompose] = useState(false)

  const today = todayIso()
  const currentWeekMonday = getMondayOf(today)

  const myPlayerId = user?.isPlayer ? user.id : undefined

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])
  const mdMap = useMemo(() => new Map(matchDays.map((md) => [md.id, md])), [matchDays])
  const divMap = useMemo(() => new Map(divisions.map((d) => [d.id, d])), [divisions])
  const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups])
  // Resolve a team's gameLocationId → "Label, City" across every club's addresses.
  const addressMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of clubs) for (const a of c.addresses ?? []) m.set(a.id, `${a.label}, ${a.city}`)
    return m
  }, [clubs])

  const myTeamByPhase = useMemo(() => {
    if (!myPlayerId) return new Map<string, Team>()
    const map = new Map<string, Team>()
    for (const t of teams) {
      if (t.playerIds.includes(myPlayerId)) map.set(t.phaseId, t)
    }
    return map
  }, [teams, myPlayerId])

  const activePhase = phases.find((p) => p.isActive)
  const myActiveTeam = activePhase ? myTeamByPhase.get(activePhase.id) : undefined
  const isCaptain = !!(user && myActiveTeam && canManageTeam(user, myActiveTeam))
  const isPlayer = !!myPlayerId && !!myActiveTeam

  function getTeamGames(teamId: string) {
    return games.filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId)
  }
  function getOpponentName(ourTeamId: string, oppTeamId: string): string {
    const opp = teams.find((t) => t.id === oppTeamId)
    return opp ? getTeamName(opp, clubs) : '?'
  }
  function getDivisionLabel(team: Team): string | undefined {
    const grp = groupMap.get(team.groupId)
    return grp ? divMap.get(grp.divisionId)?.displayName : undefined
  }
  function getPlayersPerGame(team: Team): number {
    const grp = groupMap.get(team.groupId)
    return (grp ? divMap.get(grp.divisionId)?.playersPerGame : undefined) ?? 4
  }
  function getAvailability(playerId: string, gameId: string): AvailabilityStatus | undefined {
    return gameAvailabilities.find((a) => a.playerId === playerId && a.gameId === gameId)?.status
  }
  function getSelectedForGame(teamId: string, gameId: string): string[] {
    return gameSelections.find((s) => s.teamId === teamId && s.gameId === gameId)?.playerIds ?? []
  }

  // Active-team games split into upcoming (this week onward) and past.
  const activeTeamGames = myActiveTeam ? getTeamGames(myActiveTeam.id) : []
  const upcomingGames = useMemo(() => {
    if (!myActiveTeam) return []
    return getTeamGames(myActiveTeam.id)
      .filter((g) => { const md = mdMap.get(g.matchDayId); return md && getMondayOf(md.date) >= currentWeekMonday })
      .sort((a, b) => (mdMap.get(a.matchDayId)?.date ?? '').localeCompare(mdMap.get(b.matchDayId)?.date ?? ''))
  }, [myActiveTeam, games, mdMap, currentWeekMonday]) // eslint-disable-line react-hooks/exhaustive-deps

  const nextGame = upcomingGames[0]

  // Roster + per-game derivations for the hero card.
  const roster = useMemo(
    () => myActiveTeam
      ? sortByName(myActiveTeam.playerIds.map((id) => playerMap.get(id)).filter(Boolean) as Player[])
      : [],
    [myActiveTeam, playerMap],
  )

  const activeClubTeams = useMemo(() => {
    if (!myActiveTeam || !activePhase) return []
    return teams.filter((t) => t.clubId === myActiveTeam.clubId && t.phaseId === activePhase.id)
  }, [teams, myActiveTeam, activePhase])

  const allClubPlayers = useMemo(() => {
    if (!myActiveTeam) return []
    return players.filter((p) => p.clubId === myActiveTeam.clubId)
  }, [players, myActiveTeam])

  // Metric tiles
  const playedCount = myActiveTeam && myPlayerId
    ? activeTeamGames.filter((g) => {
        const md = mdMap.get(g.matchDayId)
        return md && md.date < today && getSelectedForGame(myActiveTeam.id, g.id).includes(myPlayerId)
      }).length
    : 0
  const totalGames = activeTeamGames.length
  const toConfirm = myPlayerId
    ? upcomingGames.filter((g) => getAvailability(myPlayerId, g.id) === undefined).length
    : 0

  // Logged-in player's record + club (welcome header)
  const me = myPlayerId ? playerMap.get(myPlayerId) : undefined
  const myClubId = me?.clubId ?? user?.clubId
  const myClub = myClubId ? clubs.find((c) => c.id === myClubId) : undefined

  // Phases the player appears in — subtitle for the "Voir tous mes matchs" row.
  const myPhasesSubtitle = useMemo(
    () => phases
      .filter((p) => myTeamByPhase.has(p.id))
      .sort((a, b) => (a.isActive === b.isActive ? b.displayName.localeCompare(a.displayName) : a.isActive ? -1 : 1))
      .map((p) => p.displayName)
      .join(' · '),
    [phases, myTeamByPhase],
  )

  // ── Hero view-model (only when there's a next game) ──
  const hero = (() => {
    if (!myActiveTeam || !nextGame) return null
    const md = mdMap.get(nextGame.matchDayId)
    if (!md) return null
    const isHome = nextGame.homeTeamId === myActiveTeam.id
    const oppId = isHome ? nextGame.awayTeamId : nextGame.homeTeamId
    const homeTeam = teams.find((t) => t.id === nextGame.homeTeamId)
    const venueLabel = homeTeam ? addressMap.get(homeTeam.gameLocationId) : undefined

    const rosterAvail = roster.map((p) => getAvailability(p.id, nextGame.id))
    const availablePlayers = roster.filter((_, i) => rosterAvail[i] === 'available')
    const availableCount = availablePlayers.length
    const noResponseCount = rosterAvail.filter((s) => s === undefined).length

    return { md, isHome, oppId, venueLabel, availablePlayers, availableCount, noResponseCount }
  })()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {/* Identity header */}
        <View style={styles.welcomeCard}>
          <Avatar
            playerId={me?.id ?? user?.id ?? ''}
            avatarUpdatedAt={me?.avatarUpdatedAt}
            firstName={me?.firstName ?? user?.firstName}
            lastName={me?.lastName ?? user?.lastName}
            size={48}
          />
          <View style={styles.welcomeText}>
            <Text style={styles.identityName} numberOfLines={1}>{displayName}</Text>
            {myClub ? (
              <Text style={styles.identityClub} numberOfLines={1}>{myClub.displayName}</Text>
            ) : null}
          </View>
          {myClub ? (
            <ClubLogo
              clubId={myClub.id}
              logoUpdatedAt={myClub.logoUpdatedAt}
              name={myClub.displayName}
              size={48}
            />
          ) : null}
        </View>

        {/* ── Player dashboard ── */}
        {isPlayer && myActiveTeam && (
          <>
            <Text style={styles.sectionLabel}>Prochain match</Text>
            {hero ? (
              <NextMatchCard
                matchDayNumber={hero.md.number}
                matchDayDate={hero.md.date}
                time={nextGame!.time}
                divisionLabel={getDivisionLabel(myActiveTeam)}
                teamColor={myActiveTeam.color}
                teamNumber={myActiveTeam.number}
                isHome={hero.isHome}
                teamName={getTeamName(myActiveTeam, clubs)}
                opponentName={getOpponentName(myActiveTeam.id, hero.oppId)}
                venueLabel={hero.venueLabel}
                myAvailability={myPlayerId ? getAvailability(myPlayerId, nextGame!.id) : undefined}
                canSetAvailability={!!myPlayerId}
                onPickAvailability={(status) => myPlayerId && setAvailability(myPlayerId, nextGame!.id, status)}
                availableCount={hero.availableCount}
                noResponseCount={hero.noResponseCount}
                availablePlayers={hero.availablePlayers}
                isCaptain={isCaptain}
                onCompose={() => setShowCompose(true)}
                onOpenWeek={() => router.push(`/week/${getMondayOf(hero.md.date)}`)}
              />
            ) : (
              <View style={styles.card}>
                <Text style={styles.empty}>Pas de prochain match prévu.</Text>
              </View>
            )}

            {/* Quick stats */}
            <View style={styles.tiles}>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>Matchs joués</Text>
                <Text style={styles.tileValue}>{playedCount} / {totalGames}</Text>
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>À confirmer</Text>
                <Text style={[styles.tileValue, toConfirm > 0 && { color: colors.warning }]}>
                  {toConfirm} match{toConfirm !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* All matches */}
            <TouchableOpacity style={styles.allMatches} onPress={() => router.push('/mes-matchs')}>
              <View style={styles.allMatchesLeft}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                <View>
                  <Text style={styles.allMatchesTitle}>Voir tous mes matchs</Text>
                  {myPhasesSubtitle ? (
                    <Text style={styles.allMatchesSub} numberOfLines={1}>{myPhasesSubtitle}</Text>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}

        {/* ── Generic view for non-players ── */}
        {!isPlayer && (
          <>
            {seasons.find((s) => s.isActive) && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Saison en cours</Text>
                <Text style={styles.seasonName}>{seasons.find((s) => s.isActive)!.displayName}</Text>
              </View>
            )}
            {(() => {
              const upcomingMatchDays = matchDays
                .filter((md) => new Date(md.date) >= new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 3)
              if (upcomingMatchDays.length === 0) return null
              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Prochaines journées</Text>
                  {upcomingMatchDays.map((md) => {
                    const count = games.filter((g) => g.matchDayId === md.id).length
                    return (
                      <View key={md.id} style={styles.matchDayRow}>
                        <View>
                          <Text style={styles.matchDayName}>Journée {md.number}</Text>
                          <Text style={styles.matchDayDate}>
                            {new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                              weekday: 'long', day: 'numeric', month: 'long',
                            })}
                          </Text>
                        </View>
                        <Text style={styles.matchCount}>{count} match{count > 1 ? 's' : ''}</Text>
                      </View>
                    )
                  })}
                </View>
              )
            })()}
          </>
        )}
      </ScrollView>

      {/* Captain line-up sheet for the next match */}
      {showCompose && myActiveTeam && nextGame && (
        <CaptainSelectionSheet
          team={myActiveTeam}
          teamPlayers={roster}
          clubs={clubs}
          playersPerGame={getPlayersPerGame(myActiveTeam)}
          getAvailability={(pid) => getAvailability(pid, nextGame.id)}
          initialSelection={getSelectedForGame(myActiveTeam.id, nextGame.id)}
          selectionData={{
            matchDayId: nextGame.matchDayId,
            allClubPlayers,
            clubTeams: activeClubTeams,
            matchDays,
            games,
            gameSelections,
          }}
          onSave={(ids) => setGameSelection(myActiveTeam.id, nextGame.id, ids)}
          onClose={() => setShowCompose(false)}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12 },
  welcomeCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 4,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  welcomeText: { flex: 1, gap: 2 },
  identityName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  identityClub: { fontSize: 16, fontWeight: '400', color: colors.textSecondary, textAlign: 'center' },

  sectionLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: -4 },
  empty: { fontSize: 14, color: colors.textSecondary },
  card: {
    backgroundColor: colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  cardTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  seasonName: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },

  // Metric tiles
  tiles: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1, backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 2,
  },
  tileLabel: { fontSize: 13, color: colors.textSecondary },
  tileValue: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },

  // All matches row
  allMatches: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  allMatchesLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  allMatchesTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  allMatchesSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Non-player view
  matchDayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border,
  },
  matchDayName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  matchDayDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  matchCount: { fontSize: 13, color: colors.textSecondary },
})
