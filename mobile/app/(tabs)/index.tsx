import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native'
import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { canManageTeam, getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import { GameSummary } from '@/components/GameSummary'
import { PlayerSheet } from '@/components/PlayerSheet'
import type { PlayerHistoryEntry } from '@/components/PlayerSheet'
import { computeBrulage, isPlayerEligibleForTeam } from '@/utils/brulage'
import { sortByName } from '@/utils/sortByName'
import type { AvailabilityStatus, Club, Player, Team, MatchDay, Game, GameSelection } from '@shared/types'

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
const ALL_STATUSES: AvailabilityStatus[] = ['available', 'maybe', 'unavailable']

const AVAIL: Record<AvailabilityStatus, { short: string; color: string; bg: string }> = {
  available:   { short: 'OUI', color: '#16a34a', bg: '#dcfce7' },
  maybe:       { short: 'PE',  color: '#d97706', bg: '#fef3c7' },
  unavailable: { short: 'NON', color: '#dc2626', bg: '#fee2e2' },
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface GameHistoryEntry {
  matchDayNumber: number
  team: Team
  isHome: boolean
  opponentName: string
  matchDayDate: string
  isPast: boolean
}

interface SelectionData {
  matchDayId: string
  allClubPlayers: Player[]
  clubTeams: Team[]
  matchDays: MatchDay[]
  games: Game[]
  gameSelections: GameSelection[]
}


// ---------------------------------------------------------------------------
// Player row — always-visible compact OUI/PE/NON pills
// ---------------------------------------------------------------------------
function PlayerRow({
  player,
  availability,
  selected,
  isMe,
  canEdit,
  gameDatePast,
  borrowed,
  onPickAvailability,
  onPressName,
}: {
  player: Player
  availability: AvailabilityStatus | undefined
  selected: boolean
  isMe: boolean
  canEdit: boolean
  gameDatePast: boolean
  /** Player selected from another team — shown without availability pills. */
  borrowed?: boolean
  onPickAvailability: (s: AvailabilityStatus) => void
  onPressName: () => void
}) {
  return (
    <View style={pr.row}>
      {selected ? (
        <View style={pr.checkBadge}><Text style={pr.checkTxt}>✓</Text></View>
      ) : (
        <View style={pr.checkPlaceholder} />
      )}

      <TouchableOpacity style={pr.nameBtn} onPress={onPressName}>
        <Text style={[pr.name, isMe && pr.nameMe]} numberOfLines={1}>
          {player.firstName} {player.lastName}
        </Text>
      </TouchableOpacity>

      {borrowed ? (
        <View style={pr.borrowedSlot}>
          <Text style={pr.borrowedTag}>Renfort</Text>
        </View>
      ) : (
        <View style={pr.pills}>
          {ALL_STATUSES.map((status) => {
            const cfg = AVAIL[status]
            const active = availability === status
            const editable = canEdit && !gameDatePast
            return (
              <TouchableOpacity
                key={status}
                disabled={!editable}
                onPress={() => onPickAvailability(status)}
                style={[
                  pr.pill,
                  active
                    ? { backgroundColor: cfg.bg, borderColor: cfg.color }
                    : { borderColor: colors.border },
                  !editable && pr.pillDisabled,
                ]}
              >
                <Text style={[pr.pillTxt, { color: active ? cfg.color : colors.textSecondary }]}>
                  {cfg.short}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
}

const pr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  checkBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  checkPlaceholder: { width: 18 },
  checkTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  nameBtn: { flex: 1 },
  name: { fontSize: 14, color: colors.textPrimary },
  nameMe: { fontWeight: '700', color: colors.accent },
  pills: { flexDirection: 'row', gap: 5 },
  pill: {
    width: 44, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  pillDisabled: { opacity: 0.5 },
  pillTxt: { fontSize: 11, fontWeight: '700' },
  // Occupies the same footprint as the 3 pills (3 × 44 + 2 × 5 gap = 142 wide)
  // with matching vertical padding + border so borrowed rows keep the same
  // height as roster rows, and centers the "Renfort" label.
  borrowedSlot: {
    width: 142,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowedTag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
})

// ---------------------------------------------------------------------------
// Captain selection sheet — two sections: team players + eligible others
// ---------------------------------------------------------------------------
function CaptainSelectionSheet({
  team,
  teamPlayers,
  clubs,
  playersPerGame,
  getAvailability,
  initialSelection,
  selectionData,
  onSave,
  onClose,
}: {
  team: Team
  teamPlayers: Player[]
  clubs: Club[]
  playersPerGame: number
  getAvailability: (pid: string) => AvailabilityStatus | undefined
  initialSelection: string[]
  selectionData: SelectionData
  onSave: (playerIds: string[]) => void
  onClose: () => void
}) {
  const [selection, setSelection] = useState<string[]>(initialSelection)
  const { matchDayId, allClubPlayers, clubTeams, matchDays, games, gameSelections } = selectionData

  const eligibleOthers = useMemo(() => {
    const teamPlayerIds = new Set(teamPlayers.map((p) => p.id))
    return allClubPlayers.filter((p) => {
      if (teamPlayerIds.has(p.id)) return false
      return isPlayerEligibleForTeam(p.id, team, clubTeams, matchDays, games, gameSelections, matchDayId)
    })
  }, [allClubPlayers, teamPlayers, team, clubTeams, matchDays, games, gameSelections, matchDayId])

  function toggle(pid: string) {
    setSelection((prev) => {
      if (prev.includes(pid)) return prev.filter((id) => id !== pid)
      if (prev.length >= playersPerGame) {
        Alert.alert('Limite atteinte', `Maximum ${playersPerGame} joueurs par match.`)
        return prev
      }
      return [...prev, pid]
    })
  }

  function renderPlayerRow(p: Player) {
    const avail = getAvailability(p.id)
    const picked = selection.includes(p.id)
    const cfg = avail ? AVAIL[avail] : null
    return (
      <TouchableOpacity key={p.id} style={sel.playerRow} onPress={() => toggle(p.id)}>
        <View style={[sel.check, picked && sel.checkActive]}>
          {picked && <Text style={sel.checkMark}>✓</Text>}
        </View>
        <Text style={[sel.playerName, picked && sel.playerNamePicked]}>
          {p.firstName} {p.lastName}
        </Text>
        {cfg ? (
          <View style={[sel.availChip, { backgroundColor: cfg.bg }]}>
            <Text style={[sel.availTxt, { color: cfg.color }]}>{cfg.short}</Text>
          </View>
        ) : (
          <Text style={sel.noAvail}>—</Text>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sel.backdrop} onPress={onClose}>
        {/* View + onStartShouldSetResponder stops backdrop from closing when tapping
            the sheet, without competing with nested TouchableOpacity rows */}
        <View style={sel.sheet} onStartShouldSetResponder={() => true}>
          <View style={sel.handle} />
          <Text style={sel.title}>
            Sélection — {getTeamName(team, clubs)} ({selection.length}/{playersPerGame})
          </Text>
          <ScrollView style={sel.list} showsVerticalScrollIndicator={false}>
            <Text style={sel.sectionLabel}>Cette équipe</Text>
            {teamPlayers.map(renderPlayerRow)}
            {eligibleOthers.length > 0 && (
              <>
                <Text style={sel.sectionLabel}>Autres joueurs</Text>
                {eligibleOthers.map(renderPlayerRow)}
              </>
            )}
          </ScrollView>
          <View style={sel.actions}>
            <TouchableOpacity style={sel.cancelBtn} onPress={onClose}>
              <Text style={sel.cancelTxt}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sel.saveBtn} onPress={() => { onSave(selection); onClose() }}>
              <Text style={sel.saveTxt}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}

const sel = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4,
  },
  list: { marginBottom: 16 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  check: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  checkActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  playerName: { flex: 1, fontSize: 15, color: colors.textPrimary },
  playerNamePicked: { fontWeight: '600', color: colors.accent },
  availChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  availTxt: { fontSize: 11, fontWeight: '600' },
  noAvail: { fontSize: 12, color: colors.border },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, borderRadius: 10, padding: 14,
    alignItems: 'center', backgroundColor: colors.bg,
  },
  cancelTxt: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: {
    flex: 1, borderRadius: 10, padding: 14,
    alignItems: 'center', backgroundColor: colors.accent,
  },
  saveTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
})

// ---------------------------------------------------------------------------
// Game card — handles both upcoming (full roster + pills) and past (selected
// players only); captain always gets the › chevron to edit selection
// ---------------------------------------------------------------------------
function GameCard({
  game,
  matchDayNumber,
  matchDayDate,
  teamName,
  opponentName,
  isHome,
  divisionLabel,
  team,
  teamPlayers,
  clubs,
  playersPerGame,
  myPlayerId,
  isCaptain,
  isPast,
  selectedPlayers,
  initialSelectionIds,
  getAvailability,
  getSelected,
  onPickAvailability,
  onPlayerPress,
  onSaveSelection,
  onOpenWeek,
  selectionData,
}: {
  game: { id: string; time?: string }
  matchDayNumber: number
  matchDayDate: string
  teamName: string
  opponentName: string
  /** Whether our team plays at home — drives the matchup order and the indicator. */
  isHome: boolean
  divisionLabel: string | undefined
  team: Team
  teamPlayers: Player[]
  clubs: Club[]
  playersPerGame: number
  myPlayerId: string | undefined
  isCaptain: boolean
  isPast: boolean
  /** Pre-resolved selected players for past view (may include non-roster borrowed players). */
  selectedPlayers: Player[]
  /** All currently selected player IDs for this game — passed straight from the parent
   *  so borrowed (non-roster) players are included in the selection sheet's initial state. */
  initialSelectionIds: string[]
  getAvailability: (pid: string) => AvailabilityStatus | undefined
  getSelected: (pid: string) => boolean
  onPickAvailability: (pid: string, status: AvailabilityStatus) => void
  onPlayerPress: (p: Player) => void
  onSaveSelection: (playerIds: string[]) => void
  /** Open the full week (all games of this match-day). */
  onOpenWeek: () => void
  selectionData: SelectionData
}) {
  const today = todayIso()
  const gameDatePast = matchDayDate < today
  const [showSelection, setShowSelection] = useState(false)

  const dateLabel = new Date(matchDayDate + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // Use the parent-supplied IDs so borrowed (non-roster) players stay checked
  const initialSelection = initialSelectionIds

  // Selected players who aren't on this team's roster (borrowed from another
  // team) — listed on the card but without availability data.
  const rosterIds = new Set(teamPlayers.map((p) => p.id))
  const borrowedSelected = selectedPlayers.filter((p) => !rosterIds.has(p.id))

  const header = (
    <TouchableOpacity style={gc.header} onPress={onOpenWeek} activeOpacity={0.7}>
      <View style={gc.headerTop}>
        <GameSummary
          style={gc.headerInfo}
          isHome={isHome}
          title={isHome ? `${teamName} – ${opponentName}` : `${opponentName} – ${teamName}`}
          dateLabel={dateLabel}
          time={game.time}
          matchDayNumber={matchDayNumber}
          divisionLabel={divisionLabel}
        />
        <Text style={gc.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={[gc.container, { borderLeftWidth: 6, borderLeftColor: team.color ?? colors.accent }]}>
      {header}

      {isPast ? (
        // Past: show pre-resolved selected players (includes borrowed non-roster players)
        selectedPlayers.length > 0 ? (
          <View style={gc.body}>
            {selectedPlayers.map((p) => (
              <TouchableOpacity key={p.id} onPress={() => onPlayerPress(p)}>
                <Text style={gc.pastPlayer}>{p.firstName} {p.lastName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null
      ) : (
        // Upcoming: full roster with availability pills, plus any borrowed
        // (non-roster) players that have been selected — shown without pills.
        <View style={gc.body}>
          {teamPlayers.map((p) => {
            const canEdit = isCaptain || p.id === myPlayerId
            return (
              <PlayerRow
                key={p.id}
                player={p}
                availability={getAvailability(p.id)}
                selected={getSelected(p.id)}
                isMe={p.id === myPlayerId}
                canEdit={canEdit}
                gameDatePast={gameDatePast}
                onPickAvailability={(status) => onPickAvailability(p.id, status)}
                onPressName={() => onPlayerPress(p)}
              />
            )
          })}
          {borrowedSelected.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              availability={undefined}
              selected
              isMe={p.id === myPlayerId}
              canEdit={false}
              gameDatePast={gameDatePast}
              borrowed
              onPickAvailability={() => {}}
              onPressName={() => onPlayerPress(p)}
            />
          ))}
        </View>
      )}

      {/* Captains compose the line-up via an explicit button — only for
          upcoming weeks, mirroring the availability pills (hidden once past). */}
      {isCaptain && !isPast && (
        <TouchableOpacity style={gc.selectBtn} onPress={() => setShowSelection(true)}>
          <Text style={gc.selectBtnText}>Composition</Text>
        </TouchableOpacity>
      )}

      {showSelection && (
        <CaptainSelectionSheet
          team={team}
          teamPlayers={teamPlayers}
          clubs={clubs}
          playersPerGame={playersPerGame}
          getAvailability={getAvailability}
          initialSelection={initialSelection}
          selectionData={selectionData}
          onSave={onSaveSelection}
          onClose={() => setShowSelection(false)}
        />
      )}
    </View>
  )
}

const gc = StyleSheet.create({
  container: {
    backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 10,
  },
  header: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerInfo: { flex: 1 },
  chevron: { fontSize: 28, color: colors.accent, lineHeight: 32 },
  body: { padding: 14 },
  pastPlayer: { fontSize: 14, color: colors.textSecondary, paddingVertical: 3 },
  selectBtn: {
    margin: 14,
    marginTop: 0,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  selectBtnText: { fontSize: 14, fontWeight: '600', color: colors.accent },
})

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
function SectionHeader({
  title, collapsible, expanded, onToggle,
}: {
  title: string; collapsible?: boolean; expanded?: boolean; onToggle?: () => void
}) {
  return (
    <TouchableOpacity disabled={!collapsible} onPress={onToggle} style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {collapsible && <Text style={sh.chevron}>{expanded ? '▾' : '▸'}</Text>}
    </TouchableOpacity>
  )
}

const sh = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, marginTop: 4,
  },
  title: {
    fontSize: 13, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chevron: { fontSize: 16, color: colors.textSecondary },
})

// ---------------------------------------------------------------------------
// Home screen
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

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null)

  function openPlayer(player: Player, phaseId: string) {
    setSelectedPlayer(player)
    setSelectedPhaseId(phaseId)
  }
  function closePlayer() {
    setSelectedPlayer(null)
    setSelectedPhaseId(null)
  }
  const [prevPhasesExpanded, setPrevPhasesExpanded] = useState<Set<string>>(new Set())
  const [activePastExpanded, setActivePastExpanded] = useState(true)

  const today = todayIso()
  const currentWeekMonday = getMondayOf(today)

  const myPlayerId = user?.isPlayer ? user.id : undefined

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

  const divMap = useMemo(() => new Map(divisions.map((d) => [d.id, d])), [divisions])
  const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups])
  const mdMap = useMemo(() => new Map(matchDays.map((md) => [md.id, md])), [matchDays])
  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])

  function getTeamGames(teamId: string) {
    return games.filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId)
  }

  function getOpponentName(game: (typeof games)[0], ourTeamId: string): string {
    const oppId = game.homeTeamId === ourTeamId ? game.awayTeamId : game.homeTeamId
    const opp = teams.find((t) => t.id === oppId)
    return opp ? getTeamName(opp, clubs) : '?'
  }

  function getDivisionLabel(team: Team): string | undefined {
    const grp = groupMap.get(team.groupId)
    const div = grp ? divMap.get(grp.divisionId) : undefined
    return div?.displayName
  }

  function getPlayersPerGame(team: Team): number {
    const grp = groupMap.get(team.groupId)
    const div = grp ? divMap.get(grp.divisionId) : undefined
    return div?.playersPerGame ?? 4
  }

  function getAvailability(playerId: string, gameId: string): AvailabilityStatus | undefined {
    return gameAvailabilities.find((a) => a.playerId === playerId && a.gameId === gameId)?.status
  }

  function getSelectedForGame(teamId: string, gameId: string): string[] {
    return gameSelections.find((s) => s.teamId === teamId && s.gameId === gameId)?.playerIds ?? []
  }

  const upcomingGames = useMemo(() => {
    if (!myActiveTeam) return []
    return getTeamGames(myActiveTeam.id)
      .filter((g) => {
        const md = mdMap.get(g.matchDayId)
        return md && getMondayOf(md.date) >= currentWeekMonday
      })
      .sort((a, b) => {
        const da = mdMap.get(a.matchDayId)?.date ?? ''
        const db = mdMap.get(b.matchDayId)?.date ?? ''
        return da.localeCompare(db)
      })
  }, [myActiveTeam, games, mdMap, currentWeekMonday]) // eslint-disable-line react-hooks/exhaustive-deps

  const pastActiveGames = useMemo(() => {
    if (!myActiveTeam) return []
    return getTeamGames(myActiveTeam.id)
      .filter((g) => {
        const md = mdMap.get(g.matchDayId)
        return md && getMondayOf(md.date) < currentWeekMonday
      })
      .sort((a, b) => {
        const da = mdMap.get(a.matchDayId)?.date ?? ''
        const db = mdMap.get(b.matchDayId)?.date ?? ''
        return db.localeCompare(da)
      })
  }, [myActiveTeam, games, mdMap, currentWeekMonday]) // eslint-disable-line react-hooks/exhaustive-deps

  const prevPhases = useMemo(
    () =>
      phases
        .filter((p) => !p.isActive && myTeamByPhase.has(p.id))
        .sort((a, b) => b.displayName.localeCompare(a.displayName)),
    [phases, myTeamByPhase],
  )

  function getPrevPhaseGames(phaseId: string) {
    const team = myTeamByPhase.get(phaseId)
    if (!team) return []
    return getTeamGames(team.id)
      .filter((g) => { const md = mdMap.get(g.matchDayId); return md && md.date < today })
      .sort((a, b) => {
        const da = mdMap.get(a.matchDayId)?.date ?? ''
        const db = mdMap.get(b.matchDayId)?.date ?? ''
        return db.localeCompare(da)
      })
  }

  function togglePrevPhase(id: string) {
    setPrevPhasesExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Club teams in active phase (for brûlage eligibility)
  const activeClubTeams = useMemo(() => {
    if (!myActiveTeam || !activePhase) return []
    return teams.filter((t) => t.clubId === myActiveTeam.clubId && t.phaseId === activePhase.id)
  }, [teams, myActiveTeam, activePhase])

  // All players from the same club (for "Autres joueurs" in selection sheet)
  const allClubPlayers = useMemo(() => {
    if (!myActiveTeam) return []
    return players.filter((p) => p.clubId === myActiveTeam.clubId)
  }, [players, myActiveTeam])

  function getGameHistoryForPlayer(player: Player, phaseId?: string): GameHistoryEntry[] {
    const entries: GameHistoryEntry[] = []
    for (const team of teams) {
      if (team.clubId !== player.clubId) continue
      if (phaseId && team.phaseId !== phaseId) continue
      for (const g of getTeamGames(team.id)) {
        const sel = getSelectedForGame(team.id, g.id)
        if (!sel.includes(player.id)) continue
        const md = mdMap.get(g.matchDayId)
        if (!md) continue
        const isHome = g.homeTeamId === team.id
        const oppTeam = teams.find((t) => t.id === (isHome ? g.awayTeamId : g.homeTeamId))
        entries.push({
          matchDayNumber: md.number,
          team,
          isHome,
          opponentName: oppTeam ? getTeamName(oppTeam, clubs) : '—',
          matchDayDate: md.date,
          isPast: md.date < today,
        })
      }
    }
    return entries.sort((a, b) => a.matchDayDate.localeCompare(b.matchDayDate))
  }


  const isPlayer = !!myPlayerId && !!myActiveTeam
  const activeSeason = seasons.find((s) => s.isActive)
  const upcomingMatchDays = matchDays
    .filter((md) => new Date(md.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  // Welcome card subtitle: team info or generic role label
  const teamSubtitle = myActiveTeam
    ? (isCaptain
        ? `Capitaine — Équipe ${myActiveTeam.number}`
        : `Équipe ${myActiveTeam.number}`)
    : null

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcome}>Bonjour, {displayName} 👋</Text>
          {teamSubtitle ? (
            <Text style={styles.roleText}>{teamSubtitle}</Text>
          ) : null}
        </View>

        {/* ── Player dashboard ── */}
        {isPlayer && myActiveTeam && (
          <>
            <SectionHeader title="Prochains matchs" />
            {upcomingGames.length === 0 ? (
              <Text style={styles.empty}>Pas de prochain match.</Text>
            ) : (
              upcomingGames.map((game) => {
                const md = mdMap.get(game.matchDayId)!
                const teamPlayers = sortByName(
                  myActiveTeam.playerIds
                    .map((id) => playerMap.get(id))
                    .filter(Boolean) as Player[],
                )
                const selIds = getSelectedForGame(myActiveTeam.id, game.id)
                return (
                  <GameCard
                    key={game.id}
                    game={game}
                    matchDayNumber={md.number}
                    matchDayDate={md.date}
                    teamName={getTeamName(myActiveTeam, clubs)}
                    opponentName={getOpponentName(game, myActiveTeam.id)}
                    isHome={game.homeTeamId === myActiveTeam.id}
                    divisionLabel={getDivisionLabel(myActiveTeam)}
                    team={myActiveTeam}
                    teamPlayers={teamPlayers}
                    clubs={clubs}
                    playersPerGame={getPlayersPerGame(myActiveTeam)}
                    myPlayerId={myPlayerId}
                    isCaptain={isCaptain}
                    isPast={false}
                    selectedPlayers={selIds.map((id) => playerMap.get(id)).filter(Boolean) as Player[]}
                    initialSelectionIds={selIds}
                    getAvailability={(pid) => getAvailability(pid, game.id)}
                    getSelected={(pid) => selIds.includes(pid)}
                    onPickAvailability={(pid, status) => setAvailability(pid, game.id, status)}
                    onPlayerPress={(p) => openPlayer(p, activePhase!.id)}
                    onSaveSelection={(playerIds) => setGameSelection(myActiveTeam.id, game.id, playerIds)}
                    onOpenWeek={() => router.push(`/week/${getMondayOf(md.date)}`)}
                    selectionData={{
                      matchDayId: game.matchDayId,
                      allClubPlayers,
                      clubTeams: activeClubTeams,
                      matchDays,
                      games,
                      gameSelections,
                    }}
                  />
                )
              })
            )}

            {pastActiveGames.length > 0 && (
              <>
                <SectionHeader
                  title={`Matchs passés — ${activePhase?.displayName}`}
                  collapsible
                  expanded={activePastExpanded}
                  onToggle={() => setActivePastExpanded((v) => !v)}
                />
                {activePastExpanded && pastActiveGames.map((game) => {
                  const md = mdMap.get(game.matchDayId)!
                  const teamPlayers = myActiveTeam.playerIds
                    .map((id) => playerMap.get(id))
                    .filter(Boolean) as Player[]
                  const selIds = getSelectedForGame(myActiveTeam.id, game.id)
                  return (
                    <GameCard
                      key={game.id}
                      game={game}
                      matchDayNumber={md.number}
                      matchDayDate={md.date}
                      teamName={getTeamName(myActiveTeam, clubs)}
                      opponentName={getOpponentName(game, myActiveTeam.id)}
                      isHome={game.homeTeamId === myActiveTeam.id}
                      divisionLabel={getDivisionLabel(myActiveTeam)}
                      team={myActiveTeam}
                      teamPlayers={teamPlayers}
                      clubs={clubs}
                      playersPerGame={getPlayersPerGame(myActiveTeam)}
                      myPlayerId={myPlayerId}
                      isCaptain={isCaptain}
                      isPast={true}
                      selectedPlayers={selIds.map((id) => playerMap.get(id)).filter(Boolean) as Player[]}
                      initialSelectionIds={selIds}
                      getAvailability={(pid) => getAvailability(pid, game.id)}
                      getSelected={(pid) => selIds.includes(pid)}
                      onPickAvailability={(pid, status) => setAvailability(pid, game.id, status)}
                      onPlayerPress={(p) => openPlayer(p, activePhase!.id)}
                      onSaveSelection={(playerIds) => setGameSelection(myActiveTeam.id, game.id, playerIds)}
                      onOpenWeek={() => router.push(`/week/${getMondayOf(md.date)}`)}
                      selectionData={{
                        matchDayId: game.matchDayId,
                        allClubPlayers,
                        clubTeams: activeClubTeams,
                        matchDays,
                        games,
                        gameSelections,
                      }}
                    />
                  )
                })}
              </>
            )}

            {prevPhases.map((phase) => {
              const team = myTeamByPhase.get(phase.id)!
              const phaseGames = getPrevPhaseGames(phase.id)
              const expanded = prevPhasesExpanded.has(phase.id)
              const phaseClubTeams = teams.filter(
                (t) => t.clubId === team.clubId && t.phaseId === phase.id,
              )
              const phasePlayers = players.filter((p) => p.clubId === team.clubId)
              return (
                <View key={phase.id}>
                  <SectionHeader
                    title={phase.displayName} collapsible expanded={expanded}
                    onToggle={() => togglePrevPhase(phase.id)}
                  />
                  {expanded && phaseGames.map((game) => {
                    const md = mdMap.get(game.matchDayId)!
                    const teamPlayers = sortByName(
                      team.playerIds
                        .map((id) => playerMap.get(id))
                        .filter(Boolean) as Player[],
                    )
                    const selIds = getSelectedForGame(team.id, game.id)
                    return (
                      <GameCard
                        key={game.id}
                        game={game}
                        matchDayNumber={md.number}
                        matchDayDate={md.date}
                        teamName={getTeamName(team, clubs)}
                        opponentName={getOpponentName(game, team.id)}
                        isHome={game.homeTeamId === team.id}
                        divisionLabel={getDivisionLabel(team)}
                        team={team}
                        teamPlayers={teamPlayers}
                        clubs={clubs}
                        playersPerGame={getPlayersPerGame(team)}
                        myPlayerId={myPlayerId}
                        isCaptain={!!(user && canManageTeam(user, team))}
                        isPast={true}
                        selectedPlayers={selIds.map((id) => playerMap.get(id)).filter(Boolean) as Player[]}
                        initialSelectionIds={selIds}
                        getAvailability={(pid) => getAvailability(pid, game.id)}
                        getSelected={(pid) => selIds.includes(pid)}
                        onPickAvailability={(pid, status) => setAvailability(pid, game.id, status)}
                        onPlayerPress={(p) => openPlayer(p, phase.id)}
                        onSaveSelection={(playerIds) => setGameSelection(team.id, game.id, playerIds)}
                        onOpenWeek={() => router.push(`/week/${getMondayOf(md.date)}`)}
                        selectionData={{
                          matchDayId: game.matchDayId,
                          allClubPlayers: phasePlayers,
                          clubTeams: phaseClubTeams,
                          matchDays,
                          games,
                          gameSelections,
                        }}
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

      </ScrollView>

      {selectedPlayer && selectedPhaseId && (() => {
        const viewPhase = phases.find((p) => p.id === selectedPhaseId)
        const viewTeam = myTeamByPhase.get(selectedPhaseId) ?? null
        const viewClubTeams = viewTeam
          ? teams.filter((t) => t.clubId === viewTeam.clubId && t.phaseId === selectedPhaseId)
          : []
        const brulage = computeBrulage(selectedPlayer.id, viewClubTeams, matchDays, games, gameSelections)
        const viewBrulageTeam = brulage.burnedIntoTeamId
          ? teams.find((t) => t.id === brulage.burnedIntoTeamId) ?? null
          : null
        const history = getGameHistoryForPlayer(selectedPlayer, selectedPhaseId)
        return (
          <PlayerSheet
            player={selectedPlayer}
            phaseLabel={viewPhase ? `Saison ${viewPhase.displayName}` : undefined}
            phasePoints={viewTeam?.rosterInitialPoints?.[selectedPlayer.id]}
            gamesPlayed={history.filter((e) => e.isPast).length}
            team={viewTeam}
            brulageTeam={viewBrulageTeam}
            history={history.map(
              (e): PlayerHistoryEntry => ({
                jNumber: e.matchDayNumber,
                icon: e.isHome ? 'home' : 'paper-plane-outline',
                text: e.opponentName,
                team: e.team,
                date: new Date(e.matchDayDate + 'T12:00:00').toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short',
                }),
                isPast: e.isPast,
              }),
            )}
            onClose={closePlayer}
            onProfile={() => {
              const id = selectedPlayer.id
              closePlayer()
              router.push(`/(tabs)/joueurs/${id}`)
            }}
          />
        )
      })()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 4 },
  welcomeCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16, gap: 4,
  },
  welcome: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  roleText: { fontSize: 14, color: colors.accent, fontWeight: '500' },
  empty: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  card: {
    backgroundColor: colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 6, marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  seasonName: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  matchDayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border,
  },
  matchDayName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  matchDayDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  matchCount: { fontSize: 13, color: colors.textSecondary },
})
