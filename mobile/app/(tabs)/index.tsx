import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  Pressable,
  Alert,
} from 'react-native'
import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { canManageTeam, getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
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
  teamNumber: number
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
// Color helper — converts #rrggbb to rgba() for semi-transparent backgrounds
// ---------------------------------------------------------------------------
function hexToRgba(hex: string, alpha: number): string {
  try {
    const h = hex.startsWith('#') && hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex
    const r = parseInt(h.slice(1, 3), 16)
    const g = parseInt(h.slice(3, 5), 16)
    const b = parseInt(h.slice(5, 7), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error('bad hex')
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(226,59,59,${alpha})`
  }
}

// ---------------------------------------------------------------------------
// Player info modal
// ---------------------------------------------------------------------------
function PlayerModal({
  player,
  phaseGamesPlayed,
  phasePoints,
  gameHistory,
  playerTeam,
  brulageTeam,
  onClose,
}: {
  player: Player
  phaseGamesPlayed: number
  phasePoints: string | undefined
  gameHistory: GameHistoryEntry[]
  /** The team the player is registered with in the active phase. */
  playerTeam: Team | null
  /** The team the player is brûlé into (null = not burned). */
  brulageTeam: Team | null
  onClose: () => void
}) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <View style={modal.sheet} onStartShouldSetResponder={() => true}>
          <View style={modal.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modal.name}>{player.firstName} {player.lastName}</Text>
            <View style={modal.rows}>
              <ModalRow label="Licence" value={player.licenseNumber} />
              {phasePoints ? <ModalRow label="Points (phase)" value={phasePoints} /> : null}
              <ModalRow label="Matchs joués" value={String(phaseGamesPlayed)} />
              {playerTeam ? <ModalTeamRow label="Équipe" team={playerTeam} /> : null}
              {brulageTeam ? <ModalTeamRow label="Brûlage" team={brulageTeam} burned /> : null}
              {player.phone ? <ModalRow label="Téléphone" value={player.phone} /> : null}
              {player.email ? <ModalRow label="Email" value={player.email} /> : null}
            </View>

            {gameHistory.length > 0 && (
              <View style={modal.historySection}>
                <Text style={modal.historyTitle}>Historique (phase en cours)</Text>
                {gameHistory.map((entry, i) => {
                  const date = new Date(entry.matchDayDate + 'T12:00:00').toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short',
                  })
                  return (
                    <View key={i} style={modal.historyRow}>
                      <Text style={[modal.historyText, entry.isPast && modal.historyPast]}>
                        J{entry.matchDayNumber} · Équipe {entry.teamNumber}
                      </Text>
                      <Text style={[modal.historyDate, entry.isPast && modal.historyPast]}>
                        {date}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}

            <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
              <Text style={modal.closeTxt}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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

function ModalTeamRow({ label, team, burned = false }: { label: string; team: Team; burned?: boolean }) {
  const tc = team.color ?? colors.accent
  const bg = hexToRgba(tc, 0.1)
  const teamLabel = burned ? `Brûlé — Équipe ${team.number}` : `Équipe ${team.number}`
  return (
    <View style={modal.row}>
      <Text style={modal.label}>{label}</Text>
      <View style={[modal.teamBadge, { borderColor: tc, backgroundColor: bg }]}>
        <View style={[modal.teamDot, { backgroundColor: tc }]} />
        <Text style={[modal.teamBadgeTxt, { color: tc }]}>{teamLabel}</Text>
      </View>
    </View>
  )
}

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  rows: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flexShrink: 1, textAlign: 'right' },
  historySection: { marginTop: 20, gap: 6 },
  historyTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  historyText: { fontSize: 14, color: colors.textPrimary },
  historyDate: { fontSize: 13, color: colors.textSecondary },
  historyPast: { color: '#94a3b8' },
  teamBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  teamDot: { width: 7, height: 7, borderRadius: 4 },
  teamBadgeTxt: { fontSize: 13, fontWeight: '600' },
  closeBtn: {
    backgroundColor: colors.bg, borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 20,
  },
  closeTxt: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
})

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
  onPickAvailability,
  onPressName,
}: {
  player: Player
  availability: AvailabilityStatus | undefined
  selected: boolean
  isMe: boolean
  canEdit: boolean
  gameDatePast: boolean
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
  selectionData,
}: {
  game: { id: string; time?: string }
  matchDayNumber: number
  matchDayDate: string
  teamName: string
  opponentName: string
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

  const header = (
    <View style={gc.header}>
      <View style={gc.headerTop}>
        <View style={gc.headerInfo}>
          <Text style={gc.title}>{teamName} – {opponentName}</Text>
          <Text style={gc.meta}>{dateLabel}{!isPast && game.time ? `  🕐 ${game.time}` : ''}</Text>
          <View style={gc.badges}>
            <Text style={gc.badge}>J{matchDayNumber}</Text>
            {divisionLabel ? <Text style={gc.badge}>{divisionLabel}</Text> : null}
          </View>
        </View>
        {isCaptain && (
          <TouchableOpacity style={gc.chevronBtn} onPress={() => setShowSelection(true)}>
            <Text style={gc.chevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <View style={gc.container}>
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
        // Upcoming: full roster with availability pills
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
        </View>
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
  headerInfo: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textSecondary },
  badges: { flexDirection: 'row', gap: 4, marginTop: 4 },
  badge: {
    fontSize: 11, fontWeight: '600',
    color: colors.accent, backgroundColor: '#eff6ff',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  chevronBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  chevron: { fontSize: 28, color: colors.accent, lineHeight: 32 },
  body: { padding: 14 },
  pastPlayer: { fontSize: 14, color: colors.textSecondary, paddingVertical: 3 },
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
  const { user, displayName } = useAuth()
  const {
    clubs, seasons, teams, players, matchDays, games,
    phases, divisions, groups,
    gameAvailabilities, gameSelections,
    setAvailability, setGameSelection,
  } = useAppData()

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
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

  function getPhasePoints(player: Player): string | undefined {
    const team = activePhase ? myTeamByPhase.get(activePhase.id) : undefined
    return team?.rosterInitialPoints?.[player.id]
  }

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
        entries.push({
          matchDayNumber: md.number,
          teamNumber: team.number,
          matchDayDate: md.date,
          isPast: md.date < today,
        })
      }
    }
    return entries.sort((a, b) => a.matchDayDate.localeCompare(b.matchDayDate))
  }

  function getGamesPlayedForPlayer(player: Player): number {
    return getGameHistoryForPlayer(player, activePhase?.id).filter((e) => e.isPast).length
  }

  // Player's registered team in the active phase
  const selectedPlayerTeam = useMemo(() => {
    if (!selectedPlayer || !activePhase) return null
    return teams.find(
      (t) => t.playerIds.includes(selectedPlayer.id) && t.phaseId === activePhase.id,
    ) ?? null
  }, [selectedPlayer, teams, activePhase])

  // Brûlage for the selected player
  const selectedPlayerBrulage = useMemo(() => {
    if (!selectedPlayer || activeClubTeams.length === 0) return null
    return computeBrulage(selectedPlayer.id, activeClubTeams, matchDays, games, gameSelections)
  }, [selectedPlayer, activeClubTeams, matchDays, games, gameSelections])

  // The team they are burned into (null = not burned)
  const selectedPlayerBrulageTeam = useMemo(() => {
    if (!selectedPlayerBrulage?.burnedIntoTeamId) return null
    return teams.find((t) => t.id === selectedPlayerBrulage.burnedIntoTeamId) ?? null
  }, [selectedPlayerBrulage, teams])

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
      <ScrollView contentContainerStyle={styles.scroll}>
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
                    onPlayerPress={setSelectedPlayer}
                    onSaveSelection={(playerIds) => setGameSelection(myActiveTeam.id, game.id, playerIds)}
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
                      onPlayerPress={setSelectedPlayer}
                      onSaveSelection={(playerIds) => setGameSelection(myActiveTeam.id, game.id, playerIds)}
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
                        onPlayerPress={setSelectedPlayer}
                        onSaveSelection={(playerIds) => setGameSelection(team.id, game.id, playerIds)}
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

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          phasePoints={getPhasePoints(selectedPlayer)}
          phaseGamesPlayed={getGamesPlayedForPlayer(selectedPlayer)}
          gameHistory={getGameHistoryForPlayer(selectedPlayer, activePhase?.id)}
          playerTeam={selectedPlayerTeam}
          brulageTeam={selectedPlayerBrulageTeam}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
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
