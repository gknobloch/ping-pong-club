import { useMemo, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppData } from '@/contexts/DataContext'
import { colors } from '@/constants/colors'
import { getMondayOf, getSundayOf, formatWeekRange } from '@/utils/weeks'

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function JourneesScreen() {
  const { matchDays, games, phases, divisions, groups, refreshing, refresh } = useAppData()
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
        onPress={() => router.push(`/week/${mon}`)}
      >
        <View style={styles.weekBody}>
          <Text style={styles.weekRange}>{formatWeekRange(mon)}</Text>
          {numbers.length > 0 && (
            <View style={styles.badges}>
              {numbers.map((n) => (
                <Text key={n} style={styles.badge}>J{n}</Text>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.weekMeta}>
          {cnt} match{cnt !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
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

                  {past.length > 0 &&
                    // A phase with no upcoming weeks is entirely in the past, so
                    // its weeks are shown expanded with no collapsible. Otherwise
                    // past weeks stay collapsed to keep upcoming weeks front-and-center.
                    (!showUpcoming ? (
                      <>
                        <View style={styles.groupLabelRow}>
                          <Text style={styles.groupLabel}>Journées passées</Text>
                        </View>
                        {past.map((mon) => renderWeekCard(mon, weekMap))}
                      </>
                    ) : (
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
                    ))}

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
  weekRange: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
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
