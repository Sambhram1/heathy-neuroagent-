import { useCallback, useEffect, useMemo, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CATEGORY_ORDER = ['diet', 'exercise', 'productivity']

const CATEGORY_META = {
  diet: {
    label: 'Diet Plan',
    icon: '🥗',
    section: 'border-[#34d399]/35 bg-[#34d399]/8',
    chip: 'border-[#34d399]/45 bg-[#34d399]/12 text-[#bbf7d0]',
    dot: 'bg-[#34d399]',
  },
  exercise: {
    label: 'Exercise',
    icon: '💪',
    section: 'border-[#60a5fa]/35 bg-[#60a5fa]/8',
    chip: 'border-[#60a5fa]/45 bg-[#60a5fa]/12 text-[#bfdbfe]',
    dot: 'bg-[#60a5fa]',
  },
  productivity: {
    label: 'Productivity',
    icon: '⚡',
    section: 'border-[#f59e0b]/35 bg-[#f59e0b]/8',
    chip: 'border-[#f59e0b]/45 bg-[#f59e0b]/12 text-[#fde68a]',
    dot: 'bg-[#f59e0b]',
  },
}

const DIET_ROTATION = {
  0: [
    { meals: 'Breakfast: Fruit bowl with yogurt | Lunch: Khichdi with cucumber raita | Dinner: Vegetable soup with roti', calories: 1650, difficulty: 'Easy' },
    { meals: 'Breakfast: Smoothie and nuts | Lunch: Moong dal and rice | Dinner: Tofu stir fry with millet', calories: 1700, difficulty: 'Easy' },
  ],
  1: [
    { meals: 'Breakfast: Oats with banana | Lunch: Dal rice with salad | Dinner: Grilled paneer with roti', calories: 1820, difficulty: 'Medium' },
    { meals: 'Breakfast: Besan chilla with curd | Lunch: Rajma rice with salad | Dinner: Paneer bhurji with roti', calories: 1860, difficulty: 'Medium' },
  ],
  2: [
    { meals: 'Breakfast: Poha with peanuts | Lunch: Sambar rice with vegetables | Dinner: Chickpea curry with roti', calories: 1760, difficulty: 'Easy' },
    { meals: 'Breakfast: Upma with sprouts | Lunch: Dal khichdi and salad | Dinner: Mixed veg curry with roti', calories: 1740, difficulty: 'Easy' },
  ],
  3: [
    { meals: 'Breakfast: Idli and sambar | Lunch: Quinoa pulao with curd | Dinner: Lentil soup with multigrain toast', calories: 1710, difficulty: 'Medium' },
    { meals: 'Breakfast: Dosa with chutney | Lunch: Brown rice and dal | Dinner: Tandoori tofu wrap', calories: 1780, difficulty: 'Medium' },
  ],
  4: [
    { meals: 'Breakfast: Greek yogurt with berries | Lunch: Chicken salad bowl | Dinner: Fish curry with red rice', calories: 1900, difficulty: 'Medium' },
    { meals: 'Breakfast: Egg bhurji toast | Lunch: Grilled chicken wrap | Dinner: Baked fish with vegetables', calories: 1950, difficulty: 'Hard' },
  ],
  5: [
    { meals: 'Breakfast: Millet porridge | Lunch: Vegetable biryani with raita | Dinner: Dal makhani with phulka', calories: 1850, difficulty: 'Medium' },
    { meals: 'Breakfast: Avocado toast | Lunch: Chole rice and salad | Dinner: Paneer tikka with roti', calories: 1880, difficulty: 'Medium' },
  ],
  6: [
    { meals: 'Breakfast: Whole-grain pancakes | Lunch: Light veg pulao | Dinner: Soup and grilled vegetables', calories: 1680, difficulty: 'Easy' },
    { meals: 'Breakfast: Muesli with milk | Lunch: Light dal and rice | Dinner: Stir-fried veggies and tofu', calories: 1720, difficulty: 'Easy' },
  ],
}

const EXERCISE_ROTATION = {
  0: [
    { title: 'Rest day', description: 'Light walk and mobility only', minutes: 20, difficulty: 'Easy' },
    { title: 'Rest day', description: 'Breathing + gentle stretching', minutes: 15, difficulty: 'Easy' },
  ],
  1: [
    { title: '30 min morning run', description: 'Steady pace cardio run', minutes: 30, difficulty: 'Medium' },
    { title: '40 min interval run', description: 'Alternating fast/slow intervals', minutes: 40, difficulty: 'Hard' },
  ],
  2: [
    { title: '45 min yoga', description: 'Flexibility and core flow', minutes: 45, difficulty: 'Medium' },
    { title: '35 min power yoga', description: 'Stronger vinyasa sequence', minutes: 35, difficulty: 'Hard' },
  ],
  3: [
    { title: '20 min HIIT', description: 'Bodyweight circuit and recovery', minutes: 20, difficulty: 'Hard' },
    { title: '25 min HIIT', description: 'Short explosive interval set', minutes: 25, difficulty: 'Hard' },
  ],
  4: [
    { title: '40 min strength training', description: 'Upper/lower split', minutes: 40, difficulty: 'Medium' },
    { title: '30 min kettlebell workout', description: 'Functional full-body routine', minutes: 30, difficulty: 'Medium' },
  ],
  5: [
    { title: '35 min cycling', description: 'Outdoor endurance ride', minutes: 35, difficulty: 'Medium' },
    { title: '30 min brisk walk + jog', description: 'Mixed intensity cardio', minutes: 30, difficulty: 'Easy' },
  ],
  6: [
    { title: '25 min mobility reset', description: 'Posture and recovery routine', minutes: 25, difficulty: 'Easy' },
    { title: '30 min stretching session', description: 'Deep flexibility session', minutes: 30, difficulty: 'Easy' },
  ],
}

const PRODUCTIVITY_ROTATION = {
  0: [
    { title: 'Light review and reset', description: 'Plan meals, prep week, clear inbox', slot: ['10:00', '10:40'], difficulty: 'Easy' },
    { title: 'Weekly reflection', description: 'Review wins and adjust next week goals', slot: ['19:00', '19:30'], difficulty: 'Easy' },
  ],
  1: [
    { title: 'Deep work: Weekly project planning', description: 'Set goals, roadmap and priorities', slot: ['09:00', '11:00'], difficulty: 'Hard' },
    { title: 'Planning + review block', description: 'Backlog grooming and sprint prep', slot: ['15:30', '16:30'], difficulty: 'Medium' },
  ],
  2: [
    { title: 'Deep work: Execution sprint', description: 'Build and deliver top-priority tasks', slot: ['09:30', '11:30'], difficulty: 'Hard' },
    { title: 'Email processing', description: 'Inbox zero and follow-ups', slot: ['14:00', '14:30'], difficulty: 'Easy' },
  ],
  3: [
    { title: 'Deep work: Research and design', description: 'Explore solutions and draft structure', slot: ['09:00', '10:45'], difficulty: 'Hard' },
    { title: 'Client sync prep', description: 'Prepare notes and action points', slot: ['16:00', '16:40'], difficulty: 'Medium' },
  ],
  4: [
    { title: 'Deep work: Implementation block', description: 'Ship key feature milestones', slot: ['09:15', '11:15'], difficulty: 'Hard' },
    { title: 'Admin + communication', description: 'Status updates and documentation', slot: ['14:30', '15:00'], difficulty: 'Easy' },
  ],
  5: [
    { title: 'Weekly wrap-up', description: 'Close loops and review deliverables', slot: ['10:00', '11:00'], difficulty: 'Medium' },
    { title: 'Learning block', description: 'Read and upskill for upcoming sprint', slot: ['17:00', '17:40'], difficulty: 'Easy' },
  ],
  6: [
    { title: 'Creative planning', description: 'Brainstorm and personal project thinking', slot: ['11:00', '11:45'], difficulty: 'Medium' },
    { title: 'Light inbox review', description: 'Low-effort communication cleanup', slot: ['18:00', '18:20'], difficulty: 'Easy' },
  ],
}

const EXERCISE_VIDEO_LINKS = [
  'https://www.youtube.com/watch?v=ml6cT4AZdqI',
  'https://www.youtube.com/watch?v=UBMk30rjy0o',
  'https://www.youtube.com/watch?v=2L2lnxIcNmo',
  'https://www.youtube.com/watch?v=v7AYKMP6rOE',
  'https://www.youtube.com/watch?v=4BOTvaRaDjI',
  'https://www.youtube.com/watch?v=inpok4MKVLM',
  'https://www.youtube.com/watch?v=UItWltVZZmE',
]

function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function toIsoOnDate(date, hhmm) {
  const [hh, mm] = hhmm.split(':').map(Number)
  const d = new Date(date)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

function formatTime(ts) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatFullDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function getTaskCategory(category) {
  return String(category || '').toLowerCase()
}

function getStatusForTask(dateObj, isCompleted) {
  const today = new Date()
  const endOfDate = new Date(dateObj)
  endOfDate.setHours(23, 59, 59, 999)
  if (isCompleted) return 'completed'
  if (endOfDate < today) return 'missed'
  return 'pending'
}

function statusStyle(status) {
  if (status === 'completed') return 'border-[#22c55e]/45 bg-[#22c55e]/14'
  if (status === 'missed') return 'border-[#ef4444]/45 bg-[#ef4444]/12'
  return 'border-[#facc15]/45 bg-[#facc15]/10'
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

function pickFromRotation(pool, weekday, selector) {
  const arr = pool[weekday] || []
  if (!arr.length) return null
  return arr[selector % arr.length]
}

function pickExerciseVideoUrl(seed) {
  return EXERCISE_VIDEO_LINKS[Math.abs(seed) % EXERCISE_VIDEO_LINKS.length]
}

function generateMonthTasks(cursorDate, userProfile, riskScores, refreshSeed) {
  const y = cursorDate.getFullYear()
  const m = cursorDate.getMonth()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const tasksByDate = {}

  const riskBias = Math.round((Number(riskScores?.overall_risk || 0) / 10) || 0)
  const profileBias = String(userProfile?.activity_level || 'moderate').length

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateObj = new Date(y, m, day)
    const key = localDateKey(dateObj)
    const weekday = dateObj.getDay()
    const weekIndex = Math.floor((day - 1) / 7)
    const selector = (refreshSeed + weekIndex + day + riskBias + profileBias) % 7

    const diet = pickFromRotation(DIET_ROTATION, weekday, selector)
    const exercise = pickFromRotation(EXERCISE_ROTATION, weekday, selector + 1)
    const productivity = pickFromRotation(PRODUCTIVITY_ROTATION, weekday, selector + 2)

    const exerciseStart = weekday === 0 ? '07:30' : '18:00'
    const exerciseEndMinute = weekday === 0 ? 30 : (exercise?.minutes || 30)

    const dietTask = {
      id: `${key}-diet`,
      category: 'diet',
      title: weekday === 0 ? 'Recovery meal plan' : 'Meal plan',
      description: diet ? diet.meals : 'Balanced nutrition day',
      difficulty: diet?.difficulty || 'Easy',
      calories: diet?.calories || 1750,
      start_time: toIsoOnDate(dateObj, '08:30'),
      end_time: toIsoOnDate(dateObj, '09:00'),
    }

    const exerciseTask = {
      id: `${key}-exercise`,
      category: 'exercise',
      title: exercise?.title || '30 min walk',
      description: exercise?.description || 'General movement session',
      difficulty: exercise?.difficulty || 'Easy',
      duration_minutes: exercise?.minutes || 30,
      start_time: toIsoOnDate(dateObj, exerciseStart),
      end_time: new Date(new Date(toIsoOnDate(dateObj, exerciseStart)).getTime() + exerciseEndMinute * 60000).toISOString(),
      video_url: pickExerciseVideoUrl(selector + day),
    }

    const [prodStart, prodEnd] = productivity?.slot || ['10:00', '10:45']
    const productivityTask = {
      id: `${key}-productivity`,
      category: 'productivity',
      title: productivity?.title || 'Focused work block',
      description: productivity?.description || 'Execution and communication block',
      difficulty: productivity?.difficulty || 'Medium',
      start_time: toIsoOnDate(dateObj, prodStart),
      end_time: toIsoOnDate(dateObj, prodEnd),
    }

    const dayTasks = [dietTask, exerciseTask, productivityTask]

    // Keep Sundays lighter and add focused extras on selected weekdays.
    if (weekday === 0) {
      dayTasks.pop() // remove productivity block on Sunday for lighter schedule
    }
    if (weekday === 1) {
      dayTasks.push({
        id: `${key}-productivity-review`,
        category: 'productivity',
        title: 'Weekly review and prioritization',
        description: 'Align roadmap, blockers and top outcomes for the week',
        difficulty: 'Medium',
        start_time: toIsoOnDate(dateObj, '16:30'),
        end_time: toIsoOnDate(dateObj, '17:00'),
      })
    }
    if (weekday === 4 && selector % 2 === 0) {
      dayTasks.push({
        id: `${key}-exercise-mobility-extra`,
        category: 'exercise',
        title: '15 min desk mobility reset',
        description: 'Neck, shoulders and hip opening routine',
        difficulty: 'Easy',
        duration_minutes: 15,
        start_time: toIsoOnDate(dateObj, '13:00'),
        end_time: toIsoOnDate(dateObj, '13:15'),
        video_url: pickExerciseVideoUrl(selector + day + 99),
      })
    }

    tasksByDate[key] = dayTasks
  }

  return tasksByDate
}

function getWeekStart(dateObj) {
  const d = new Date(dateObj)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekKeys(anchorDate) {
  const start = getWeekStart(anchorDate)
  const keys = []
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    keys.push(localDateKey(d))
  }
  return keys
}

export default function ProductivityPlanner({ user, userProfile, riskScores }) {
  const [tasksByDate, setTasksByDate] = useState({})
  const [cursor, setCursor] = useState(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState('')
  const [completionMap, setCompletionMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshSeed, setRefreshSeed] = useState(1)

  const monthKey = useMemo(() => monthKeyFromDate(cursor), [cursor])
  const uiMode = riskScores?.overall_risk > 65 ? 'calm' : (riskScores?.overall_risk < 35 ? 'focus' : 'balanced')
  const skin = useMemo(() => modeStyles(uiMode), [uiMode])

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

  const completedStorageKey = useMemo(() => `planner-completed-${user?.uid || 'anon'}-${monthKey}`, [monthKey, user?.uid])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(completedStorageKey)
      setCompletionMap(raw ? JSON.parse(raw) : {})
    } catch {
      setCompletionMap({})
    }
  }, [completedStorageKey])

  useEffect(() => {
    try {
      localStorage.setItem(completedStorageKey, JSON.stringify(completionMap))
    } catch {}
  }, [completionMap, completedStorageKey])

  const loadMonthPlan = useCallback(async (force = false) => {
    setLoading(true)
    setError('')
    try {
      const plannerDoc = user?.uid ? doc(db, 'users', user.uid, 'plannerMonths', monthKey) : null

      if (plannerDoc && !force) {
        const snap = await getDoc(plannerDoc)
        if (snap.exists()) {
          const payload = snap.data()?.payload
          if (payload?.tasksByDate) {
            setTasksByDate(payload.tasksByDate)
            setLoading(false)
            return
          }
        }
      }

      const generated = generateMonthTasks(cursor, userProfile, riskScores, refreshSeed)
      setTasksByDate(generated)

      if (plannerDoc) {
        await setDoc(
          plannerDoc,
          {
            uid: user.uid,
            month: monthKey,
            payload: {
              tasksByDate: generated,
              refreshSeed,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }
    } catch (e) {
      setError(e.message || 'Unable to build planner for this month')
    } finally {
      setLoading(false)
    }
  }, [cursor, monthKey, refreshSeed, riskScores, user?.uid, userProfile])

  useEffect(() => {
    loadMonthPlan(false)
  }, [loadMonthPlan])

  useEffect(() => {
    const today = new Date()
    if (today.getMonth() === cursor.getMonth() && today.getFullYear() === cursor.getFullYear()) {
      setSelectedDateKey(localDateKey(today))
    } else {
      setSelectedDateKey('')
    }
  }, [cursor])

  const selectedDate = useMemo(() => {
    if (!selectedDateKey) return null
    return monthMatrix.find((d) => d && localDateKey(d) === selectedDateKey) || null
  }, [monthMatrix, selectedDateKey])

  const selectedTasks = useMemo(() => tasksByDate[selectedDateKey] || [], [selectedDateKey, tasksByDate])

  const selectedDoneCount = useMemo(() => selectedTasks.filter((t) => completionMap[t.id]).length, [completionMap, selectedTasks])

  const selectedProgressPct = selectedTasks.length ? Math.round((selectedDoneCount / selectedTasks.length) * 100) : 0

  const focusDate = selectedDate || new Date()
  const weekKeys = useMemo(() => getWeekKeys(focusDate), [focusDate])

  const weeklyStats = useMemo(() => {
    let total = 0
    let done = 0
    let caloriesActual = 0
    let exerciseMinutes = 0

    for (const key of weekKeys) {
      const tasks = tasksByDate[key] || []
      total += tasks.length
      for (const task of tasks) {
        const isDone = !!completionMap[task.id]
        if (isDone) done += 1
        if (isDone && task.category === 'diet') caloriesActual += Number(task.calories || 0)
        if (isDone && task.category === 'exercise') exerciseMinutes += Number(task.duration_minutes || 0)
      }
    }

    return {
      done,
      total,
      caloriesTarget: 14000,
      caloriesActual,
      exerciseMinutes,
    }
  }, [completionMap, tasksByDate, weekKeys])

  const streakStats = useMemo(() => {
    const dates = Object.keys(tasksByDate).sort()
    let current = 0
    let best = 0

    for (const key of dates) {
      const tasks = tasksByDate[key] || []
      const allDone = tasks.length > 0 && tasks.every((t) => completionMap[t.id])
      if (allDone) {
        current += 1
        if (current > best) best = current
      } else {
        current = 0
      }
    }

    return { current, best }
  }, [completionMap, tasksByDate])

  const mostProductiveDay = useMemo(() => {
    let bestKey = ''
    let bestDone = -1

    for (const key of Object.keys(tasksByDate)) {
      const tasks = tasksByDate[key] || []
      const done = tasks.filter((t) => completionMap[t.id]).length
      if (done > bestDone) {
        bestDone = done
        bestKey = key
      }
    }

    if (!bestKey) return 'N/A'
    const d = new Date(`${bestKey}T00:00:00`)
    return d.toLocaleDateString(undefined, { weekday: 'long' })
  }, [completionMap, tasksByDate])

  const exerciseMonthMinutes = useMemo(() => {
    let sum = 0
    for (const key of Object.keys(tasksByDate)) {
      for (const task of tasksByDate[key]) {
        if (task.category === 'exercise' && completionMap[task.id]) {
          sum += Number(task.duration_minutes || 0)
        }
      }
    }
    return sum
  }, [completionMap, tasksByDate])

  const today = new Date()

  const toggleComplete = (taskId) => {
    setCompletionMap((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  const goToday = () => {
    const now = new Date()
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDateKey(localDateKey(now))
  }

  const refreshPlan = async () => {
    setRefreshSeed((s) => s + 1)
  }

  useEffect(() => {
    if (refreshSeed > 1) loadMonthPlan(true)
  }, [loadMonthPlan, refreshSeed])

  return (
    <div className="space-y-4 animate-fade-in">
      <div className={`relative overflow-hidden rounded-2xl border ${skin.border} bg-[rgba(255,255,255,0.02)] p-5`}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: skin.glow }} />
        <div className="relative flex flex-wrap items-center gap-3">
          <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded border ${skin.badge}`}>
            AI Productivity Planner
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-white/45">Monthly Smart Calendar</span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#f59e0b]">🔥 {streakStats.current} day streak</span>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setCursor((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))} className="h-8 w-8 rounded-lg border border-white/20 bg-white/5 text-white/75 hover:bg-white/15" aria-label="Previous month">{'<'}</button>
            <p className="min-w-[170px] text-center text-sm font-mono uppercase tracking-widest text-white/85">{MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}</p>
            <button onClick={() => setCursor((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))} className="h-8 w-8 rounded-lg border border-white/20 bg-white/5 text-white/75 hover:bg-white/15" aria-label="Next month">{'>'}</button>
            <button onClick={goToday} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/90 hover:bg-white/20">Today</button>
            <button onClick={refreshPlan} disabled={loading} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/90 hover:bg-white/20 disabled:opacity-60">{loading ? 'Generating...' : 'Refresh Plan'}</button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-xs text-[#fecaca]">{error}</div>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)]">
          <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
            {DAY_NAMES.map((day) => <div key={day} className="px-2 py-3 text-center text-[11px] font-mono uppercase tracking-widest text-white/55">{day}</div>)}
          </div>

          <div className="grid grid-cols-7 grid-rows-6">
            {monthMatrix.map((dateObj, idx) => {
              if (!dateObj) return <div key={`empty-${idx}`} className="min-h-[110px] border-b border-r border-white/5 bg-black/25" />

              const key = localDateKey(dateObj)
              const tasks = tasksByDate[key] || []
              const done = tasks.filter((t) => completionMap[t.id]).length
              const isToday = key === localDateKey(today)
              const isSelected = key === selectedDateKey
              const tooltip = tasks.map((t) => `${CATEGORY_META[t.category].icon} ${t.title}`).join(' | ')

              return (
                <button
                  key={key}
                  type="button"
                  title={tooltip}
                  onClick={() => setSelectedDateKey(key)}
                  className={`min-h-[110px] border-b border-r border-white/5 p-2 text-left transition-colors hover:bg-white/[0.04] ${isSelected ? 'bg-white/[0.05]' : ''} ${isToday ? 'ring-2 ring-inset ring-[#22c55e]' : ''}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-mono ${isToday ? 'bg-[#22c55e] text-black font-bold shadow-[0_0_12px_rgba(34,197,94,0.55)]' : 'text-white/70'}`}>
                      {dateObj.getDate()}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wide text-white/40">{tasks.length} tasks</span>
                  </div>
                  <p className="text-[9px] font-mono text-white/55">{done}/{tasks.length} completed</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-3">
          <p className="text-[11px] font-mono uppercase tracking-widest text-white/70 mb-2">Progress Dashboard</p>
          <div className="space-y-2 text-[11px] font-mono text-white/75">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">This week: {weeklyStats.done}/21 tasks completed</div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">Best streak: {streakStats.best} days</div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">Most productive day: {mostProductiveDay}</div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">Exercise this month: {exerciseMonthMinutes} min</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] px-4 py-3">
        <div className="grid grid-cols-1 gap-2 text-[11px] font-mono text-white/75 md:grid-cols-4">
          <div>Total completed this week: <span className="text-white">{weeklyStats.done}</span></div>
          <div>Calories: <span className="text-white">{weeklyStats.caloriesActual}</span> / {weeklyStats.caloriesTarget}</div>
          <div>Exercise minutes: <span className="text-white">{weeklyStats.exerciseMinutes}</span></div>
          <div>Streak: <span className="text-[#f59e0b]">🔥 {streakStats.current} days</span></div>
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0b0b0b] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-white">{formatFullDate(selectedDate)}</p>
              <button onClick={() => setSelectedDateKey('')} className="rounded-md border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/75 hover:bg-white/15">Close</button>
            </div>

            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-[10px] font-mono text-white/65">
                <span>{selectedDoneCount}/{selectedTasks.length} tasks completed today</span>
                <span>{selectedProgressPct}%</span>
              </div>
              <div className="h-2 rounded bg-white/10">
                <div className="h-2 rounded bg-[#22c55e] transition-all" style={{ width: `${selectedProgressPct}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              {selectedTasks.map((task) => {
                const category = getTaskCategory(task.category)
                const meta = CATEGORY_META[category]
                const isDone = !!completionMap[task.id]
                const status = getStatusForTask(selectedDate, isDone)

                return (
                  <div key={task.id} className={`rounded-lg border p-2 ${statusStyle(status)}`}>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleComplete(task.id)}
                        className="mt-1 h-4 w-4 accent-[#22c55e]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono text-white/80">{meta.icon} {meta.label}</span>
                          <span className="text-[10px] font-mono text-white/55">{formatTime(task.start_time)} - {formatTime(task.end_time)}</span>
                          <span className="rounded border border-white/20 px-1.5 py-0.5 text-[9px] font-mono text-white/70">{task.difficulty}</span>
                        </div>
                        <p className={`text-[12px] font-semibold text-white ${isDone ? 'line-through text-white/50' : ''}`}>{task.title}</p>
                        <p className={`text-[10px] text-white/70 ${isDone ? 'line-through text-white/45' : ''}`}>{task.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-mono text-white/60">
                          {typeof task.calories === 'number' && <span>Calories: {task.calories}</span>}
                          {typeof task.duration_minutes === 'number' && <span>Duration: {task.duration_minutes} min</span>}
                          {task.video_url && (
                            <a href={task.video_url} target="_blank" rel="noreferrer" className="underline decoration-white/45 underline-offset-2 hover:text-white" onClick={(e) => e.stopPropagation()}>
                              Open video
                            </a>
                          )}
                          <span className={`${status === 'completed' ? 'text-[#22c55e]' : status === 'missed' ? 'text-[#ef4444]' : 'text-[#facc15]'}`}>
                            {status === 'completed' ? 'Completed' : status === 'missed' ? 'Missed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
