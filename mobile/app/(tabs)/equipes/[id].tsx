import {
  ScrollView, View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Modal, FlatList, Linking, TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamName, canManageTeam } from '@/utils/roles'
import { sortByName } from '@/utils/sortByName'
import { computeBrulage } from '@/utils/brulage'
import { colors } from '@/constants/colors'
import { ClubLogo } from '@/components/ClubLogo'
import { PlayerSheet } from '@/components/PlayerSheet'
import type { PlayerHistoryEntry } from '@/components/PlayerSheet'
import type { Game, MatchDay, Player } from '@shared/types'

type GameEntry = Game & { matchDay?: MatchDay }

type PhaseEntry = {
  teamId: string
  label: string  // e.g. "Saison 2025/2026 Phase 2"
  isActive: boolean
  games: GameEntry[]
}

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { teams, players, clubs, phases, divisions, matchDays, games, gameSelections, updateTeam } = useAppData()
  const { user } = useAuth()
  const navigation = useNavigation()
  const router = useRouter()
  const [showRosterPicker, setShowRosterPicker] = useState(false)
  const [editingWhatsApp, setEditingWhatsApp] = useState(false)
  const [whatsappDraft, setWhatsappDraft] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const team = teams.find((t) => t.id === id)
  const club = clubs.find((c) => c.id === team?.clubId)
  const division = divisions.find((d) => d.id === team?.divisionId)
  const phase = phases.find((p) => p.id === team?.phaseId)
  const isCaptain = !!(user && team && canManageTeam(user, team))

  const members = useMemo(
    () =>
      sortByName(
        (team?.playerIds ?? [])
          .map((pid) => players.find((p) => p.id === pid))
          .filter(Boolean) as Player[],
      ),
    [team, players],
  )

  // Club teams in the same phase (for brûlage + cross-team history)
  const clubTeamsInPhase = useMemo(
    () => (team ? teams.filter((t) => t.clubId === team.clubId && t.phaseId === team.phaseId) : []),
    [team, teams],
  )

  // One entry per phase this team (by club+number) has participated in
  const phaseEntries = useMemo<PhaseEntry[]>(() => {
    if (!team) return []
    return teams
      .filter((t) => t.clubId === team.clubId && t.number === team.number)
      .map((t) => {
        const ph = phases.find((p) => p.id === t.phaseId)
        const mdInGroup = new Set(
          matchDays.filter((md) => md.groupId === t.groupId).map((md) => md.id),
        )
        const phaseGames: GameEntry[] = games
          .filter(
            (g) =>
              (g.homeTeamId === t.id || g.awayTeamId === t.id) && mdInGroup.has(g.matchDayId),
          )
          .map((g) => ({ ...g, matchDay: matchDays.find((md) => md.id === g.matchDayId) }))
          .sort((a, b) => (a.matchDay?.date ?? '').localeCompare(b.matchDay?.date ?? ''))
        return {
          teamId: t.id,
          label: ph ? `Saison ${ph.displayName}` : 'Matchs',
          isActive: !!ph?.isActive,
          games: phaseGames,
        }
      })
      .filter((e) => e.games.length > 0)
      // Active phase first, then most-recent label first (lexicographic desc works for "Saison 2025/2026 …")
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
        return b.label.localeCompare(a.label)
      })
  }, [team, teams, phases, matchDays, games])

  // Players available to join this team: active, same club, not on another team in the same phase
  const eligiblePlayers = useMemo(() => {
    if (!team) return []
    const takenElsewhere = new Set(
      teams
        .filter((t) => t.phaseId === team.phaseId && t.id !== team.id)
        .flatMap((t) => t.playerIds),
    )
    return sortByName(
      players.filter(
        (p) => p.clubId === team.clubId && p.status === 'active' && !takenElsewhere.has(p.id),
      ),
    )
  }, [team, teams, players])

  // --- Player quick-view (PlayerSheet) data, computed for the tapped player ---
  const today = new Date().toISOString().slice(0, 10)

  const playerHistory = useMemo(() => {
    if (!selectedPlayer) return []
    const entries: Array<{
      rawDate: string; jNumber?: number; isHome: boolean
      oppName: string; team: typeof clubTeamsInPhase[0]; date: string; isPast: boolean
    }> = []
    for (const t of clubTeamsInPhase) {
      const mdInGroup = new Set(
        matchDays.filter((md) => md.groupId === t.groupId).map((md) => md.id),
      )
      for (const g of games) {
        if ((g.homeTeamId !== t.id && g.awayTeamId !== t.id) || !mdInGroup.has(g.matchDayId)) continue
        const sel = gameSelections.find((s) => s.teamId === t.id && s.gameId === g.id)
        if (!sel?.playerIds.includes(selectedPlayer.id)) continue
        const md = matchDays.find((md) => md.id === g.matchDayId)
        if (!md) continue
        const isHome = g.homeTeamId === t.id
        const oppTeam = teams.find((ot) => ot.id === (isHome ? g.awayTeamId : g.homeTeamId))
        entries.push({
          rawDate: md.date,
          jNumber: md.number,
          isHome,
          oppName: oppTeam ? getTeamName(oppTeam, clubs) : '—',
          team: t,
          date: new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short',
          }),
          isPast: md.date < today,
        })
      }
    }
    return entries.sort((a, b) => a.rawDate.localeCompare(b.rawDate))
  }, [selectedPlayer, clubTeamsInPhase, matchDays, games, gameSelections, teams, clubs, today])

  const brulageInfo = useMemo(() => {
    if (!selectedPlayer || !team) return null
    const info = computeBrulage(selectedPlayer.id, clubTeamsInPhase, matchDays, games, gameSelections)
    if (!info.burnedIntoTeamId) return null
    return teams.find((t) => t.id === info.burnedIntoTeamId) ?? null
  }, [selectedPlayer, team, clubTeamsInPhase, matchDays, games, gameSelections, teams])

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

  function togglePlayer(pid: string) {
    const current = team!.playerIds
    const removing = current.includes(pid)
    const next = removing
      ? current.filter((x) => x !== pid)
      : [...current, pid]
    // Dropping the current captain clears the captaincy.
    const patch: { playerIds: string[]; captainId?: string } = { playerIds: next }
    if (removing && pid === team!.captainId) patch.captainId = ''
    updateTeam(team!.id, patch)
  }

  function setCaptain(pid: string) {
    updateTeam(team!.id, { captainId: team!.captainId === pid ? '' : pid })
  }

  function saveWhatsApp() {
    const val = whatsappDraft.trim()
    updateTeam(team!.id, { whatsappLink: val || null })
    setEditingWhatsApp(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: team.color ?? colors.accent }]}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerName}>{getTeamName(team, clubs)}</Text>
            {division && (
              <View style={styles.levelBadgeWrap}>
                <Text style={styles.levelBadge}>{division.displayName}</Text>
              </View>
            )}
          </View>
          {club && (
            <ClubLogo
              clubId={club.id}
              logoUpdatedAt={club.logoUpdatedAt}
              name={club.displayName}
              size={48}
            />
          )}
        </View>

        {/* WhatsApp */}
        {(team.whatsappLink || isCaptain) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WhatsApp</Text>
            {!editingWhatsApp && (
              <>
                {team.whatsappLink ? (
                  <View style={styles.whatsappRow}>
                    <TouchableOpacity
                      style={styles.whatsappBtn}
                      onPress={() => Linking.openURL(team.whatsappLink!)}
                    >
                      <Text style={styles.whatsappBtnText}>Rejoindre le groupe</Text>
                    </TouchableOpacity>
                    {isCaptain && (
                      <TouchableOpacity
                        onPress={() => { setWhatsappDraft(team.whatsappLink ?? ''); setEditingWhatsApp(true) }}
                      >
                        <Text style={styles.textLink}>Modifier</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : isCaptain ? (
                  <TouchableOpacity
                    onPress={() => { setWhatsappDraft(''); setEditingWhatsApp(true) }}
                  >
                    <Text style={styles.textLink}>Configurer le lien WhatsApp…</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
            {editingWhatsApp && (
              <View style={styles.whatsappEdit}>
                <TextInput
                  style={styles.whatsappInput}
                  value={whatsappDraft}
                  onChangeText={setWhatsappDraft}
                  placeholder="https://chat.whatsapp.com/..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => setEditingWhatsApp(false)}>
                    <Text style={styles.cancelLink}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveWhatsApp}>
                    <Text style={styles.saveLink}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Roster */}
        <View style={styles.sectionList}>
          <Text style={styles.sectionListTitle}>Joueurs ({members.length})</Text>
          {members.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.playerRow}
              onPress={() => setSelectedPlayer(p)}
            >
              <Text style={styles.playerName}>{p.firstName} {p.lastName}</Text>
              {p.id === team.captainId && <Text style={styles.badge}>Cap.</Text>}
            </TouchableOpacity>
          ))}
          {members.length === 0 && (
            <Text style={[styles.empty, { paddingHorizontal: 16, paddingBottom: 16 }]}>
              Aucun joueur dans cette équipe.
            </Text>
          )}
          {isCaptain && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowRosterPicker(true)}>
              <Text style={styles.addBtnText}>Modifier la composition</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Schedule */}
        {(team.defaultDay || team.defaultTime) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendrier</Text>
            {team.defaultDay && team.defaultTime && (
              <View style={styles.scheduleRow}>
                <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.infoText}>{team.defaultDay} {team.defaultTime}</Text>
              </View>
            )}
          </View>
        )}

        {/* One button per phase this team has participated in */}
        {phaseEntries.map((entry) => (
          <TouchableOpacity
            key={entry.teamId}
            style={styles.gamesBtn}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/equipes/phase-games',
                params: { teamId: entry.teamId, label: entry.label },
              })
            }
          >
            <Text style={styles.gamesBtnText}>{entry.label}</Text>
            <Text style={styles.gamesBtnChevron}>›</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* Player quick view */}
      {selectedPlayer && (
        <PlayerSheet
          player={selectedPlayer}
          phaseLabel={phase ? `Saison ${phase.displayName}` : undefined}
          phasePoints={team.rosterInitialPoints?.[selectedPlayer.id]}
          gamesPlayed={playerHistory.filter((e) => e.isPast).length}
          gamesTotal={games.filter((g) => {
            if (g.homeTeamId !== team.id && g.awayTeamId !== team.id) return false
            const md = matchDays.find((m) => m.id === g.matchDayId)
            return !!md && md.date < today
          }).length}
          team={team}
          brulageTeam={brulageInfo}
          history={playerHistory.map(
            (e): PlayerHistoryEntry => ({
              jNumber: e.jNumber,
              icon: e.isHome ? 'home' : 'paper-plane-outline',
              text: e.oppName,
              team: e.team,
              date: e.date,
              isPast: e.isPast,
            }),
          )}
          onClose={() => setSelectedPlayer(null)}
          onProfile={() => {
            const p = selectedPlayer
            setSelectedPlayer(null)
            router.push({ pathname: '/(tabs)/equipes/player-detail', params: { id: p.id } })
          }}
        />
      )}

      {/* Roster picker modal (captain only) */}
      {isCaptain && (
        <Modal
          visible={showRosterPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowRosterPicker(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Composition</Text>
                <Text style={styles.modalSubtitle}>Touchez ★ pour le capitaine</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRosterPicker(false)}>
                <Text style={styles.modalClose}>Fermer</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={eligiblePlayers}
              keyExtractor={(p) => p.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item: p }) => {
                const selected = team.playerIds.includes(p.id)
                const isCap = p.id === team.captainId
                return (
                  <TouchableOpacity
                    style={[styles.pickerRow, selected && styles.pickerRowSelected]}
                    onPress={() => togglePlayer(p.id)}
                  >
                    <Text style={styles.pickerCheck}>{selected ? '✓' : ''}</Text>
                    <Text style={[styles.playerName, selected && styles.pickerNameSelected]}>
                      {p.firstName} {p.lastName}
                    </Text>
                    {selected && (
                      <TouchableOpacity
                        onPress={() => setCaptain(p.id)}
                        hitSlop={8}
                        style={styles.captainBtn}
                      >
                        <Ionicons
                          name={isCap ? 'star' : 'star-outline'}
                          size={20}
                          color={isCap ? colors.warning : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                )
              }}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { gap: 12, paddingBottom: 24 },
  notFound: { padding: 24, color: colors.textSecondary, textAlign: 'center' },

  banner: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bannerText: { flex: 1, gap: 8 },
  bannerName: { fontSize: 24, fontWeight: '700', color: '#fff' },
  levelBadgeWrap: { alignSelf: 'flex-start' },
  levelBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  // Sections with internal padding + gap (WhatsApp, Schedule)
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
  // List-style section (Joueurs): no padding/gap so border-separated rows are symmetric
  sectionList: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionListTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playerName: { fontSize: 15, color: colors.textPrimary },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  empty: { fontSize: 14, color: colors.textSecondary },
  infoText: { fontSize: 14, color: colors.textPrimary },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // WhatsApp
  whatsappRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  whatsappBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  whatsappBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  textLink: { fontSize: 14, color: colors.accent },
  whatsappEdit: { gap: 10 },
  whatsappInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  cancelLink: { fontSize: 14, color: colors.textSecondary },
  saveLink: { fontSize: 14, color: colors.accent, fontWeight: '600' },

  // Roster button
  addBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  addBtnText: { fontSize: 14, color: colors.accent, fontWeight: '500' },

  // Phase / games buttons
  gamesBtn: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  gamesBtnText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  gamesBtnChevron: { fontSize: 22, color: colors.textSecondary },

  // Modal shared (roster picker)
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  modalSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  modalClose: { fontSize: 15, color: colors.accent },
  listContent: { padding: 16, gap: 1 },

  // Roster picker rows
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  pickerRowSelected: { borderColor: colors.accent, backgroundColor: '#fff5f5' },
  pickerCheck: { width: 20, fontSize: 14, color: colors.accent, fontWeight: '700' },
  pickerNameSelected: { fontWeight: '600' },
  captainBtn: { marginLeft: 'auto', padding: 2 },
})
