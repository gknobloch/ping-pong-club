import {
  ScrollView, View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Modal, Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '@/contexts/DataContext'
import { getTeamName } from '@/utils/roles'
import { sortByName } from '@/utils/sortByName'
import { computeBrulage } from '@/utils/brulage'
import { colors } from '@/constants/colors'
import type { Player, Team } from '@shared/types'

// ---------------------------------------------------------------------------
// Helpers shared with the Accueil PlayerModal
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={m.row}>
      <Text style={m.label}>{label}</Text>
      <Text style={m.value}>{value}</Text>
    </View>
  )
}

function TeamRow({ label, team, burned = false }: { label: string; team: Team; burned?: boolean }) {
  const clubs = useAppData().clubs
  const tc = team.color ?? colors.accent
  const bg = hexToRgba(tc, 0.1)
  const teamLabel = burned
    ? `Brûlé — ${getTeamName(team, clubs)}`
    : getTeamName(team, clubs)
  return (
    <View style={m.row}>
      <Text style={m.label}>{label}</Text>
      <View style={[m.teamBadge, { borderColor: tc, backgroundColor: bg }]}>
        <View style={[m.teamDot, { backgroundColor: tc }]} />
        <Text style={[m.teamBadgeTxt, { color: tc }]}>{teamLabel}</Text>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function PhaseGamesScreen() {
  const { teamId, label } = useLocalSearchParams<{ teamId: string; label: string }>()
  const { teams, players, clubs, matchDays, games, gameSelections } = useAppData()
  const navigation = useNavigation()
  const router = useRouter()

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

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

  // Club teams in the same phase (for brûlage computation)
  const clubTeamsInPhase = useMemo(
    () => team ? teams.filter((t) => t.clubId === team.clubId && t.phaseId === team.phaseId) : [],
    [team, teams],
  )

  // Per-player phase history: games where they appeared
  const playerHistory = useMemo(() => {
    if (!selectedPlayer) return []
    return teamGames
      .filter((g) => {
        const sel = teamSelections.find((s) => s.gameId === g.id)
        return sel?.playerIds.includes(selectedPlayer.id)
      })
      .map((g) => {
        const md = g.matchDay
        const isHome = g.homeTeamId === teamId
        const oppTeam = teams.find((t) => t.id === (isHome ? g.awayTeamId : g.homeTeamId))
        const oppName = oppTeam ? getTeamName(oppTeam, clubs) : '—'
        const isPast = md ? md.date < new Date().toISOString().slice(0, 10) : false
        return {
          jNumber: md?.number,
          isHome,
          oppName,
          date: md
            ? new Date(md.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short',
              })
            : '',
          isPast,
        }
      })
  }, [selectedPlayer, teamGames, teamSelections, teamId, teams, clubs])

  const brulageInfo = useMemo(() => {
    if (!selectedPlayer || !team) return null
    const info = computeBrulage(selectedPlayer.id, clubTeamsInPhase, matchDays, games, gameSelections)
    if (!info.burnedIntoTeamId) return null
    return teams.find((t) => t.id === info.burnedIntoTeamId) ?? null
  }, [selectedPlayer, team, clubTeamsInPhase, matchDays, games, gameSelections, teams])

  const totalGames = teamGames.length
  const today = new Date().toISOString().slice(0, 10)

  if (!team) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>Équipe introuvable.</Text>
      </SafeAreaView>
    )
  }

  function openProfile(player: Player) {
    setSelectedPlayer(null)
    router.push({ pathname: '/(tabs)/equipes/player-detail', params: { id: player.id } })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Member stats */}
        {(rosterPlayers.length > 0 || borrowedPlayers.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Joueurs ({rosterPlayers.length + borrowedPlayers.length})
            </Text>
            {rosterPlayers.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.memberRow}
                onPress={() => setSelectedPlayer(p)}
              >
                <Text style={styles.memberName}>{p.firstName} {p.lastName}</Text>
                {p.id === team.captainId && <Text style={styles.capBadge}>Cap.</Text>}
                <Text style={styles.gamesCount}>{playedCount.get(p.id) ?? 0}/{totalGames}</Text>
              </TouchableOpacity>
            ))}
            {borrowedPlayers.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.memberRow}
                onPress={() => setSelectedPlayer(p)}
              >
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
                  <View style={styles.gameRight}>
                    <Text style={styles.gameDate}>{dateLabel}</Text>
                    {g.time && <Text style={styles.gameTime}>{g.time}</Text>}
                  </View>
                </View>

                {gamePlayers.length > 0 && (
                  <View style={styles.gamePlayers}>
                    {gamePlayers.map((p) => (
                      <TouchableOpacity key={p.id} onPress={() => setSelectedPlayer(p)}>
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

      {/* Player info bottom sheet */}
      {selectedPlayer && (
        <Modal transparent animationType="slide" onRequestClose={() => setSelectedPlayer(null)}>
          <Pressable style={m.backdrop} onPress={() => setSelectedPlayer(null)}>
            <View style={m.sheet} onStartShouldSetResponder={() => true}>
              <View style={m.handle} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={m.name}>
                  {selectedPlayer.firstName} {selectedPlayer.lastName}
                </Text>

                <View style={m.rows}>
                  <InfoRow label="Licence" value={selectedPlayer.licenseNumber} />
                  {team.rosterInitialPoints?.[selectedPlayer.id] && (
                    <InfoRow
                      label="Points (phase)"
                      value={team.rosterInitialPoints[selectedPlayer.id]}
                    />
                  )}
                  <InfoRow
                    label="Matchs joués"
                    value={String(playedCount.get(selectedPlayer.id) ?? 0)}
                  />
                  <TeamRow label="Équipe" team={team} />
                  {brulageInfo && <TeamRow label="Brûlage" team={brulageInfo} burned />}
                  {selectedPlayer.email ? (
                    <InfoRow label="Email" value={selectedPlayer.email} />
                  ) : null}
                </View>

                {playerHistory.length > 0 && (
                  <View style={m.historySection}>
                    <Text style={m.historyTitle}>Historique (phase en cours)</Text>
                    {playerHistory.map((entry, i) => (
                      <View key={i} style={m.historyRow}>
                        <Text style={[m.historyText, entry.isPast && m.historyPast]}>
                          {entry.jNumber != null ? `J${entry.jNumber} · ` : ''}
                          {entry.isHome ? 'vs' : '@'} {entry.oppName}
                        </Text>
                        <Text style={[m.historyDate, entry.isPast && m.historyPast]}>
                          {entry.date}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Two-button footer */}
                <View style={m.footer}>
                  <TouchableOpacity
                    style={[m.footerBtn, m.footerBtnClose]}
                    onPress={() => setSelectedPlayer(null)}
                  >
                    <Text style={m.footerCloseTxt}>Fermer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[m.footerBtn, m.footerBtnProfile]}
                    onPress={() => openProfile(selectedPlayer)}
                  >
                    <Text style={m.footerProfileTxt}>Profil</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
    fontSize: 11, fontWeight: '600', color: colors.accent,
    backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  renforceBadge: {
    fontSize: 11, fontWeight: '500', color: colors.textSecondary,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  gamesCount: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
    minWidth: 36, textAlign: 'right',
  },

  gameBlock: { borderTopWidth: 1, borderTopColor: colors.border },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  gameLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  gameJ: { fontSize: 12, fontWeight: '700', color: colors.accent, minWidth: 24 },
  gameJPast: { color: colors.textSecondary },
  gameOpponent: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  gameRight: { alignItems: 'flex-end' },
  gameDate: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  gameTime: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  gamePlayers: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  gamePlayer: {
    fontSize: 12, color: colors.textSecondary,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden',
  },
})

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  rows: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: colors.textSecondary },
  value: {
    fontSize: 14, fontWeight: '600', color: colors.textPrimary,
    flexShrink: 1, textAlign: 'right',
  },
  teamBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  teamDot: { width: 7, height: 7, borderRadius: 4 },
  teamBadgeTxt: { fontSize: 13, fontWeight: '600' },

  historySection: { marginTop: 20, gap: 6 },
  historyTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  historyText: { fontSize: 14, color: colors.textPrimary, flex: 1, marginRight: 8 },
  historyDate: { fontSize: 13, color: colors.textSecondary },
  historyPast: { color: '#94a3b8' },

  footer: { flexDirection: 'row', gap: 10, marginTop: 20 },
  footerBtn: {
    flex: 1, borderRadius: 10, padding: 14, alignItems: 'center',
  },
  footerBtnClose: { backgroundColor: colors.bg },
  footerBtnProfile: { backgroundColor: colors.accent },
  footerCloseTxt: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  footerProfileTxt: { fontSize: 15, fontWeight: '600', color: '#fff' },
})
