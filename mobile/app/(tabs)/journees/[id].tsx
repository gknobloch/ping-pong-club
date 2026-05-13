import { ScrollView, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useState } from 'react'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { canManageTeam, getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import type { AvailabilityStatus } from '@shared/types'

// ---------------------------------------------------------------------------
// Availability pill
// ---------------------------------------------------------------------------
const AVAIL_OPTIONS: { status: AvailabilityStatus; label: string; color: string; bg: string }[] = [
  { status: 'available', label: 'Disponible', color: '#16a34a', bg: '#dcfce7' },
  { status: 'maybe', label: 'Peut-être', color: '#d97706', bg: '#fef3c7' },
  { status: 'unavailable', label: 'Indisponible', color: '#dc2626', bg: '#fee2e2' },
]

function AvailabilityPicker({
  current,
  onChange,
}: {
  current: AvailabilityStatus | undefined
  onChange: (s: AvailabilityStatus) => void
}) {
  return (
    <View style={avStyles.row}>
      {AVAIL_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.status}
          onPress={() => onChange(opt.status)}
          style={[
            avStyles.pill,
            { backgroundColor: current === opt.status ? opt.bg : colors.bg },
            current === opt.status && { borderColor: opt.color },
          ]}
        >
          <Text style={[avStyles.pillText, { color: current === opt.status ? opt.color : colors.textSecondary }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const avStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillText: { fontSize: 13, fontWeight: '500' },
})

// ---------------------------------------------------------------------------
// Player row for captain selection
// ---------------------------------------------------------------------------
function PlayerSelectionRow({
  name,
  selected,
  onToggle,
}: {
  name: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <TouchableOpacity style={[selStyles.row, selected && selStyles.rowSelected]} onPress={onToggle}>
      <View style={[selStyles.check, selected && selStyles.checkSelected]}>
        {selected && <Text style={selStyles.checkMark}>✓</Text>}
      </View>
      <Text style={[selStyles.name, selected && selStyles.nameSelected]}>{name}</Text>
    </TouchableOpacity>
  )
}

const selStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  rowSelected: { backgroundColor: '#eff6ff' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  name: { fontSize: 15, color: colors.textPrimary },
  nameSelected: { fontWeight: '600', color: colors.accent },
})

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function MatchDayDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const { matchDays, games, teams, clubs, players, divisions, groups, gameAvailabilities, gameSelections, setAvailability, setGameSelection } = useAppData()
  const { user } = useAuth()

  const matchDay = matchDays.find((md) => md.id === id)
  const dayGames = games.filter((g) => g.matchDayId === id)

  // Selection state: gameId → teamId → Set of playerIds
  const [pendingSelections, setPendingSelections] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (matchDay) navigation.setOptions({ title: `Journée ${matchDay.number}` })
  }, [matchDay, navigation])

  if (!matchDay) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Journée introuvable.</Text>
      </SafeAreaView>
    )
  }

  function getAvailability(playerId: string, gameId: string): AvailabilityStatus | undefined {
    return gameAvailabilities.find((a) => a.playerId === playerId && a.gameId === gameId)?.status
  }

  function getSelection(teamId: string, gameId: string): string[] {
    // Use pending override if present, otherwise saved
    const key = `${gameId}:${teamId}`
    if (pendingSelections[key] !== undefined) return pendingSelections[key]
    return gameSelections.find((s) => s.teamId === teamId && s.gameId === gameId)?.playerIds ?? []
  }

  function togglePlayerSelection(gameId: string, teamId: string, playerId: string, maxPlayers: number) {
    const key = `${gameId}:${teamId}`
    const current = getSelection(teamId, gameId)
    let next: string[]
    if (current.includes(playerId)) {
      next = current.filter((pid) => pid !== playerId)
    } else {
      if (current.length >= maxPlayers) {
        Alert.alert('Limite atteinte', `Maximum ${maxPlayers} joueurs par match pour cette division.`)
        return
      }
      next = [...current, playerId]
    }
    setPendingSelections((prev) => ({ ...prev, [key]: next }))
  }

  async function saveSelection(gameId: string, teamId: string) {
    const key = `${gameId}:${teamId}`
    const playerIds = pendingSelections[key]
    if (!playerIds) return
    await setGameSelection(teamId, gameId, playerIds)
    setPendingSelections((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Date header */}
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>
            {new Date(matchDay.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.gameCount}>{dayGames.length} match{dayGames.length > 1 ? 's' : ''}</Text>
        </View>

        {/* Games */}
        {dayGames.map((game) => {
          const homeTeam = teams.find((t) => t.id === game.homeTeamId)
          const awayTeam = teams.find((t) => t.id === game.awayTeamId)
          const homeTeamName = homeTeam ? getTeamName(homeTeam, clubs) : '?'
          const awayTeamName = awayTeam ? getTeamName(awayTeam, clubs) : '?'

          // Find the division to know playersPerGame
          const group = groups.find((g) => homeTeam && g.teamIds?.includes(homeTeam.id))
          const division = divisions.find((d) => d.id === group?.divisionId)
          const playersPerGame = division?.playersPerGame ?? 4

          // Determine which team(s) the current user can manage
          const userTeams = [homeTeam, awayTeam].filter(
            (t) => t && user && canManageTeam(user, t.id),
          )

          // Own availability (if user is a player)
          const myPlayerId = user?.playerId
          const myAvail = myPlayerId ? getAvailability(myPlayerId, game.id) : undefined

          return (
            <View key={game.id} style={styles.gameCard}>
              {/* Match header */}
              <View style={styles.gameHeader}>
                <Text style={styles.gameTitle}>
                  {homeTeamName} – {awayTeamName}
                </Text>
                {game.time && <Text style={styles.gameTime}>🕐 {game.time}</Text>}
                {division && (
                  <Text style={styles.divisionLabel}>{division.displayName}</Text>
                )}
              </View>

              {/* My availability */}
              {myPlayerId && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ma disponibilité</Text>
                  <AvailabilityPicker
                    current={myAvail}
                    onChange={(status) => setAvailability(myPlayerId, game.id, status)}
                  />
                </View>
              )}

              {/* Captain selection panels */}
              {userTeams.map((team) => {
                if (!team) return null
                const teamPlayers = (team.playerIds ?? [])
                  .map((pid) => players.find((p) => p.id === pid))
                  .filter(Boolean) as typeof players
                const selection = getSelection(team.id, game.id)
                const key = `${game.id}:${team.id}`
                const hasPending = pendingSelections[key] !== undefined

                return (
                  <View key={team.id} style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        Sélection — {getTeamName(team, clubs)} ({selection.length}/{playersPerGame})
                      </Text>
                      {hasPending && (
                        <TouchableOpacity
                          style={styles.saveBtn}
                          onPress={() => saveSelection(game.id, team.id)}
                        >
                          <Text style={styles.saveBtnText}>Enregistrer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {teamPlayers.map((p) => {
                      const avail = getAvailability(p.id, game.id)
                      return (
                        <View key={p.id} style={styles.playerSelRow}>
                          <PlayerSelectionRow
                            name={`${p.firstName} ${p.lastName}`}
                            selected={selection.includes(p.id)}
                            onToggle={() => togglePlayerSelection(game.id, team.id, p.id, playersPerGame)}
                          />
                          {avail && (
                            <Text style={[styles.availDot, { color: AVAIL_OPTIONS.find((o) => o.status === avail)?.color }]}>
                              ●
                            </Text>
                          )}
                        </View>
                      )
                    })}
                    {teamPlayers.length === 0 && (
                      <Text style={styles.empty}>Aucun joueur dans cette équipe.</Text>
                    )}
                  </View>
                )
              })}
            </View>
          )
        })}

        {dayGames.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.empty}>Aucun match pour cette journée.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12 },
  notFound: { padding: 24, color: colors.textSecondary, textAlign: 'center' },
  dateCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1 },
  gameCount: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  gameCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  gameHeader: { padding: 14, gap: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  gameTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  gameTime: { fontSize: 13, color: colors.textSecondary },
  divisionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  section: { padding: 14, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  saveBtn: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  playerSelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availDot: { fontSize: 16 },
  empty: { fontSize: 14, color: colors.textSecondary },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
})
