import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/constants/colors'

// Neutral pill with a team-coloured dot, used wherever a team is tagged
// (match header, player quick view) so they all look identical.
export function TeamBadge({ color, label }: { color?: string; label: string }) {
  return (
    <View style={tb.badge}>
      <View style={[tb.dot, { backgroundColor: color ?? colors.accent }]} />
      <Text style={tb.txt}>{label}</Text>
    </View>
  )
}

const tb = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 2 },
  txt: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
})
