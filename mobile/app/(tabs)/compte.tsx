import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/DataContext'
import { colors } from '@/constants/colors'
import { getTeamName, getRoleLabel } from '@/utils/roles'

export default function MonCompteScreen() {
  const { user, logout } = useAuth()
  const { players, teams, clubs, phases } = useAppData()

  const player = user?.playerId ? players.find((p) => p.id === user.playerId) : null
  const club = player ? clubs.find((c) => c.id === player.clubId) : null

  const activePhase = phases.find((p) => p.isActive && !p.isArchived)
  const playerTeams = player
    ? teams.filter((t) => t.phaseId === activePhase?.id && t.playerIds?.includes(player.id))
    : []
  const activeTeam = playerTeams[0]
  const phasePoints = player ? activeTeam?.rosterInitialPoints?.[player.id] : undefined

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>
              {player
                ? `${player.firstName[0]}${player.lastName[0]}`
                : (user?.email?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>
            {player ? `${player.firstName} ${player.lastName}` : user?.email ?? '—'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleLabel(user?.role ?? 'player')}</Text>
          </View>
        </View>

        {/* Player info */}
        {player && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            {club && <InfoRow label="Club" value={club.displayName} />}
            {player.licenseNumber && <InfoRow label="Licence" value={player.licenseNumber} />}
            {phasePoints && <InfoRow label="Points" value={phasePoints} />}
            {player.email && <InfoRow label="Email" value={player.email} />}
            {player.phone && <PhoneRow phone={player.phone} />}
          </View>
        )}

        {/* Admin: just show email */}
        {!player && user?.email && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <InfoRow label="Email" value={user.email} />
          </View>
        )}

        {/* Active team */}
        {playerTeams.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Équipe</Text>
            {playerTeams.map((t) => (
              <View key={t.id} style={styles.teamRow}>
                <View style={[styles.colorDot, { backgroundColor: t.color ?? colors.accent }]} />
                <Text style={styles.teamName}>{getTeamName(t, clubs)}</Text>
                {t.captainId === player?.id && <Text style={styles.cap}>Cap.</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
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
  scroll: { gap: 12, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { color: '#fff', fontWeight: '700', fontSize: 26 },
  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  roleBadge: {
    backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: '#4338ca' },
  section: {
    backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  phoneLink: { color: '#25D366' },
  teamRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  teamName: { flex: 1, fontSize: 15, color: colors.textPrimary },
  cap: { fontSize: 11, fontWeight: '600', color: colors.accent },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 8, borderRadius: 12,
    borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff5f5',
    paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
})
