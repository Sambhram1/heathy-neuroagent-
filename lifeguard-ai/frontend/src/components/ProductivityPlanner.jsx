import { useCallback, useEffect, useMemo, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { apiUrl } from '../lib/apiBase'

const PLANNER_ENERGY = [
  { start_time: '2026-03-01T09:00:00', end_time: '2026-03-31T11:30:00', level: 85 },
  { start_time: '2026-03-01T11:30:00', end_time: '2026-03-31T14:00:00', level: 50 },
  { start_time: '2026-03-01T14:00:00', end_time: '2026-03-31T18:00:00', level: 70 },
]

const PLANNER_AVAILABILITY = [
  { start_time: '2026-03-01T08:00:00', end_time: '2026-03-31T12:30:00' },
  { start_time: '2026-03-01T14:00:00', end_time: '2026-03-31T20:00:00' },
]

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CATEGORY_ORDER = ['diet', 'exercise', 'productivity']
const EXERCISE_VIDEO_LINKS = [
  'https://www.youtube.com/watch?v=ml6cT4AZdqI',
  'https://www.youtube.com/watch?v=UBMk30rjy0o',
  'https://www.youtube.com/watch?v=2L2lnxIcNmo',
  'https://www.youtube.com/watch?v=v7AYKMP6rOE',
  'https://www.youtube.com/watch?v=4BOTvaRaDjI',
  'https://www.youtube.com/watch?v=inpok4MKVLM',
  'https://www.youtube.com/watch?v=UItWltVZZmE',
]

const CATEGORY_META = {
  diet: {
    label: 'Diet Plan',
    section: 'border-[#34d399]/35 bg-[#34d399]/8',
    chip: 'border-[#34d399]/50 bg-[#34d399]/18 text-[#bbf7d0]',
    dot: 'bg-[#34d399]',
  },
  exercise: {
    label: 'Exercise Video',
    section: 'border-[#60a5fa]/35 bg-[#60a5fa]/8',
    chip: 'border-[#60a5fa]/50 bg-[#60a5fa]/18 text-[#bfdbfe]',
    dot: 'bg-[#60a5fa]',
  },
  productivity: {
    label: 'Productivity',
    section: 'border-[#f59e0b]/35 bg-[#f59e0b]/8',
    chip: 'border-[#f59e0b]/50 bg-[#f59e0b]/18 text-[#fde68a]',
    dot: 'bg-[#f59e0b]',
  },
}

function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function withTime(date, hh, mm) {
  const d = new Date(date)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

function formatTime(ts) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getTaskCategory(taskName) {
  const task = String(taskName || '').toLowerCase()
  if (task.includes('diet') || task.includes('meal') || task.includes('nutrition') || task.includes('hydration')) return 'diet'
  if (task.includes('exercise') || task.includes('workout') || task.includes('mobility') || task.includes('stretch') || task.includes('video')) return 'exercise'
  return 'productivity'
}

function modeStyles(mode) {
  if (mode === 'focus') {
    return {
      border: 'border-[#a3e635]/35',
      badge: 'text-[#a3e635] border-[#a3e635]/40 bg-[#a3e635]/10',
      glow: 'radial-gradient(circle at 14% 20%, rgba(163,230,53,0.22), transparent 45%)',
    }
  }
  if (mode === 'calm') {
    return {
      border: 'border-[#7dd3fc]/35',
      badge: 'text-[#7dd3fc] border-[#7dd3fc]/40 bg-[#7dd3fc]/10',
      glow: 'radial-gradient(circle at 84% 20%, rgba(125,211,252,0.22), transparent 45%)',
    }
  }
  return {
    border: 'border-white/15',
    badge: 'text-white/80 border-white/20 bg-white/5',
    glow: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.12), transparent 45%)',
  }
}

