import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'

// Shared presentational summary for a single game/match: the matchup title,
// date + time (with a clock icon), and the journée / division badges. Used by
// both the Accueil match cards and the Journées week-detail cards so the two
// stay visually in sync.
export function GameSummary({
  title,
  dateLabel,
  time,
  matchDayNumber,
  divisionLabel,
  style,
}: {
  title: string
  dateLabel?: string
  time?: string
  matchDayNumber?: number
  divisionLabel?: string
  style?: StyleProp<ViewStyle>
}) {
  const hasBadges = matchDayNumber != null || !!divisionLabel
  return (
    <View style={[s.info, style]}>
      <Text style={s.title}>{title}</Text>
      {(dateLabel || time) && (
        <View style={s.metaRow}>
          {dateLabel ? <Text style={s.meta}>{dateLabel}</Text> : null}
          {time ? (
            <View style={s.timeRow}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={s.meta}>{time}</Text>
            </View>
          ) : null}
        </View>
      )}
      {hasBadges && (
        <View style={s.badges}>
          {matchDayNumber != null ? <Text style={s.badge}>J{matchDayNumber}</Text> : null}
          {divisionLabel ? <Text style={s.badge}>{divisionLabel}</Text> : null}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  info: { gap: 4 },
  title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: colors.textSecondary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badges: { flexDirection: 'row', gap: 4, marginTop: 4 },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
})
