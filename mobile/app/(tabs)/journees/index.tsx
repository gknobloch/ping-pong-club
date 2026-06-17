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
  // Past weeks are collapsed by default so upcoming weeks stay front-and-center.
  const [pastExpandedPhases, setPastExpandedPhases] = useState<Set<string>>(new Set())

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

  function togglePastWeeks(id: string) {
    setPastExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Renders a single tappable week as a card (matches the Accueil match cards).
  function renderWeekCard(mon: string, weekMap: Map<string, typeof matchDays>) {
    const mds = weekMap.get(mon) ?? []
    const cnt = games.filter((g) => mds.some((md) => md.id === g.matchDayId)).length
    // Journée number(s) for the week — usually one, shown as a "J7" badge like
    // the Accueil match cards.
    const numbers = [...new Set(mds.map((md) => md.number))].sort((a, b) => a - b)
    return (
      <TouchableOpacity
        key={mon}
        style={styles.weekCard}
        onPress={() => router.push(`/(tabs)/journees/${mon}`)}
      >
        <View style={styles.weekBody}>
          <View style={styles.weekTopRow}>
            <Text style={styles.weekRange}>{formatWeekRange(mon)}</Text>
            <Text style={styles.weekMeta}>
              {cnt} match{cnt !== 1 ? 's' : ''}
            </Text>
          </View>
          {numbers.length > 0 && (
            <View style={styles.badges}>
              {numbers.map((n) => (
                <Text key={n} style={styles.badge}>J{n}</Text>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {sortedPhases.map((phase) => {
          const weekMap = phaseWeeks.get(phase.id) ?? new Map()
          const allWeeks = [...weekMap.keys()]
          // Upcoming weeks: closest → furthest. Past weeks: most recent first.
          const upcoming = allWeeks.filter((mon) => getSundayOf(mon) >= now).sort()
          const past = allWeeks.filter((mon) => getSundayOf(mon) < now).sort().reverse()
          const isExpanded = expandedPhases.has(phase.id)
          const pastExpanded = pastExpandedPhases.has(phase.id)
          // Only the active phase advertises an (empty) "à venir" section.
          const showUpcoming = phase.isActive || upcoming.length > 0

          return (
            <View key={phase.id} style={styles.phaseBlock}>
              <TouchableOpacity style={styles.phaseHeader} onPress={() => togglePhase(phase.id)}>
                <View style={styles.phaseLeft}>
                  {phase.isActive && <View style={styles.activeBadge} />}
                  <Text style={styles.phaseTitle}>{phase.displayName}</Text>
                </View>
                <Text style={styles.phaseChevron}>{isExpanded ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <>
                  {showUpcoming && (
                    <>
                      <View style={styles.groupLabelRow}>
                        <Text style={styles.groupLabel}>Prochaines journées</Text>
                      </View>
                      {upcoming.length > 0 ? (
                        upcoming.map((mon) => renderWeekCard(mon, weekMap))
                      ) : (
                        <Text style={styles.empty}>Pas de prochaine journée.</Text>
                      )}
                    </>
                  )}

                  {past.length > 0 && (
                    <>
                      <TouchableOpacity
                        style={styles.groupLabelRow}
                        onPress={() => togglePastWeeks(phase.id)}
                      >
                        <Text style={styles.groupLabel}>Journées passées</Text>
                        <Text style={styles.groupChevron}>{pastExpanded ? '▾' : '▸'}</Text>
                      </TouchableOpacity>
                      {pastExpanded && past.map((mon) => renderWeekCard(mon, weekMap))}
                    </>
                  )}

                  {!showUpcoming && past.length === 0 && (
                    <Text style={styles.empty}>Aucune journée.</Text>
                  )}
                </>
              )}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16 },

  phaseBlock: { marginBottom: 8 },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  phaseLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  activeBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  phaseTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  phaseChevron: { fontSize: 16, color: colors.textSecondary },

  // Section labels ("Prochaines journées" / "Journées passées"), Accueil style.
  groupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupChevron: { fontSize: 16, color: colors.textSecondary },
  empty: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },

  weekCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  weekBody: { flex: 1 },
  weekTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  weekRange: { flexShrink: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  weekMeta: { fontSize: 13, color: colors.textSecondary },
  badges: { flexDirection: 'row', gap: 4, marginTop: 6 },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rowChevron: { fontSize: 22, color: colors.textSecondary },
})
