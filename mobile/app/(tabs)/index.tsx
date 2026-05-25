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
import type { AvailabilityStatus, Player, Team } from '@shared/types'

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
// Types
// ---------------------------------------------------------------------------
interface GameHistoryEntry {
  matchDayNumber: number
  teamNumber: number
  matchDayDate: string
  isPast: boolean
}

// ---------------------------------------------------------------------------
// Player info modal
// ---------------------------------------------------------------------------
function PlayerModal({
  player,
  phaseGamesPlayed,
  phasePoints,
  gameHistory,
  onClose,
}: {
  player: Player
  phaseGamesPlayed: number
  phasePoints: string | undefined
  gameHistory: GameHistoryEntry[]
  onClose: () => void
}) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <Pressable style={modal.sheet} onPress={() => {}}>
          <View style={modal.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modal.name}>{player.firstName} {player.lastName}</Text>
            <View style={modal.rows}>
              <ModalRow label="Licence" value={player.licenseNumber} />
              {phasePoints ? <ModalRow label="Points (phase)" value={phasePoints} /> : null}
              <ModalRow label="Matchs joués" value={String(phaseGamesPlayed)} />
              {player.phone ? <ModalRow label="Téléphone" value={player.phone} /> : null}
              {player.email ? <ModalRow label="Email" value={player.email} /> : null}
            </View>

            {gameHistory.length > 0 && (
              <View style={modal.historySection}>
                <Text style={modal.historyTitle}>Historique</Text>
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
  historyPast: { color: colors.border },
  closeBtn: {
    backgroundColor: colors.bg, borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 20,
  },
  closeTxt: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
})

// ---------------------------------------------------------------------------
// Availability pills
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
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  pill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
  },
  pillDisabled: { opacity: 0.45 },
  pillTxt: { fontSize: 12, fontWeight: '500' },
})

