import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { colors } from '@/constants/colors'

export default function HomeScreen() {
  const { user, displayName, roleLabel, logout } = useAuth()
  const { clubs, seasons, matchDays, games } = useAppData()
  const router = useRouter()

  const activeSeason = seasons.find((s) => s.isActive)
  const upcomingMatchDays = matchDays
    .filter((md) => new Date(md.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  const adminClubNames =
    user?.clubIds
      ?.map((id) => clubs.find((c) => c.id === id)?.displayName)
      .filter(Boolean)
      .join(', ') ?? ''

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Welcome card */}
        <View style={styles.card}>
          <Text style={styles.welcome}>Bienvenue, {displayName} 👋</Text>
          <Text style={styles.roleText}>{roleLabel}</Text>
          {user?.role === 'club_admin' && adminClubNames ? (
            <Text style={styles.clubText}>Club : {adminClubNames}</Text>
          ) : null}
        </View>

        {/* Active season */}
        {activeSeason && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Saison en cours</Text>
            <Text style={styles.seasonName}>{activeSeason.displayName}</Text>
          </View>
        )}

        {/* Upcoming match days */}
        {upcomingMatchDays.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Prochaines journées</Text>
            {upcomingMatchDays.map((md) => {
              const count = games.filter((g) => g.matchDayId === md.id).length
              return (
                <TouchableOpacity
                  key={md.id}
                  style={styles.matchDayRow}
                  onPress={() => router.push(`/(tabs)/journees/${md.id}`)}
                >
                  <View>
                    <Text style={styles.matchDayName}>Journée {md.number}</Text>
                    <Text style={styles.matchDayDate}>
                      {new Date(md.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.matchCount}>{count} match{count > 1 ? 's' : ''}</Text>
                </TouchableOpacity>
              )
            })}
            <TouchableOpacity onPress={() => router.push('/(tabs)/journees')}>
              <Text style={styles.link}>Voir toutes les journées →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  welcome: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  roleText: { fontSize: 14, color: colors.accent, fontWeight: '500' },
  clubText: { fontSize: 13, color: colors.textSecondary },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  seasonName: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  matchDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchDayName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  matchDayDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  matchCount: { fontSize: 13, color: colors.textSecondary },
  link: { fontSize: 14, color: colors.accent, marginTop: 8, fontWeight: '500' },
  logoutBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { fontSize: 15, color: colors.danger, fontWeight: '600' },
})