function buildPersonalizedTasks(userProfile, riskScores) {
  const activity = String(userProfile?.activity_level || 'moderate').toLowerCase()
  const stress = Number(userProfile?.stress_level || 5)
  const diabetesRisk = Number(riskScores?.diabetes_risk || 0)
  const cvdRisk = Number(riskScores?.cvd_risk || 0)

  return [
    { task: diabetesRisk >= 45 ? 'Diet plan: low-glycemic breakfast prep' : 'Diet plan: balanced breakfast and hydration', duration_minutes: 35, priority: 0.86, intensity: 'light' },
    { task: diabetesRisk >= 45 ? 'Diet plan: fiber-focused lunch box' : 'Diet plan: high-protein lunch prep', duration_minutes: 40, priority: 0.82, intensity: 'light' },
    { task: cvdRisk >= 40 ? 'Exercise video: low-impact cardio session' : 'Exercise video: HIIT 20 min session', duration_minutes: 30, priority: 0.84, intensity: 'medium' },
    { task: activity === 'sedentary' ? 'Exercise video: mobility and stretching routine' : 'Exercise video: strength and mobility routine', duration_minutes: 30, priority: 0.8, intensity: 'light' },
    { task: stress >= 7 ? 'Productivity: focus block with breathing breaks' : 'Productivity: deep work implementation block', duration_minutes: 90, priority: 0.92, intensity: 'deep' },
    { task: 'Productivity: async email and review block', duration_minutes: 45, priority: 0.7, intensity: 'light' },
  ]
}

function fallbackTaskText(category, userProfile, riskScores) {
  const diabetesRisk = Number(riskScores?.diabetes_risk || 0)
  const cvdRisk = Number(riskScores?.cvd_risk || 0)
  const stress = Number(userProfile?.stress_level || 5)

  if (category === 'diet') {
    return diabetesRisk >= 45 ? 'Diet plan: low sugar meal planning' : 'Diet plan: balanced plate prep'
  }
  if (category === 'exercise') {
    return cvdRisk >= 40 ? 'Exercise video: brisk walk and recovery' : 'Exercise video: guided conditioning'
  }
  return stress >= 7 ? 'Productivity: calm focus sprint' : 'Productivity: high-focus execution block'
}

function makeFallbackBlock(date, category, userProfile, riskScores) {
  if (category === 'diet') {
    return {
      task: fallbackTaskText(category, userProfile, riskScores),
      start_time: withTime(date, 8, 30),
      end_time: withTime(date, 9, 0),
      energy_level_used: 'medium',
    }
  }
  if (category === 'exercise') {
    return {
      task: fallbackTaskText(category, userProfile, riskScores),
      start_time: withTime(date, 18, 0),
      end_time: withTime(date, 18, 30),
      energy_level_used: 'medium',
    }
  }
  return {
    task: fallbackTaskText(category, userProfile, riskScores),
    start_time: withTime(date, 10, 0),
    end_time: withTime(date, 10, 45),
    energy_level_used: 'high',
  }
}

function parseTasksFromLlmMessage(message) {
  const text = String(message || '')
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start < 0 || end <= start) return null

  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    if (!Array.isArray(parsed)) return null
    const normalized = parsed
      .filter((row) => row && typeof row === 'object')
      .map((row, i) => ({
        task: String(row.task || row.title || `Personalized task ${i + 1}`),
        duration_minutes: Number.isFinite(Number(row.duration_minutes)) && Number(row.duration_minutes) > 0
          ? Number(row.duration_minutes)
          : 30,
        priority: Number.isFinite(Number(row.priority))
          ? Math.max(0, Math.min(1, Number(row.priority)))
          : 0.7,
        intensity: String(row.intensity || 'light').toLowerCase() === 'deep' ? 'deep' : 'light',
      }))
      .filter((row) => row.task)

    return normalized.length ? normalized : null
  } catch {
    return null
  }
}