// ---------------------------------------------------------------------------
// Player row — inline availability, expandable picker
// ---------------------------------------------------------------------------
function PlayerRow({
  player,
  availability,
  selected,
  isMe,
  canEdit,
  gameDatePast,
  expanded,
  onToggleExpand,
  onPickAvailability,
  onPressName,
}: {
  player: Player
  availability: AvailabilityStatus | undefined
  selected: boolean
  isMe: boolean
  canEdit: boolean        // captain can edit anyone; player only edits self
  gameDatePast: boolean
  expanded: boolean
  onToggleExpand: () => void
  onPickAvailability: (s: AvailabilityStatus) => void
  onPressName: () => void
}) {
  const cfg = availability ? AVAIL[availability] : null
  const showPicker = expanded && canEdit && !gameDatePast

  return (
    <View style={pr.wrapper}>
      <TouchableOpacity
        style={pr.row}
        onPress={canEdit && !gameDatePast ? onToggleExpand : undefined}
        activeOpacity={canEdit && !gameDatePast ? 0.6 : 1}
      >
        {/* Selection check */}
        {selected ? (
          <View style={pr.checkBadge}><Text style={pr.checkTxt}>✓</Text></View>
        ) : (
          <View style={pr.checkPlaceholder} />
        )}

        {/* Name */}
        <TouchableOpacity style={pr.nameBtn} onPress={onPressName}>
          <Text style={[pr.name, isMe && pr.nameMe]} numberOfLines={1}>
            {player.firstName} {player.lastName}
          </Text>
        </TouchableOpacity>

        {/* Inline availability chip */}
        {cfg ? (
          <View style={[pr.availChip, { backgroundColor: cfg.bg }]}>
            <Text style={[pr.availTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        ) : (
          <Text style={pr.noAvail}>—</Text>
        )}
      </TouchableOpacity>

      {showPicker && (
        <AvailabilityPicker
          current={availability}
          disabled={false}
          onChange={onPickAvailability}
        />
      )}
    </View>
  )
}

const pr = StyleSheet.create({
  wrapper: { paddingVertical: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  checkBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  checkPlaceholder: { width: 18 },
  checkTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  nameBtn: { flex: 1 },
  name: { fontSize: 14, color: colors.textPrimary },
  nameMe: { fontWeight: '700', color: colors.accent },
  availChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  availTxt: { fontSize: 11, fontWeight: '600' },
  noAvail: { fontSize: 12, color: colors.border, minWidth: 14, textAlign: 'right' },
})

// ---------------------------------------------------------------------------
// Captain selection sheet
// ---------------------------------------------------------------------------
function CaptainSelectionSheet({
  team,
  teamPlayers,
  clubs,
  playersPerGame,
  getAvailability,
  initialSelection,
  onSave,
  onClose,
}: {
  team: Team
  teamPlayers: Player[]
  clubs: ReturnType<typeof useAppData>['clubs']
  playersPerGame: number
  getAvailability: (pid: string) => AvailabilityStatus | undefined
  initialSelection: string[]
  onSave: (playerIds: string[]) => void
  onClose: () => void
}) {
  const [selection, setSelection] = useState<string[]>(initialSelection)

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

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sel.backdrop} onPress={onClose}>
        <Pressable style={sel.sheet} onPress={() => {}}>
          <View style={sel.handle} />
          <Text style={sel.title}>
            Sélection — {getTeamName(team, clubs)} ({selection.length}/{playersPerGame})
          </Text>
          <ScrollView style={sel.list} showsVerticalScrollIndicator={false}>
            {teamPlayers.map((p) => {
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
                      <Text style={[sel.availTxt, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  ) : (
                    <Text style={sel.noAvail}>—</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <View style={sel.actions}>
            <TouchableOpacity style={sel.cancelBtn} onPress={onClose}>
              <Text style={sel.cancelTxt}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sel.saveBtn} onPress={() => { onSave(selection); onClose() }}>
              <Text style={sel.saveTxt}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
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
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
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
// Game card — upcoming (availability editing + optional captain selection)
// ---------------------------------------------------------------------------
function CurrentWeekGameCard({
  game,
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
  getAvailability,
  getSelected,
  onPickAvailability,
  onPlayerPress,
  onSaveSelection,
}: {
  game: { id: string; time?: string }
  matchDayDate: string
  teamName: string
  opponentName: string
  divisionLabel: string | undefined
  team: Team
  teamPlayers: Player[]
  clubs: ReturnType<typeof useAppData>['clubs']
  playersPerGame: number
  myPlayerId: string | undefined
  isCaptain: boolean
  getAvailability: (pid: string) => AvailabilityStatus | undefined
  getSelected: (pid: string) => boolean
  onPickAvailability: (pid: string, status: AvailabilityStatus) => void
  onPlayerPress: (p: Player) => void
  onSaveSelection: (playerIds: string[]) => void
}) {
  const today = todayIso()
  const gameDatePast = matchDayDate < today
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  const [showSelection, setShowSelection] = useState(false)

  const dateLabel = new Date(matchDayDate + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  function handleToggleExpand(pid: string) {
    setExpandedPlayer((prev) => (prev === pid ? null : pid))
  }

  const initialSelection = teamPlayers.map((p) => p.id).filter((id) => getSelected(id))

  return (
    <View style={gc.container}>
      <View style={gc.header}>
        <View style={gc.headerTop}>
          <View style={gc.headerInfo}>
            <Text style={gc.title}>{teamName} – {opponentName}</Text>
            <Text style={gc.meta}>{dateLabel}{game.time ? `  🕐 ${game.time}` : ''}</Text>
            {divisionLabel && <Text style={gc.division}>{divisionLabel}</Text>}
          </View>
          {isCaptain && !gameDatePast && (
            <TouchableOpacity style={gc.selBtn} onPress={() => setShowSelection(true)}>
              <Text style={gc.selBtnTxt}>Sélection</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
              expanded={expandedPlayer === p.id}
              onToggleExpand={() => handleToggleExpand(p.id)}
              onPickAvailability={(status) => {
                onPickAvailability(p.id, status)
                setExpandedPlayer(null)
              }}
              onPressName={() => onPlayerPress(p)}
            />
          )
        })}
      </View>

      {showSelection && (
        <CaptainSelectionSheet
          team={team}
          teamPlayers={teamPlayers}
          clubs={clubs}
          playersPerGame={playersPerGame}
          getAvailability={getAvailability}
          initialSelection={initialSelection}
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
  division: {
    alignSelf: 'flex-start', fontSize: 11, fontWeight: '600',
    color: colors.accent, backgroundColor: '#eff6ff',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 2,
  },
  selBtn: {
    backgroundColor: colors.accent, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 8,
  },
  selBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { padding: 14, gap: 0 },
})

// ---------------------------------------------------------------------------
// Past game card
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
    <View style={past.container}>
      <View style={past.header}>
        <Text style={past.title}>{teamName} – {opponentName}</Text>
        <Text style={past.meta}>{dateLabel}</Text>
      </View>
      {selectedPlayers.length > 0 && (
        <View style={past.body}>
          {selectedPlayers.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => onPlayerPress(p)}>
              <Text style={past.playerName}>{p.firstName} {p.lastName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const past = StyleSheet.create({
  container: {
    backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 10,
  },
  header: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textSecondary },
  body: { padding: 14, gap: 4 },
  playerName: { fontSize: 14, color: colors.textSecondary, paddingVertical: 2 },
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
  const { user, displayName, roleLabel, logout } = useAuth()
  const {
    clubs, seasons, teams, players, matchDays, games,
    phases, divisions, groups,
    gameAvailabilities, gameSelections,
    setAvailability, setGameSelection,
  } = useAppData()

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [prevPhasesExpanded, setPrevPhasesExpanded] = useState<Set<string>>(new Set())

  const today = todayIso()
  const currentWeekMonday = getMondayOf(today)

  const myPlayerId = user?.playerId

  // phaseId → team the player belongs to
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
  const isCaptain = !!(user && myActiveTeam && canManageTeam(user, myActiveTeam.id))

  // Lookup maps
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

  // Upcoming games (current week + future)
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

  // Past games in active phase
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

  // Previous phases
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

  // Player modal data
  function getPhasePoints(player: Player): string | undefined {
    const team = activePhase ? myTeamByPhase.get(activePhase.id) : undefined
    return team?.rosterInitialPoints?.[player.id] ?? player.points
  }

  function getGameHistoryForPlayer(player: Player): GameHistoryEntry[] {
    // Find every team (across all phases) this player belongs to
    const entries: GameHistoryEntry[] = []
    for (const team of teams) {
      if (!team.playerIds.includes(player.id)) continue
      for (const game of getTeamGames(team.id)) {
        const sel = getSelectedForGame(team.id, game.id)
        if (!sel.includes(player.id)) continue // only games where they were selected
        const md = mdMap.get(game.matchDayId)
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
    return getGameHistoryForPlayer(player).filter((e) => e.isPast).length
  }

  const isPlayer = !!myPlayerId && !!myActiveTeam
  const activeSeason = seasons.find((s) => s.isActive)
  const upcomingMatchDays = matchDays
    .filter((md) => new Date(md.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcome}>Bonjour, {displayName} 👋</Text>
          <Text style={styles.roleText}>{roleLabel}</Text>
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
                    team={myActiveTeam}
                    teamPlayers={teamPlayers}
                    clubs={clubs}
                    playersPerGame={getPlayersPerGame(myActiveTeam)}
                    myPlayerId={myPlayerId}
                    isCaptain={isCaptain}
                    getAvailability={(pid) => getAvailability(pid, game.id)}
                    getSelected={(pid) => selection.includes(pid)}
                    onPickAvailability={(pid, status) => setAvailability(pid, game.id, status)}
                    onPlayerPress={setSelectedPlayer}
                    onSaveSelection={(playerIds) => setGameSelection(myActiveTeam.id, game.id, playerIds)}
                  />
                )
              })
            )}

            {pastActiveGames.length > 0 && (
              <>
                <SectionHeader title={`Matchs passés — ${activePhase?.displayName}`} />
                {pastActiveGames.map((game) => {
                  const md = mdMap.get(game.matchDayId)!
                  const sel = getSelectedForGame(myActiveTeam.id, game.id)
                  const selectedPlayers = sel.map((id) => playerMap.get(id)).filter(Boolean) as Player[]
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

            {prevPhases.map((phase) => {
              const team = myTeamByPhase.get(phase.id)!
              const phaseGames = getPrevPhaseGames(phase.id)
              const expanded = prevPhasesExpanded.has(phase.id)
              return (
                <View key={phase.id}>
                  <SectionHeader
                    title={phase.displayName} collapsible expanded={expanded}
                    onToggle={() => togglePrevPhase(phase.id)}
                  />
                  {expanded && phaseGames.map((game) => {
                    const md = mdMap.get(game.matchDayId)!
                    const sel = getSelectedForGame(team.id, game.id)
                    const selectedPlayers = sel.map((id) => playerMap.get(id)).filter(Boolean) as Player[]
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

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          phasePoints={getPhasePoints(selectedPlayer)}
          phaseGamesPlayed={getGamesPlayedForPlayer(selectedPlayer)}
          gameHistory={getGameHistoryForPlayer(selectedPlayer)}
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
  logoutBtn: {
    backgroundColor: colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginTop: 8,
  },
  logoutText: { fontSize: 15, color: colors.danger, fontWeight: '600' },
})
