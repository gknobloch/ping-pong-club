import { FlatList, View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useAppData } from '@/contexts/DataContext'
import { colors } from '@/constants/colors'

export default function AdminClubsScreen() {
  const { clubs, teams, players } = useAppData()

  const activeClubs = clubs.filter((c) => !c.isArchived)

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activeClubs}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: club }) => {
          const clubTeams = teams.filter((t) => t.clubId === club.id)
          const clubPlayers = players.filter((p) => p.clubId === club.id)
          const defaultAddr = club.addresses?.find((a) => a.isDefault)
          return (
            <View style={styles.card}>
              <Text style={styles.name}>{club.displayName}</Text>
              <Text style={styles.affiliation}>N° {club.affiliationNumber}</Text>
              {defaultAddr && (
                <Text style={styles.address}>
                  {defaultAddr.street}, {defaultAddr.postalCode} {defaultAddr.city}
                </Text>
              )}
              <View style={styles.meta}>
                <Text style={styles.metaText}>{clubTeams.length} équipe{clubTeams.length > 1 ? 's' : ''}</Text>
                <Text style={styles.metaText}>{clubPlayers.length} joueur{clubPlayers.length > 1 ? 's' : ''}</Text>
              </View>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  name: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  affiliation: { fontSize: 12, color: colors.textSecondary },
  address: { fontSize: 13, color: colors.textSecondary },
  meta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaText: { fontSize: 13, color: colors.accent, fontWeight: '500' },
})
