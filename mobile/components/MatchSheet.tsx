import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors } from '@/constants/colors'

// Read-only "feuille de match" — club identity + the selected line-up with
// licences and phase points, to help fill the official sheet on site.
export function MatchSheet({
  matchup,
  clubName,
  affiliationNumber,
  players,
  onClose,
}: {
  matchup: string
  clubName: string
  affiliationNumber: string
  players: { name: string; license?: string; points?: string }[]
  onClose: () => void
}) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <View style={s.sheet} onStartShouldSetResponder={() => true}>
          <View style={s.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.title}>Feuille de match</Text>
            <Text style={s.matchup}>{matchup}</Text>

            <View style={s.divider} />

            <Text style={s.sectionHeading}>Club</Text>
            <View style={s.row}>
              <Text style={s.label}>Nom</Text>
              <Text style={s.value}>{clubName}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>N° club</Text>
              <Text style={s.value}>{affiliationNumber}</Text>
            </View>

            <View style={s.divider} />

            <Text style={s.sectionHeading}>Joueurs ({players.length})</Text>
            {players.map((p, i) => (
              <View key={i} style={s.playerRow}>
                <Text style={s.playerName} numberOfLines={1}>{p.name}</Text>
                <View style={s.playerMeta}>
                  <Text style={s.license}>{p.license ?? '—'}</Text>
                  <Text style={s.points}>{p.points ?? '—'} pts</Text>
                </View>
              </View>
            ))}
            {players.length === 0 && <Text style={s.empty}>Aucun joueur sélectionné.</Text>}
          </ScrollView>

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  matchup: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  sectionHeading: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flexShrink: 1, textAlign: 'right' },
  playerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border, gap: 12,
  },
  playerName: { flex: 1, fontSize: 15, color: colors.textPrimary },
  playerMeta: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  license: { fontSize: 13, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  points: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, minWidth: 56, textAlign: 'right' },
  empty: { fontSize: 14, color: colors.textSecondary, paddingTop: 8 },
  closeBtn: {
    backgroundColor: colors.bg, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20,
  },
  closeTxt: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
})
