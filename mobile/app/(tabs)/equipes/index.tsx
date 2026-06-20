import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamName } from '@/utils/roles'
import { colors } from '@/constants/colors'
import { useMemo, useState } from 'react'

export default function EquipesScreen() {
  const { teams, clubs, phases, divisions } = useAppData()
  const { user } = useAuth()
  const router = useRouter()

  const visibleTeams =
    user?.role === 'general_admin'
      ? teams
      : teams.filter((t) => t.clubId === user?.clubId)

  // Group by phase, active phase first then by displayName descending
  const phaseGroups = useMemo(() => {
    const byPhase = new Map<string, typeof visibleTeams>()
    for (const t of visibleTeams) {
      const arr = byPhase.get(t.phaseId) ?? []
      arr.push(t)
      byPhase.set(t.phaseId, arr)
    }
    return [...byPhase.entries()]
      .map(([phaseId, phaseTeams]) => {
        const phase = phases.find((p) => p.id === phaseId)
        return { phase, phaseTeams }
      })
      .sort((a, b) => {
        if (a.phase?.isActive !== b.phase?.isActive) return a.phase?.isActive ? -1 : 1
        return (b.phase?.displayName ?? '').localeCompare(a.phase?.displayName ?? '')
      })
  }, [visibleTeams, phases])

  const activePhaseId = phases.find((p) => p.isActive)?.id
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    () => new Set(activePhaseId ? [activePhaseId] : []),
  )

  function togglePhase(id: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const rows: Array<
    | { type: 'header'; phaseId: string; label: string; expanded: boolean }
    | { type: 'team'; team: (typeof visibleTeams)[0] }
  > = []

  for (const { phase, phaseTeams } of phaseGroups) {
    const phaseId = phase?.id ?? 'unknown'
    const label = phase ? `Saison ${phase.displayName}` : 'Phase inconnue'
    const expanded = expandedPhases.has(phaseId)
    rows.push({ type: 'header', phaseId, label, expanded })
    if (expanded) {
      for (const t of phaseTeams) rows.push({ type: 'team', team: t })
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(row) =>
          row.type === 'header' ? `header-${row.phaseId}` : `team-${row.team.id}`
        }
        contentContainerStyle={styles.list}
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            return (
              <TouchableOpacity
                style={styles.phaseHeader}
                onPress={() => togglePhase(row.phaseId)}
              >
                <Text style={styles.phaseTitle}>{row.label}</Text>
                <Text style={styles.phaseChevron}>{row.expanded ? '▾' : '▸'}</Text>
              </TouchableOpacity>
            )
          }

          const { team } = row
          const division = divisions.find((d) => d.id === team.divisionId)

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/equipes/${team.id}`)}
            >
              <View style={[styles.colorBar, { backgroundColor: team.color ?? colors.accent }]} />
              <View style={styles.cardBody}>
                <Text style={styles.teamName}>{getTeamName(team, clubs)}</Text>
                {division && <Text style={styles.levelBadge}>{division.displayName}</Text>}
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
  list: { padding: 16, gap: 6 },

  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  phaseTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  phaseChevron: { fontSize: 14, color: colors.textSecondary },

  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  colorBar: { width: 6, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 14, gap: 4 },
  teamName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  levelBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chevron: { fontSize: 22, color: colors.textSecondary, paddingRight: 12 },
})
