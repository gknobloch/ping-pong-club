import { Modal, Pressable, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useMemo, useState } from 'react'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import { AVAIL } from '@/constants/availability'
import { isPlayerEligibleForTeam } from '@/utils/brulage'
import type { AvailabilityStatus, Club, Player, Team, MatchDay, Game, GameSelection } from '@shared/types'

export interface SelectionData {
  matchDayId: string
  allClubPlayers: Player[]
  clubTeams: Team[]
  matchDays: MatchDay[]
  games: Game[]
  gameSelections: GameSelection[]
}

// Bottom-sheet line-up picker for captains: this team's roster plus other
// club players still eligible (brûlage) for the match-day. Shared by the
// Accueil hero card and the Mes matchs game cards.
export function CaptainSelectionSheet({
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
