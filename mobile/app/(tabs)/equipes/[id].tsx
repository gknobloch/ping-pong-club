import {
  ScrollView, View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Modal, FlatList, Linking, TextInput,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamName, canManageTeam } from '@/utils/roles'
import { sortByName } from '@/utils/sortByName'
import { colors } from '@/constants/colors'
import type { Player } from '@shared/types'

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { teams, players, clubs, phases, matchDays, games, updateTeam } = useAppData()
  const { user } = useAuth()
  const navigation = useNavigation()

  const [showGames, setShowGames] = useState(false)
  const [showRosterPicker, setShowRosterPicker] = useState(false)
  const [editingWhatsApp, setEditingWhatsApp] = useState(false)
  const [whatsappDraft, setWhatsappDraft] = useState('')

  const team = teams.find((t) => t.id === id)
  const club = clubs.find((c) => c.id === team?.clubId)
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

  // Games for this team in its group (all of the current phase)
  const teamGames = useMemo(() => {
    if (!team) return []
    const mdInGroup = new Set(
      matchDays.filter((md) => md.groupId === team.groupId).map((md) => md.id),
    )
    return games
      .filter(
        (g) => (g.homeTeamId === team.id || g.awayTeamId === team.id) && mdInGroup.has(g.matchDayId),
      )
      .map((g) => ({ ...g, matchDay: matchDays.find((md) => md.id === g.matchDayId) }))
      .sort((a, b) => (a.matchDay?.date ?? '').localeCompare(b.matchDay?.date ?? ''))
  }, [team, matchDays, games])

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
    const next = current.includes(pid)
      ? current.filter((x) => x !== pid)
      : [...current, pid]
    updateTeam(team!.id, { playerIds: next })
  }

  function saveWhatsApp() {
    const val = whatsappDraft.trim()
    updateTeam(team!.id, { whatsappLink: val || null })
    setEditingWhatsApp(false)
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: team.color ?? colors.accent }]}>
          <Text style={styles.bannerName}>{getTeamName(team, clubs)}</Text>
          {club && <Text style={styles.bannerClub}>{club.displayName}</Text>}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Joueurs ({members.length})</Text>
          {members.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <Text style={styles.playerName}>{p.firstName} {p.lastName}</Text>
              {p.id === team.captainId && <Text style={styles.badge}>Cap.</Text>}
            </View>
          ))}
          {members.length === 0 && (
            <Text style={styles.empty}>Aucun joueur dans cette équipe.</Text>
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
              <Text style={styles.infoText}>🕐 {team.defaultDay} {team.defaultTime}</Text>
            )}
          </View>
        )}

        {/* All games button */}
        {teamGames.length > 0 && (
          <TouchableOpacity style={styles.gamesBtn} onPress={() => setShowGames(true)}>
            <Text style={styles.gamesBtnText}>
              Matchs{phase ? ` · ${phase.displayName}` : ''}
            </Text>
            <Text style={styles.gamesBtnChevron}>›</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Games modal */}
      <Modal
        visible={showGames}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGames(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Matchs{phase ? ` · ${phase.displayName}` : ''}
            </Text>
            <TouchableOpacity onPress={() => setShowGames(false)}>
              <Text style={styles.modalClose}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={teamGames}
            keyExtractor={(g) => g.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: g }) => {
              const md = g.matchDay
              const dateLabel = md
                ? new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })
                : ''
              const isHome = g.homeTeamId === team.id
              const oppTeam = teams.find(
                (t) => t.id === (isHome ? g.awayTeamId : g.homeTeamId),
              )
              const oppName = oppTeam ? getTeamName(oppTeam, clubs) : '—'
              const isPast = md ? md.date < today : false
              return (
                <View style={[styles.gameRow, isPast && styles.gameRowPast]}>
                  <View style={styles.gameRowLeft}>
                    {md && <Text style={styles.gameJ}>J{md.number}</Text>}
                    <View>
                      <Text style={[styles.gameDate, isPast && styles.gameTextPast]}>
                        {dateLabel}
                      </Text>
                      <Text style={[styles.gameMatchup, isPast && styles.gameTextPast]}>
                        {isHome ? `vs ${oppName}` : `@ ${oppName}`}
                      </Text>
                    </View>
                  </View>
                  {g.time && <Text style={[styles.gameTime, isPast && styles.gameTextPast]}>{g.time}</Text>}
                </View>
              )
            }}
          />
        </SafeAreaView>
      </Modal>

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
              <Text style={styles.modalTitle}>Composition</Text>
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
                return (
                  <TouchableOpacity
                    style={[styles.pickerRow, selected && styles.pickerRowSelected]}
                    onPress={() => togglePlayer(p.id)}
                  >
                    <Text style={styles.pickerCheck}>{selected ? '✓' : ''}</Text>
                    <Text style={[styles.playerName, selected && styles.pickerNameSelected]}>
                      {p.firstName} {p.lastName}
                    </Text>
                    {p.id === team.captainId && <Text style={styles.badge}>Cap.</Text>}
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

  banner: { padding: 24, gap: 4 },
  bannerName: { fontSize: 24, fontWeight: '700', color: '#fff' },
  bannerClub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

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
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playerName: { fontSize: 15, color: colors.textPrimary },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  empty: { fontSize: 14, color: colors.textSecondary },
  infoText: { fontSize: 14, color: colors.textPrimary },

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

  // Add player button
  addBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: { fontSize: 14, color: colors.accent, fontWeight: '500' },

  // Games button
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

  // Modal shared
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
  modalClose: { fontSize: 15, color: colors.accent },
  listContent: { padding: 16, gap: 1 },

  // Game rows
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameRowPast: { opacity: 0.55 },
  gameRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  gameJ: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    minWidth: 26,
  },
  gameDate: { fontSize: 13, color: colors.textSecondary },
  gameMatchup: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, marginTop: 1 },
  gameTime: { fontSize: 13, color: colors.textSecondary },
  gameTextPast: { color: colors.textSecondary },

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
})
