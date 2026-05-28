import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { colors } from '@/constants/colors'
import { getTeamName } from '@/utils/roles'

const STATUS_LABELS = {
  active: 'Actif',
  pending_validation: 'En attente de validation',
  archived: 'Archivé',
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { players, teams, clubs, phases } = useAppData()
  const { user, logout } = useAuth()
  const navigation = useNavigation()
  const isOwnProfile = !!user?.playerId && user.playerId === id

  const player = players.find((p) => p.id === id)
  const club = clubs.find((c) => c.id === player?.clubId)

  const activePhase = phases.find((p) => p.isActive && !p.isArchived)
  const playerTeams = teams.filter(
    (t) => t.phaseId === activePhase?.id && t.playerIds?.includes(id ?? ''),
  )

  // Points at start of phase: taken from the team's rosterInitialPoints map
  const activeTeam = playerTeams[0]
  const phasePoints = activeTeam?.rosterInitialPoints?.[id ?? '']

  useEffect(() => {
    if (player)
      navigation.setOptions({ title: `${player.firstName} ${player.lastName}` })
  }, [player, navigation])

  if (!player) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Joueur introuvable.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>
              {player.firstName[0]}{player.lastName[0]}
            </Text>
          </View>
          <Text style={styles.name}>{player.firstName} {player.lastName}</Text>
          <View style={[styles.statusBadge, player.status !== 'active' && styles.statusBadgeMuted]}>
            <Text style={[styles.statusText, player.status !== 'active' && styles.statusTextMuted]}>
              {STATUS_LABELS[player.status] ?? player.status}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          {club && <InfoRow label="Club" value={club.displayName} />}
          {player.licenseNumber && <InfoRow label="Licence" value={player.licenseNumber} />}
          {phasePoints && <InfoRow label="Points" value={phasePoints} />}
          {player.email && <InfoRow label="Email" value={player.email} />}
          {player.phone && (
            <PhoneRow phone={player.phone} />
          )}
        </View>

        {/* Active phase teams */}
        {playerTeams.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Équipe</Text>
            {playerTeams.map((t) => (
              <View key={t.id} style={styles.teamRow}>
                <View style={[styles.colorDot, { backgroundColor: t.color ?? colors.accent }]} />
                <Text style={styles.teamName}>{getTeamName(t, clubs)}</Text>
                {t.captainId === player.id && <Text style={styles.cap}>Cap.</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Logout — only shown on the user's own profile */}
        {isOwnProfile && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function PhoneRow({ phone }: { phone: string }) {
  const digits = phone.replace(/[^\d+]/g, '')
  const waUrl = `https://wa.me/${digits.startsWith('+') ? digits.slice(1) : digits}`
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>Téléphone</Text>
      <TouchableOpacity onPress={() => Linking.openURL(waUrl)}>
        <Text style={[styles.infoValue, styles.phoneLink]}>{phone}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { gap: 12, paddingBottom: 32 },
  notFound: { padding: 24, color: colors.textSecondary, textAlign: 'center' },
  header: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#fff', fontWeight: '700', fontSize: 26 },
  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeMuted: { backgroundColor: '#f1f5f9' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  statusTextMuted: { color: colors.textSecondary },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  phoneLink: { color: '#25D366' },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  teamName: { flex: 1, fontSize: 15, color: colors.textPrimary },
  cap: { fontSize: 11, fontWeight: '600', color: colors.accent },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
})
