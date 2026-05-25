import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  Pressable,
} from 'react-native'
import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import type { AvailabilityStatus, Player } from '@shared/types'

// ---------------------------------------------------------------------------
// Week helpers
// ---------------------------------------------------------------------------
function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Availability config
// ---------------------------------------------------------------------------
const AVAIL: Record<AvailabilityStatus, { label: string; color: string; bg: string }> = {
  available:   { label: 'Disponible',   color: '#16a34a', bg: '#dcfce7' },
  maybe:       { label: 'Peut-être',    color: '#d97706', bg: '#fef3c7' },
  unavailable: { label: 'Indisponible', color: '#dc2626', bg: '#fee2e2' },
}

// ---------------------------------------------------------------------------
// Player info modal
// ---------------------------------------------------------------------------
function PlayerModal({
  player,
  phaseGamesPlayed,
  phasePoints,
  onClose,
}: {
  player: Player
  phaseGamesPlayed: number
  phasePoints: string | undefined
  onClose: () => void
}) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <Pressable style={modal.sheet} onPress={() => {}}>
          <View style={modal.handle} />
          <Text style={modal.name}>{player.firstName} {player.lastName}</Text>
          <View style={modal.rows}>
            <ModalRow label="Licence" value={player.licenseNumber} />
            {phasePoints ? <ModalRow label="Points (phase)" value={phasePoints} /> : null}
            <ModalRow label="Matchs joués" value={String(phaseGamesPlayed)} />
            {player.phone ? <ModalRow label="Téléphone" value={player.phone} /> : null}
            {player.email ? <ModalRow label="Email" value={player.email} /> : null}
          </View>
          <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
            <Text style={modal.closeTxt}>Fermer</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function ModalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={modal.row}>
      <Text style={modal.label}>{label}</Text>
      <Text style={modal.value}>{value}</Text>
    </View>
  )
}

const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  rows: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flexShrink: 1, textAlign: 'right' },
  closeBtn: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  closeTxt: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
})

