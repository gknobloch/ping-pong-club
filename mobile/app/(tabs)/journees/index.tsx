import { FlatList, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppData } from '@/contexts/DataContext'
import { colors } from '@/constants/colors'

export default function JourneesScreen() {
  const { matchDays, games } = useAppData()
  const router = useRouter()

  const sorted = [...matchDays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(md) => md.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: md }) => {
          const count = games.filter((g) => g.matchDayId === md.id).length
          const isPast = new Date(md.date) < new Date()
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/journees/${md.id}`)}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.number}>J{md.number}</Text>
                <View style={[styles.dot, isPast ? styles.dotPast : styles.dotFuture]} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.date}>
                  {new Date(md.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.meta}>{count} match{count > 1 ? 's' : ''}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLeft: { alignItems: 'center', gap: 4, width: 40 },
  number: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotFuture: { backgroundColor: colors.accent },
  dotPast: { backgroundColor: colors.border },
  cardBody: { flex: 1 },
  date: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textSecondary },
})