function pickExerciseVideoUrl(dateKey, index, taskName) {
  const dayPart = Number(String(dateKey || '').split('-')[2] || 0)
  const taskHash = String(taskName || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const seed = dayPart + index + taskHash
  return EXERCISE_VIDEO_LINKS[seed % EXERCISE_VIDEO_LINKS.length]
}

export default function ProductivityPlanner({ user, userProfile, riskScores, onNavigateSection }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cursor, setCursor] = useState(new Date())

  const uiMode = result?.meta?.ui_mode || 'balanced'
  const skin = useMemo(() => modeStyles(uiMode), [uiMode])
  const monthKey = useMemo(() => monthKeyFromDate(cursor), [cursor])

  const monthMatrix = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells = []
    for (let i = 0; i < firstDow; i += 1) cells.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d))
    while (cells.length < 42) cells.push(null)

    return cells
  }, [cursor])

  const getLlmPersonalizedTasks = useCallback(async () => {
    const profileSummary = {
      age: userProfile?.age,
      sex: userProfile?.sex,
      activity_level: userProfile?.activity_level,
      stress_level: userProfile?.stress_level,
      diet_quality: userProfile?.diet_quality,
      sleep_hours: userProfile?.sleep_hours,
      risks: riskScores || {},
    }

    const prompt = [
      'Generate a personalized productivity calendar task list.',
      'Return ONLY JSON array with fields: task, duration_minutes, priority, intensity.',
      'Include at least: 2 diet tasks, 2 exercise video tasks, 2 productivity tasks.',
      'Keep tasks concise and realistic for a monthly routine.',
      `Profile: ${JSON.stringify(profileSummary)}`,
    ].join(' ')

    const response = await fetch(apiUrl('/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: `planner-${user?.uid || 'anon'}-${monthKey}`,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) return null
    const data = await response.json()
    return parseTasksFromLlmMessage(data?.message)
  }, [monthKey, riskScores, user?.uid, userProfile])

  const loadSchedule = useCallback(
    async (forceRegenerate = false) => {
      setLoading(true)
      setError('')

      try {
        const plannerDoc = user?.uid ? doc(db, 'users', user.uid, 'plannerMonths', monthKey) : null

        if (plannerDoc && !forceRegenerate) {
          const saved = await getDoc(plannerDoc)
          if (saved.exists()) {
            const payload = saved.data()?.payload
            if (payload?.schedule) {
              setResult(payload)
              setLoading(false)
              return
            }
          }
        }

        const llmTasks = await getLlmPersonalizedTasks()
        const tasks = llmTasks || buildPersonalizedTasks(userProfile, riskScores)
        const response = await fetch(apiUrl('/api/productivity-plan'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tasks,
            energy_levels: PLANNER_ENERGY,
            calendar_availability: PLANNER_AVAILABILITY,
            horizon: 'week',
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to generate schedule (${response.status})`)
        }

        const data = await response.json()
        const payload = {
          ...data,
          meta: {
            ...(data.meta || {}),
            personalized_for_uid: user?.uid || null,
          },
        }

        setResult(payload)

        if (plannerDoc) {
          await setDoc(
            plannerDoc,
            {
              uid: user.uid,
              month: monthKey,
              payload,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
        }
      } catch (e) {
        setError(e.message || 'Unable to load planner data')
      } finally {
        setLoading(false)
      }
    },
    [getLlmPersonalizedTasks, monthKey, riskScores, user?.uid, userProfile]
  )

  useEffect(() => {
    loadSchedule(false)
  }, [loadSchedule])

  const dayBlocksMap = useMemo(() => {
    const map = new Map()
    const weekdayTemplate = new Map()
    const rows = Array.isArray(result?.schedule) ? result.schedule : []

    for (const row of rows) {
      const start = new Date(row.start_time)
      if (Number.isNaN(start.getTime())) continue

      const key = localDateKey(start)
      const dow = start.getDay()

      if (!map.has(key)) map.set(key, [])
      map.get(key).push(row)

      if (!weekdayTemplate.has(dow)) weekdayTemplate.set(dow, [])
      weekdayTemplate.get(dow).push(row)
    }

    for (const date of monthMatrix) {
      if (!date) continue
      const key = localDateKey(date)
      if (!map.has(key)) {
        const template = weekdayTemplate.get(date.getDay()) || []
        map.set(key, template.map((item) => ({ ...item })))
      }

      const blocks = map.get(key) || []
      const present = new Set(blocks.map((b) => getTaskCategory(b.task)))
      for (const category of CATEGORY_ORDER) {
        if (!present.has(category)) {
          blocks.push(makeFallbackBlock(date, category, userProfile, riskScores))
        }
      }

      blocks.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      map.set(key, blocks)
    }

    return map
  }, [monthMatrix, result, riskScores, userProfile])

  const changeMonth = (delta) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  const today = new Date()

  return (
    <div className="space-y-4 animate-fade-in">
      <div className={`relative overflow-hidden rounded-2xl border ${skin.border} bg-[rgba(255,255,255,0.02)] p-5`}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: skin.glow }} />
        <div className="relative flex items-center gap-3">
          <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded border ${skin.badge}`}>
            AI Productivity Planner
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-white/45">Month Calendar</span>

          <div className="ml-2 hidden lg:flex items-center gap-2">
            {CATEGORY_ORDER.map((category) => (
              <span key={category} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-white/75">
                <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_META[category].dot}`} />
                {CATEGORY_META[category].label}
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="h-8 w-8 rounded-lg border border-white/20 bg-white/5 text-white/75 hover:bg-white/15"
              aria-label="Previous month"
            >
              {'<'}
            </button>
            <p className="min-w-[170px] text-center text-sm font-mono uppercase tracking-widest text-white/85">
              {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
            </p>
            <button
              onClick={() => changeMonth(1)}
              className="h-8 w-8 rounded-lg border border-white/20 bg-white/5 text-white/75 hover:bg-white/15"
              aria-label="Next month"
            >
              {'>'}
            </button>
            <button
              onClick={() => loadSchedule(true)}
              disabled={loading}
              className="ml-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/90 hover:bg-white/20 disabled:opacity-60"
            >
              {loading ? 'Syncing...' : 'Refresh Plan'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-xs text-[#fecaca]">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)]">
        <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
          {DAY_NAMES.map((day) => (
            <div key={day} className="px-2 py-3 text-center text-[11px] font-mono uppercase tracking-widest text-white/55">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 grid-rows-6">
          {monthMatrix.map((dateObj, idx) => {
            if (!dateObj) {
              return <div key={`empty-${idx}`} className="min-h-[145px] border-b border-r border-white/5 bg-black/25" />
            }

            const key = localDateKey(dateObj)
            const blocks = dayBlocksMap.get(key) || []
            const isToday =
              dateObj.getDate() === today.getDate() &&
              dateObj.getMonth() === today.getMonth() &&
              dateObj.getFullYear() === today.getFullYear()

            return (
              <div key={key} className="min-h-[170px] border-b border-r border-white/5 px-2 py-2 transition-colors hover:bg-white/[0.03]">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-mono ${
                      isToday ? 'bg-[#facc15] text-black font-bold shadow-[0_0_12px_rgba(250,204,21,0.55)]' : 'text-white/65'
                    }`}
                  >
                    {dateObj.getDate()}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wide text-white/35">{blocks.length} tasks</span>
                </div>

                <div className="space-y-1.5 overflow-y-auto pr-1 max-h-[124px]">
                  {CATEGORY_ORDER.map((category) => {
                    const categoryBlocks = blocks.filter((block) => getTaskCategory(block.task) === category)
                    const meta = CATEGORY_META[category]

                    return (
                      <div key={`${key}-${category}`} className={`rounded-md border px-1.5 py-1 ${meta.section}`}>
                        <p className="mb-1 text-[8px] font-mono uppercase tracking-widest text-white/65">{meta.label}</p>
                        {categoryBlocks.slice(0, 1).map((block, i) => {
                          const videoUrl = category === 'exercise' ? pickExerciseVideoUrl(key, i, block.task) : null
                          const canOpenDiet = category === 'diet' && typeof onNavigateSection === 'function'
                          return (
                            <div
                              key={`${key}-${category}-${i}-${block.task}`}
                              className={`rounded-md border px-1.5 py-1 text-[9px] font-mono leading-tight ${meta.chip} ${canOpenDiet ? 'cursor-pointer hover:brightness-110 transition' : ''}`}
                              title={`${formatTime(block.start_time)} ${block.task}`}
                              role={canOpenDiet ? 'button' : undefined}
                              tabIndex={canOpenDiet ? 0 : undefined}
                              onClick={canOpenDiet ? () => onNavigateSection('diet') : undefined}
                              onKeyDown={
                                canOpenDiet
                                  ? (e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        onNavigateSection('diet')
                                      }
                                    }
                                  : undefined
                              }
                            >
                              <p className="truncate opacity-80">{formatTime(block.start_time)}</p>
                              <p className="truncate font-semibold">{block.task}</p>
                              {canOpenDiet && (
                                <p className="mt-1 text-[8px] uppercase tracking-widest text-white/80 underline decoration-white/45 underline-offset-2">
                                  Open Diet Plan
                                </p>
                              )}
                              {videoUrl && (
                                <a
                                  href={videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 block text-[8px] uppercase tracking-widest underline decoration-white/50 underline-offset-2 hover:text-white"
                                >
                                  Open Video
                                </a>
                              )}
                            </div>
                          )
                        })}
                        {categoryBlocks.length > 1 && <p className="mt-1 text-[9px] font-mono text-white/45">+{categoryBlocks.length - 1} more</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
