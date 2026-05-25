import { useMemo, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppData } from '@/contexts/DataContext'
import { colors } from '@/constants/colors'

// ---------------------------------------------------------------------------
// Week helpers
// ---------------------------------------------------------------------------
function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().slice(0, 10)
}

function getSundayOf(mondayStr: string): string {
  const d = new Date(mondayStr + 'T12:00:00')
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

export function formatWeekRange(mondayStr: string): string {
  const mo = new Date(mondayStr + 'T12:00:00')
  const su = new Date(mo)
  su.setDate(mo.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  return `Lu ${fmt(mo)} au Di ${fmt(su)}`
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function JourneesScreen() {
  const { matchDays, games, phases, divisions, groups } = useAppData()
  const router = useRouter()

  const activePhase = phases.find((p) => p.isActive)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    () => new Set(activePhase ? [activePhase.id] : []),
  )

  const sortedPhases = useMemo(
    () =>
      [...phases].sort((a, b) => {
        if (a.isActive && !b.isActive) return -1
        if (!a.isActive && b.isActive) return 1
        return a.displayName.localeCompare(b.displayName)
      }),
    [phases],
  )

  // phaseId → Map<mondayStr, MatchDay[]>
  const phaseWeeks = useMemo(() => {
    const groupMap = new Map(groups.map((g) => [g.id, g]))
    const divMap = new Map(divisions.map((d) => [d.id, d]))
    const result = new Map<string, Map<string, typeof matchDays>>()
    for (const p of phases) result.set(p.id, new Map())
    for (const md of matchDays) {
      const grp = groupMap.get(md.groupId)
      if (!grp) continue
      const div = divMap.get(grp.divisionId)
      if (!div) continue
      const weekMap = result.get(div.phaseId)
      if (!weekMap) continue
      const mon = getMondayOf(md.date)
      weekMap.set(mon, [...(weekMap.get(mon) ?? []), md])
    }
    return result
  }, [matchDays, groups, divisions, phases])

  const now = new Date().toISOString().slice(0, 10)

  function togglePhase(id: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {sortedPhases.map((phase) => {
          const weekMap = phaseWeeks.get(phase.id) ?? new Map()
          const weeks = [...weekMap.keys()].sort()
          const isExpanded = expandedPhases.has(phase.id)

          return (
            <View key={phase.id} style={styles.phaseSection}>
              <TouchableOpacity style={styles.phaseHeader} onPress={() => togglePhase(phase.id)}>
                <View style={styles.phaseLeft}>
                  {phase.isActive && <View style={styles.activeBadge} />}
                  <Text style={styles.phaseTitle}>{phase.displayName}</Text>
                  <Text style={styles.weekCount}>{weeks.length} semaine{weeks.length !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={styles.phaseChevron}>{isExpanded ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {isExpanded &&
                weeks.map((mon) => {
                  const mds = weekMap.get(mon) ?? []
                  const cnt = games.filter((g) => mds.some((md) => md.id === g.matchDayId)).length
                  const isPast = getSundayOf(mon) < now

                  return (
                    <TouchableOpacity
                      key={mon}
                      style={styles.weekRow}
                      onPress={() => router.push(`/(tabs)/journees/${mon}`)}
                    >
                      <View style={[styles.dot, isPast ? styles.dotPast : styles.dotFuture]} />
                      <View style={styles.weekBody}>
                        <Text style={styles.weekRange}>{formatWeekRange(mon)}</Text>
                        <Text style={styles.weekMeta}>
                          {cnt} match{cnt !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Text style={styles.rowChevron}>›</Text>
                    </TouchableOpacity>
                  )
                })}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12 },

  phaseSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  phaseLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  activeBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  phaseTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  weekCount: { fontSize: 12, color: colors.textSecondary },
  phaseChevron: { fontSize: 16, color: colors.textSecondary },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotFuture: { backgroundColor: colors.accent },
  dotPast: { backgroundColor: colors.border },
  weekBody: { flex: 1 },
  weekRange: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  weekMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowChevron: { fontSize: 22, color: colors.textSecondary },
})