// ---------------------------------------------------------------------------
// Availability pills (for the logged-in user row)
// ---------------------------------------------------------------------------
function AvailabilityPicker({
  current,
  disabled,
  onChange,
}: {
  current: AvailabilityStatus | undefined
  disabled: boolean
  onChange: (s: AvailabilityStatus) => void
}) {
  return (
    <View style={av.row}>
      {(Object.entries(AVAIL) as [AvailabilityStatus, typeof AVAIL[AvailabilityStatus]][]).map(([status, cfg]) => {
        const active = current === status
        return (
          <TouchableOpacity
            key={status}
            disabled={disabled}
            onPress={() => onChange(status)}
            style={[
              av.pill,
              { backgroundColor: active ? cfg.bg : colors.bg },
              active && { borderColor: cfg.color },
              disabled && av.pillDisabled,
            ]}
          >
            <Text style={[av.pillTxt, { color: active ? cfg.color : colors.textSecondary }]}>
              {cfg.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const av = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillDisabled: { opacity: 0.45 },
  pillTxt: { fontSize: 12, fontWeight: '500' },
})

// ---------------------------------------------------------------------------
// Single player row used in both current-week and past-game cards
// ---------------------------------------------------------------------------
function PlayerRow({
  player,
  availability,
  selected,
  isMe,
  gameDatePast,
  onPickAvailability,
  onPress,
}: {
  player: Player
  availability: AvailabilityStatus | undefined
  selected: boolean
  isMe: boolean
  gameDatePast: boolean
  onPickAvailability?: (s: AvailabilityStatus) => void
  onPress: () => void
}) {
  const cfg = availability ? AVAIL[availability] : null
  return (
    <View style={pr.wrapper}>
      <View style={pr.row}>
        <TouchableOpacity style={pr.nameBtn} onPress={onPress}>
          <Text style={[pr.name, isMe && pr.nameMe]}>{player.firstName} {player.lastName}</Text>
        </TouchableOpacity>
        <View style={pr.badges}>
          {selected && (
            <View style={pr.selectedBadge}>
              <Text style={pr.selectedTxt}>✓</Text>
            </View>
          )}
          {cfg ? (
            <View style={[pr.availBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[pr.availTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          ) : (
            <Text style={pr.noAvail}>—</Text>
          )}
        </View>
      </View>
      {isMe && onPickAvailability && (
        <AvailabilityPicker
          current={availability}
          disabled={gameDatePast}
          onChange={onPickAvailability}
        />
      )}
    </View>
  )
}

const pr = StyleSheet.create({
  wrapper: { paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameBtn: { flex: 1 },
  name: { fontSize: 14, color: colors.textPrimary },
  nameMe: { fontWeight: '700', color: colors.accent },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  availBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  availTxt: { fontSize: 11, fontWeight: '600' },
  noAvail: { fontSize: 12, color: colors.border },
})

// ---------------------------------------------------------------------------
// Game card — current week (with availability editing)
// ---------------------------------------------------------------------------
function CurrentWeekGameCard({
  game,
  matchDayDate,
  teamName,
  opponentName,
  divisionLabel,
  teamPlayers,
  myPlayerId,
  getAvailability,
  getSelected,
  onPickAvailability,
  onPlayerPress,
}: {
  game: { id: string; time?: string }
  matchDayDate: string
  teamName: string
  opponentName: string
  divisionLabel: string | undefined
  teamPlayers: Player[]
  myPlayerId: string | undefined
  getAvailability: (pid: string) => AvailabilityStatus | undefined
  getSelected: (pid: string) => boolean
  onPickAvailability: (status: AvailabilityStatus) => void
  onPlayerPress: (p: Player) => void
}) {
  const today = todayIso()
  const gameDatePast = matchDayDate < today

  const dateLabel = new Date(matchDayDate + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <View style={card.container}>
      <View style={card.header}>
        <Text style={card.title}>{teamName} – {opponentName}</Text>
        <View style={card.meta}>
          <Text style={card.metaTxt}>{dateLabel}{game.time ? `  🕐 ${game.time}` : ''}</Text>
        </View>
        {divisionLabel && <Text style={card.division}>{divisionLabel}</Text>}
      </View>
      <View style={card.body}>
        {teamPlayers.map((p) => (
          <PlayerRow
            key={p.id}
            player={p}
            availability={getAvailability(p.id)}
            selected={getSelected(p.id)}
            isMe={p.id === myPlayerId}
            gameDatePast={gameDatePast}
            onPickAvailability={p.id === myPlayerId ? onPickAvailability : undefined}
            onPress={() => onPlayerPress(p)}
          />
        ))}
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Game card — past (selected players only, no availability)
// ---------------------------------------------------------------------------
function PastGameCard({
  matchDayDate,
  teamName,
  opponentName,
  selectedPlayers,
  onPlayerPress,
}: {
  matchDayDate: string
  teamName: string
  opponentName: string
  selectedPlayers: Player[]
  onPlayerPress: (p: Player) => void
}) {
  const dateLabel = new Date(matchDayDate + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return (
    <View style={card.container}>
      <View style={card.header}>
        <Text style={card.title}>{teamName} – {opponentName}</Text>
        <Text style={card.metaTxt}>{dateLabel}</Text>
      </View>
      {selectedPlayers.length > 0 && (
        <View style={card.body}>
          {selectedPlayers.map((p) => (
            <TouchableOpacity key={p.id} style={pr.nameBtn} onPress={() => onPlayerPress(p)}>
              <Text style={[pr.name, { paddingVertical: 4 }]}>{p.firstName} {p.lastName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const card = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  header: { padding: 14, gap: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  meta: { flexDirection: 'row', gap: 8 },
  metaTxt: { fontSize: 13, color: colors.textSecondary },
  division: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  body: { padding: 14, gap: 2 },
})

// ---------------------------------------------------------------------------
// Section header with optional collapse toggle
// ---------------------------------------------------------------------------
function SectionHeader({
  title,
  collapsible,
  expanded,
  onToggle,
}: {
  title: string
  collapsible?: boolean
  expanded?: boolean
  onToggle?: () => void
}) {
  return (
    <TouchableOpacity
      disabled={!collapsible}
      onPress={onToggle}
      style={sh.row}
    >
      <Text style={sh.title}>{title}</Text>
      {collapsible && <Text style={sh.chevron}>{expanded ? '▾' : '▸'}</Text>}
    </TouchableOpacity>
  )
}

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 },
  title: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  chevron: { fontSize: 16, color: colors.textSecondary },
})

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const { user, displayName, roleLabel, logout } = useAuth()
  const {
    clubs, seasons, teams, players, matchDays, games,
    phases, divisions, groups,
    gameAvailabilities, gameSelections,
    setAvailability,
  } = useAppData()

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [prevPhasesExpanded, setPrevPhasesExpanded] = useState<Set<string>>(new Set())

  const today = todayIso()
  const currentWeekMonday = getMondayOf(today)

  // ---------------------------------------------------------------------------
  // Derive player's team in each phase
  // ---------------------------------------------------------------------------
  const myPlayerId = user?.playerId

  // phaseId → team the player belongs to
  const myTeamByPhase = useMemo(() => {
    if (!myPlayerId) return new Map<string, typeof teams[0]>()
    const map = new Map<string, typeof teams[0]>()
    for (const t of teams) {
      if (t.playerIds.includes(myPlayerId)) {
        map.set(t.phaseId, t)
      }
    }
    return map
  }, [teams, myPlayerId])

  const activePhase = phases.find((p) => p.isActive)
  const myActiveTeam = activePhase ? myTeamByPhase.get(activePhase.id) : undefined

  // ---------------------------------------------------------------------------
  // Build lookup helpers
  // ---------------------------------------------------------------------------
  const divMap = useMemo(() => new Map(divisions.map((d) => [d.id, d])), [divisions])
  const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups])
  const mdMap = useMemo(() => new Map(matchDays.map((md) => [md.id, md])), [matchDays])
  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])

  function getTeamGames(teamId: string) {
    return games.filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId)
  }

  function getOpponentName(game: typeof games[0], ourTeamId: string): string {
    const oppId = game.homeTeamId === ourTeamId ? game.awayTeamId : game.homeTeamId
    const opp = teams.find((t) => t.id === oppId)
    return opp ? getTeamName(opp, clubs) : '?'
  }

  function getDivisionLabel(team: typeof teams[0]): string | undefined {
    const grp = groupMap.get(team.groupId)
    const div = grp ? divMap.get(grp.divisionId) : undefined
    return div?.displayName
  }

  function getAvailability(playerId: string, gameId: string): AvailabilityStatus | undefined {
    return gameAvailabilities.find((a) => a.playerId === playerId && a.gameId === gameId)?.status
  }

  function getSelectedForGame(teamId: string, gameId: string): string[] {
    return gameSelections.find((s) => s.teamId === teamId && s.gameId === gameId)?.playerIds ?? []
  }

  // ---------------------------------------------------------------------------
  // Current-week games for the active team
  // ---------------------------------------------------------------------------
  const currentWeekGames = useMemo(() => {
    if (!myActiveTeam) return []
    const weekEnd = (() => {
      const d = new Date(currentWeekMonday + 'T12:00:00')
      d.setDate(d.getDate() + 6)
      return d.toISOString().slice(0, 10)
    })()
    return getTeamGames(myActiveTeam.id).filter((g) => {
      const md = mdMap.get(g.matchDayId)
      return md && md.date >= currentWeekMonday && md.date <= weekEnd
    })
  }, [myActiveTeam, games, mdMap, currentWeekMonday]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Past games in active phase
  // ---------------------------------------------------------------------------
  const pastActiveGames = useMemo(() => {
    if (!myActiveTeam) return []
    return getTeamGames(myActiveTeam.id)
      .filter((g) => {
        const md = mdMap.get(g.matchDayId)
        // Past = week has ended (Monday of game's week < currentWeekMonday)
        return md && getMondayOf(md.date) < currentWeekMonday
      })
      .sort((a, b) => {
        const da = mdMap.get(a.matchDayId)?.date ?? ''
        const db = mdMap.get(b.matchDayId)?.date ?? ''
        return db.localeCompare(da) // most-recent first
      })
  }, [myActiveTeam, games, mdMap, currentWeekMonday]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Previous phases: find phases where player had a team, sorted newest-first
  // ---------------------------------------------------------------------------
  const prevPhases = useMemo(() => {
    if (!myPlayerId) return []
    return phases
      .filter((p) => !p.isActive && myTeamByPhase.has(p.id))
      .sort((a, b) => b.displayName.localeCompare(a.displayName))
  }, [phases, myTeamByPhase, myPlayerId])

  function getPrevPhaseGames(phaseId: string) {
    const team = myTeamByPhase.get(phaseId)
    if (!team) return []
    return getTeamGames(team.id)
      .filter((g) => {
        const md = mdMap.get(g.matchDayId)
        return md && md.date < today
      })
      .sort((a, b) => {
        const da = mdMap.get(a.matchDayId)?.date ?? ''
        const db = mdMap.get(b.matchDayId)?.date ?? ''
        return db.localeCompare(da)
      })
  }

  function togglePrevPhase(phaseId: string) {
    setPrevPhasesExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) next.delete(phaseId)
      else next.add(phaseId)
      return next
    })
  }

  // ---------------------------------------------------------------------------
  // Player modal data
  // ---------------------------------------------------------------------------
  function getPhasePoints(player: Player): string | undefined {
    // Try the active team's rosterInitialPoints, then player.points
    const team = activePhase ? myTeamByPhase.get(activePhase.id) : undefined
    return team?.rosterInitialPoints?.[player.id] ?? player.points
  }

  function getGamesPlayedForPlayer(player: Player): number {
    // Find the active team the player belongs to
    const team = teams.find(
      (t) => t.phaseId === activePhase?.id && t.playerIds.includes(player.id),
    )
    if (!team) return 0
    return getTeamGames(team.id).filter((g) => {
      const md = mdMap.get(g.matchDayId)
      return md && md.date < today
    }).length
  }

  // ---------------------------------------------------------------------------
  // Non-player fallback view (admins, etc.)
  // ---------------------------------------------------------------------------
  const activeSeason = seasons.find((s) => s.isActive)
  const upcomingMatchDays = matchDays
    .filter((md) => new Date(md.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  const isPlayer = !!myPlayerId && !!myActiveTeam

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Welcome card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcome}>Bonjour, {displayName} 👋</Text>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>

        {/* ── Player dashboard ── */}
        {isPlayer && myActiveTeam && (
          <>
            {/* Current week */}
            <SectionHeader title="Cette semaine" />
            {currentWeekGames.length === 0 ? (
              <Text style={styles.empty}>Pas de match cette semaine.</Text>
            ) : (
              currentWeekGames.map((game) => {
                const md = mdMap.get(game.matchDayId)!
                const teamPlayers = myActiveTeam.playerIds
                  .map((id) => playerMap.get(id))
                  .filter(Boolean) as Player[]
                const selection = getSelectedForGame(myActiveTeam.id, game.id)
                return (
                  <CurrentWeekGameCard
                    key={game.id}
                    game={game}
                    matchDayDate={md.date}
                    teamName={getTeamName(myActiveTeam, clubs)}
                    opponentName={getOpponentName(game, myActiveTeam.id)}
                    divisionLabel={getDivisionLabel(myActiveTeam)}
                    teamPlayers={teamPlayers}
                    myPlayerId={myPlayerId}
                    getAvailability={(pid) => getAvailability(pid, game.id)}
                    getSelected={(pid) => selection.includes(pid)}
                    onPickAvailability={(status) => setAvailability(myPlayerId!, game.id, status)}
                    onPlayerPress={setSelectedPlayer}
                  />
                )
              })
            )}

            {/* Past games — active phase */}
            {pastActiveGames.length > 0 && (
              <>
                <SectionHeader title={`Matchs passés — ${activePhase?.displayName}`} />
                {pastActiveGames.map((game) => {
                  const md = mdMap.get(game.matchDayId)!
                  const selection = getSelectedForGame(myActiveTeam.id, game.id)
                  const selectedPlayers = selection
                    .map((id) => playerMap.get(id))
                    .filter(Boolean) as Player[]
                  return (
                    <PastGameCard
                      key={game.id}
                      matchDayDate={md.date}
                      teamName={getTeamName(myActiveTeam, clubs)}
                      opponentName={getOpponentName(game, myActiveTeam.id)}
                      selectedPlayers={selectedPlayers}
                      onPlayerPress={setSelectedPlayer}
                    />
                  )
                })}
              </>
            )}

            {/* Previous phases */}
            {prevPhases.map((phase) => {
              const team = myTeamByPhase.get(phase.id)!
              const phaseGames = getPrevPhaseGames(phase.id)
              const expanded = prevPhasesExpanded.has(phase.id)
              return (
                <View key={phase.id}>
                  <SectionHeader
                    title={phase.displayName}
                    collapsible
                    expanded={expanded}
                    onToggle={() => togglePrevPhase(phase.id)}
                  />
                  {expanded &&
                    phaseGames.map((game) => {
                      const md = mdMap.get(game.matchDayId)!
                      const selection = getSelectedForGame(team.id, game.id)
                      const selectedPlayers = selection
                        .map((id) => playerMap.get(id))
                        .filter(Boolean) as Player[]
                      return (
                        <PastGameCard
                          key={game.id}
                          matchDayDate={md.date}
                          teamName={getTeamName(team, clubs)}
                          opponentName={getOpponentName(game, team.id)}
                          selectedPlayers={selectedPlayers}
                          onPlayerPress={setSelectedPlayer}
                        />
                      )
                    })}
                </View>
              )
            })}
          </>
        )}

        {/* ── Generic view for non-players ── */}
        {!isPlayer && (
          <>
            {activeSeason && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Saison en cours</Text>
                <Text style={styles.seasonName}>{activeSeason.displayName}</Text>
              </View>
            )}
            {upcomingMatchDays.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Prochaines journées</Text>
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
            )}
          </>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Player info modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          phasePoints={getPhasePoints(selectedPlayer)}
          phaseGamesPlayed={getGamesPlayedForPlayer(selectedPlayer)}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 4 },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 4,
  },
  welcome: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  roleText: { fontSize: 14, color: colors.accent, fontWeight: '500' },
  empty: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },

  // Generic view styles
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seasonName: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  matchDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchDayName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  matchDayDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  matchCount: { fontSize: 13, color: colors.textSecondary },

  logoutBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { fontSize: 15, color: colors.danger, fontWeight: '600' },
})
