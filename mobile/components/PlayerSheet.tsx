import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppData } from '@/contexts/DataContext'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import type { Player, Team } from '@shared/types'

export type PlayerHistoryEntry = {
  jNumber?: number
  /** Home/away icon. If absent and jNumber is set, a · separator is rendered instead. */
  icon?: 'home' | 'paper-plane-outline'
  text: string
  /** The team this game was played for — shown as a small colored label. */
  team?: Team
  date: string
  isPast: boolean
}

function hexToRgba(hex: string, alpha: number): string {
  try {
    const h =
      hex.startsWith('#') && hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex
    const r = parseInt(h.slice(1, 3), 16)
    const g = parseInt(h.slice(3, 5), 16)
    const b = parseInt(h.slice(5, 7), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error()
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(226,59,59,${alpha})`
  }
}

export function PlayerSheet({
  player,
  phaseLabel,
  phasePoints,
  gamesPlayed,
  team,
  brulageTeam,
  history,
  onClose,
  onProfile,
}: {
  player: Player
  /** e.g. "Saison 2025/2026 Phase 2" — used as section heading above phase stats */
  phaseLabel?: string
  phasePoints?: string
  gamesPlayed: number
  team: Team | null
  brulageTeam: Team | null
  history: PlayerHistoryEntry[]
  onClose: () => void
  /** When provided, the footer shows "Fermer" + "Profil". Otherwise just "Fermer". */
  onProfile?: () => void
}) {
  const { clubs } = useAppData()

  function TeamBadge({ t, burned = false }: { t: Team; burned?: boolean }) {
    const tc = t.color ?? colors.accent
    const bg = hexToRgba(tc, 0.1)
    const label = burned ? `Brûlé — ${getTeamName(t, clubs)}` : getTeamName(t, clubs)
    return (
      <View style={[s.teamBadge, { borderColor: tc, backgroundColor: bg }]}>
        <View style={[s.teamDot, { backgroundColor: tc }]} />
        <Text style={[s.teamBadgeTxt, { color: tc }]}>{label}</Text>
      </View>
    )
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <View style={s.sheet} onStartShouldSetResponder={() => true}>
          <View style={s.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Identity */}
            <Text style={s.name}>{player.firstName} {player.lastName}</Text>
            <View style={s.row}>
              <Text style={s.label}>Licence</Text>
              <Text style={s.value}>{player.licenseNumber}</Text>
            </View>

            <View style={s.divider} />

            {/* Phase stats */}
            {phaseLabel && <Text style={s.sectionHeading}>{phaseLabel}</Text>}
            <View style={s.rows}>
              {phasePoints && (
                <View style={s.row}>
                  <Text style={s.label}>Points</Text>
                  <Text style={s.value}>{phasePoints}</Text>
                </View>
              )}
              <View style={s.row}>
                <Text style={s.label}>Matchs joués</Text>
                <Text style={s.value}>{String(gamesPlayed)}</Text>
              </View>
              {team && (
                <View style={s.row}>
                  <Text style={s.label}>Équipe</Text>
                  <TeamBadge t={team} />
                </View>
              )}
              {brulageTeam && (
                <View style={s.row}>
                  <Text style={s.label}>Brûlage</Text>
                  <TeamBadge t={brulageTeam} burned />
                </View>
              )}
            </View>

            {/* Game history — no heading, flows directly */}
            {history.length > 0 && (
              <View style={s.historySection}>
                {history.map((entry, i) => (
                  <View key={i} style={s.historyRow}>
                    <View style={s.historyLeft}>
                      {entry.jNumber != null && (
                        <Text style={[s.historyJ, entry.isPast && s.historyPast]}>
                          J{entry.jNumber}
                        </Text>
                      )}
                      {entry.team && (() => {
                        const tc = entry.team.color ?? colors.accent
                        return (
                          <View style={[s.historyTeamBadge, { borderColor: tc, backgroundColor: hexToRgba(tc, 0.1) }]}>
                            <Text style={[s.historyTeamNum, { color: tc }]}>{entry.team.number}</Text>
                          </View>
                        )
                      })()}
                      {entry.icon ? (
                        <Ionicons
                          name={entry.icon}
                          size={13}
                          color={entry.isPast ? '#94a3b8' : colors.textSecondary}
                        />
                      ) : entry.jNumber != null ? (
                        <Text style={[s.historyDot, entry.isPast && s.historyPast]}>·</Text>
                      ) : null}
                      <Text
                        style={[s.historyText, entry.isPast && s.historyPast]}
                        numberOfLines={1}
                      >
                        {entry.text}
                      </Text>
                    </View>
                    <Text style={[s.historyDate, entry.isPast && s.historyPast]}>
                      {entry.date}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {onProfile ? (
              <View style={s.footer}>
                <TouchableOpacity style={[s.footerBtn, s.footerClose]} onPress={onClose}>
                  <Text style={s.footerCloseTxt}>Fermer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.footerBtn, s.footerProfile]} onPress={onProfile}>
                  <Text style={s.footerProfileTxt}>Profil</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <Text style={s.closeTxt}>Fermer</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  sectionHeading: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
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

  historySection: { marginTop: 16, gap: 6 },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  historyJ: { fontSize: 12, fontWeight: '700', color: colors.accent, width: 18 },
  historyTeamBadge: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  historyTeamNum: { fontSize: 11, fontWeight: '700' },
  historyDot: { fontSize: 13, color: colors.textSecondary },
  historyText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  historyDate: { fontSize: 13, color: colors.textSecondary },
  historyPast: { color: '#94a3b8' },

  footer: { flexDirection: 'row', gap: 10, marginTop: 20 },
  footerBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  footerClose: { backgroundColor: colors.bg },
  footerProfile: { backgroundColor: colors.accent },
  footerCloseTxt: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  footerProfileTxt: { fontSize: 15, fontWeight: '600', color: '#fff' },

  closeBtn: {
    backgroundColor: colors.bg, borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 20,
  },
  closeTxt: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
})
