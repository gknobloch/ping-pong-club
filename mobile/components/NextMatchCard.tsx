import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import { AVAIL, ALL_STATUSES } from '@/constants/availability'
import { todayIso } from '@/utils/weeks'
import { Avatar } from '@/components/Avatar'
import type { AvailabilityStatus, Player } from '@shared/types'

// Days-until label from a YYYY-MM-DD match date.
function countdownLabel(dateStr: string): string {
  const today = new Date(todayIso() + 'T00:00:00')
  const d = new Date(dateStr + 'T00:00:00')
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  return `Dans ${days} jours`
}

// The Accueil hero: the player's next match, with one-tap availability, a
// response summary, and (for captains) a shortcut to compose the line-up.
export function NextMatchCard({
  matchDayNumber,
  matchDayDate,
  time,
  divisionLabel,
  teamColor,
  teamNumber,
  isHome,
  teamName,
  opponentName,
  venueLabel,
  myAvailability,
  canSetAvailability,
  onPickAvailability,
  availableCount,
  noResponseCount,
  availablePlayers,
  isCaptain,
  onCompose,
  onOpenWeek,
}: {
  matchDayNumber: number
  matchDayDate: string
  time?: string
  divisionLabel?: string
  teamColor?: string
  teamNumber: number
  isHome: boolean
  teamName: string
  opponentName: string
  venueLabel?: string
  myAvailability: AvailabilityStatus | undefined
  canSetAvailability: boolean
  onPickAvailability: (s: AvailabilityStatus) => void
  availableCount: number
  noResponseCount: number
  availablePlayers: Player[]
  isCaptain: boolean
  onCompose: () => void
  onOpenWeek: () => void
}) {
  const accent = teamColor ?? colors.accent
  const dateLabel = new Date(matchDayDate + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const title = isHome ? `${teamName} – ${opponentName}` : `${opponentName} – ${teamName}`
  const stack = availablePlayers.slice(0, 3)
  const extra = Math.max(0, availableCount - stack.length)

  return (
    <View style={s.card}>
      {/* Tappable top → full week view */}
      <TouchableOpacity activeOpacity={0.7} onPress={onOpenWeek}>
        <View style={s.badgeRow}>
          <View style={s.badges}>
            <Text style={s.badge}>J{matchDayNumber}</Text>
            {divisionLabel ? <Text style={s.badge}>{divisionLabel}</Text> : null}
            <View style={s.teamBadge}>
              <View style={[s.teamDot, { backgroundColor: accent }]} />
              <Text style={s.teamBadgeTxt}>Équipe {teamNumber}</Text>
            </View>
          </View>
          <View style={s.countdown}>
            <Ionicons name="time-outline" size={12} color={colors.warning} />
            <Text style={s.countdownTxt}>{countdownLabel(matchDayDate)}</Text>
          </View>
        </View>

        <View style={s.titleRow}>
          <Ionicons
            name={isHome ? 'home' : 'paper-plane-outline'}
            size={15}
            color={colors.textSecondary}
            style={{ marginTop: 2 }}
          />
          <Text style={s.title}>{title}</Text>
        </View>

        <View style={s.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={s.meta}>{dateLabel}{time ? ` · ${time}` : ''}</Text>
        </View>
        {venueLabel ? (
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={s.meta}>{venueLabel}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Availability */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Ma disponibilité</Text>
        <View style={s.segmented}>
          {ALL_STATUSES.map((status) => {
            const cfg = AVAIL[status]
            const active = myAvailability === status
            return (
              <TouchableOpacity
                key={status}
                disabled={!canSetAvailability}
                onPress={() => onPickAvailability(status)}
                style={[
                  s.segment,
                  active
                    ? { backgroundColor: cfg.bg, borderColor: cfg.color }
                    : { borderColor: colors.border },
                  !canSetAvailability && s.segmentDisabled,
                ]}
              >
                <Text style={[s.segmentTxt, { color: active ? cfg.color : colors.textSecondary }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Response summary */}
      <View style={s.responses}>
        <View style={s.stack}>
          {stack.map((p, i) => (
            <View key={p.id} style={[s.stackItem, i > 0 && { marginLeft: -8 }]}>
              <Avatar
                playerId={p.id}
                avatarUpdatedAt={p.avatarUpdatedAt}
                firstName={p.firstName}
                lastName={p.lastName}
                size={24}
              />
            </View>
          ))}
          {extra > 0 ? (
            <View style={[s.stackItem, stack.length > 0 && { marginLeft: -8 }]}>
              <View style={s.extra}><Text style={s.extraTxt}>+{extra}</Text></View>
            </View>
          ) : null}
        </View>
        <Text style={s.responseTxt}>
          {availableCount} disponible{availableCount !== 1 ? 's' : ''} · {noResponseCount} sans réponse
        </Text>
      </View>

      {/* Captain shortcut */}
      {isCaptain ? (
        <TouchableOpacity style={s.compose} onPress={onCompose}>
          <View style={s.composeLeft}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={s.composeTxt}>Composer l'équipe</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  badge: {
    fontSize: 11, fontWeight: '600', color: colors.textSecondary,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, overflow: 'hidden',
  },
  teamBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  teamDot: { width: 8, height: 8, borderRadius: 2 },
  teamBadgeTxt: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  countdown: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  countdownTxt: { fontSize: 12, fontWeight: '600', color: colors.warning },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
  section: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 8 },
  sectionLabel: { fontSize: 13, color: colors.textSecondary },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1, minHeight: 40, borderRadius: 8, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  segmentDisabled: { opacity: 0.5 },
  segmentTxt: { fontSize: 14, fontWeight: '600' },
  responses: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stack: { flexDirection: 'row' },
  stackItem: { borderRadius: 12, borderWidth: 1.5, borderColor: colors.card },
  extra: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  extraTxt: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  responseTxt: { fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
  compose: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12,
  },
  composeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composeTxt: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
})
