import { useState, useMemo, useEffect, useCallback } from 'react'
import { apiUrl } from '../lib/apiBase'

// ─── Static morning protocol (no ML equivalent) ──────────────────────────────
const MORNING_PROTOCOL = {
  title: 'Morning Protocol', time: '7:00 – 8:00 AM',
  items: [
    { name: 'Overnight soaked methi seeds', qty: '2 tbsp', note: 'Reduces fasting glucose by ~14% (IJPP 2009)', conditions: ['diabetes'] },
    { name: 'Warm turmeric + lemon water',  qty: '1 glass', note: 'Anti-inflammatory kickstart',                conditions: ['all'] },
    { name: 'Akhrot (walnuts) or almonds',  qty: '5–6 nuts', note: 'Omega-3, α-linolenic acid — heart-protective', conditions: ['all'] },
    { name: 'Raw garlic cloves',            qty: '2 cloves', note: 'Allicin reduces systolic BP by ~8 mmHg',   conditions: ['hypertension', 'cvd'] },
  ],
}

const MEAL_TIMES = {
  morning: '7:00 – 8:00 AM', breakfast: '8:30 – 9:30 AM',
  lunch: '12:30 – 1:30 PM',  snack: '4:00 – 5:00 PM', dinner: '7:00 – 8:00 PM',
}
const MEAL_LABELS = {
  morning: 'Morning Protocol', breakfast: 'Breakfast',
  lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner',
}
const MEALS = ['morning', 'breakfast', 'lunch', 'snack', 'dinner']

const CONDITION_COLORS = {
  diabetes: '#C8C8C8', hypertension: '#A7A7A7', cvd: '#E5E5E5', mental: '#9E9E9E',
}

const REGIONS = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east',  label: 'East'  },
  { value: 'west',  label: 'West'  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getBMINote(userProfile) {
  if (!userProfile?.weight_kg || !userProfile?.height_cm) return null
  const bmi = userProfile.weight_kg / ((userProfile.height_cm / 100) ** 2)
  if (bmi >= 30) return { text: `BMI ${bmi.toFixed(1)} — Caloric deficit recommended. Aim for 300–500 kcal below maintenance.`, color: '#E5E5E5' }
  if (bmi >= 25) return { text: `BMI ${bmi.toFixed(1)} — Moderate calorie awareness. Focus on meal timing over strict restriction.`, color: '#A7A7A7' }
  if (bmi >= 23) return { text: `BMI ${bmi.toFixed(1)} — At South Asian metabolic risk threshold. Prioritise food quality.`, color: '#C8C8C8' }
  return null
}

function getTopConditions(riskScores) {
  if (!riskScores) return []
  return Object.entries({
    diabetes: riskScores.diabetes_risk,
    hypertension: riskScores.hypertension_risk,
    cvd: riskScores.cvd_risk,
    mental: riskScores.mental_health_index,
  }).filter(([, s]) => s >= 40).sort((a, b) => b[1] - a[1]).map(([k]) => k)
}

function filterMorningItems(items, riskScores) {
  if (!riskScores) return items.filter(i => i.conditions.includes('all'))
  return items.filter(item => {
    if (item.conditions.includes('all')) return true
    return item.conditions.some(c => {
      const score = { diabetes: riskScores.diabetes_risk, hypertension: riskScores.hypertension_risk, cvd: riskScores.cvd_risk, mental: riskScores.mental_health_index }[c]
      return score && score >= 35
    })
  })
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonItem() {
  return (
    <div className="flex items-start gap-4 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] animate-pulse">
      <div className="w-6 h-6 rounded border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-[rgba(255,255,255,0.06)] rounded w-2/3" />
        <div className="h-2.5 bg-[rgba(255,255,255,0.04)] rounded w-full" />
      </div>
      <div className="h-3 bg-[rgba(255,255,255,0.04)] rounded w-16 flex-shrink-0" />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DietPlan({ riskScores, userProfile }) {
  const [activeMeal, setActiveMeal] = useState('breakfast')

  // User preferences (persisted to localStorage)
  const [region, setRegion] = useState(() => {
    try { return localStorage.getItem('diet_region') || 'north' } catch { return 'north' }
  })
  const [isVeg, setIsVeg] = useState(() => {
    try { return localStorage.getItem('diet_veg') !== 'false' } catch { return true }
  })

  // ML plan state
  const [dietPlan, setDietPlan]       = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [lastFetchKey, setLastFetchKey] = useState(null)

  const topConditions = useMemo(() => getTopConditions(riskScores), [riskScores])
  const bmiNote       = useMemo(() => getBMINote(userProfile), [userProfile])

  // ── Persist preferences ──────────────────────────────────────────────────
  const updateRegion = (v) => {
    setRegion(v)
    try { localStorage.setItem('diet_region', v) } catch {}
  }
  const updateVeg = (v) => {
    setIsVeg(v)
    try { localStorage.setItem('diet_veg', String(v)) } catch {}
  }

  // ── Fetch ML diet plan ───────────────────────────────────────────────────
  const fetchPlan = useCallback(async (currentRegion, currentIsVeg) => {
    if (!riskScores) return
    setLoading(true)
    setError(null)
    try {
      const body = {
        risk_scores: {
          diabetes:     riskScores.diabetes_risk      ?? 0,
          hypertension: riskScores.hypertension_risk  ?? 0,
          cvd:          riskScores.cvd_risk            ?? 0,
          mental:       riskScores.mental_health_index ?? 0,
        },
        user_profile: {
          age:            userProfile?.age_range  || userProfile?.age  || 35,
          sex:            userProfile?.sex        || 'male',
          is_vegetarian:  currentIsVeg,
          region:         currentRegion,
          allergies:      [],
          weight_kg:      userProfile?.weight_kg  || null,
          height_cm:      userProfile?.height_cm  || null,
          activity_level: userProfile?.activity_level || 'sedentary',
          calorie_target: null,
        },
      }
      const res = await fetch(apiUrl('/api/diet-plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setDietPlan(data)
      setLastFetchKey(`${currentRegion}-${currentIsVeg}`)
    } catch (err) {
      console.warn('[DietPlan] API failed:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [riskScores, userProfile])

  // Auto-fetch when riskScores available or preferences change
  useEffect(() => {
    const key = `${region}-${isVeg}`
    if (riskScores && key !== lastFetchKey) {
      fetchPlan(region, isVeg)
    }
  }, [riskScores, region, isVeg, fetchPlan, lastFetchKey])

  // ── Resolve active meal data ─────────────────────────────────────────────
  const isMorning     = activeMeal === 'morning'
  const apiMealData   = !isMorning ? dietPlan?.meals?.[activeMeal] : null
  const usingML       = !!apiMealData
  const dailySummary  = dietPlan?.daily_summary
  const calTarget     = dietPlan?.user_profile?.calorie_target

  const displayItems = useMemo(() => {
    if (isMorning) return filterMorningItems(MORNING_PROTOCOL.items, riskScores)
    if (usingML)   return apiMealData.items
    return []
  }, [activeMeal, isMorning, usingML, apiMealData, riskScores])

  const avoidsToShow = useMemo(
    () => dietPlan?.foods_to_avoid?.slice(0, 8) || [],
    [dietPlan]
  )
  const addMore      = dietPlan?.foods_to_add_more || []
  const gaps         = dietPlan?.nutrient_gaps || []

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="glass-card p-5 border-l-2 border-accent-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/10 blur-[60px] pointer-events-none rounded-full" />
        <div className="flex items-start justify-between relative z-10 flex-wrap gap-3">
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] font-medium text-text-primary mb-1">
              IndianPlate AI · ICMR Thali Planner
            </p>
            <p className="text-[11px] text-text-muted tracking-widest uppercase font-mono">
              {dietPlan
                ? `${calTarget || 2000} kcal target · KNN + KMeans ML · ${region} cuisine`
                : riskScores ? 'Generating personalised plan…' : 'Complete assessment to generate plan'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {loading && (
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted/60 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-ping" />
                ML running…
              </span>
            )}
            {dietPlan && !loading && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border tracking-widest text-accent-500 bg-accent-500/10 border-accent-500/25">
                AI PLAN READY
              </span>
            )}
            {topConditions.map(c => (
              <span key={c} className="text-[11px] px-2 py-0.5 rounded font-mono tracking-widest uppercase"
                style={{ color: CONDITION_COLORS[c], background: `${CONDITION_COLORS[c]}15`, border: `1px solid ${CONDITION_COLORS[c]}25` }}>
                {c === 'mental' ? 'Cognitive' : c.charAt(0).toUpperCase() + c.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Preferences picker ──────────────────────────────────────────────── */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted mb-2">Your Region</p>
          <div className="flex gap-1.5">
            {REGIONS.map(r => (
              <button key={r.value} onClick={() => updateRegion(r.value)}
                className={`text-[11px] font-mono px-3 py-1 rounded-lg border transition-all ${
                  region === r.value
                    ? 'bg-accent-500/15 border-accent-500/40 text-accent-500'
                    : 'border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(255,255,255,0.2)] hover:text-text-primary'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-[rgba(255,255,255,0.06)] hidden md:block" />

        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted mb-2">Diet Type</p>
          <div className="flex gap-1.5">
            {[{ value: true, label: 'Vegetarian' }, { value: false, label: 'Non-Veg' }].map(opt => (
              <button key={String(opt.value)} onClick={() => updateVeg(opt.value)}
                className={`text-[11px] font-mono px-3 py-1 rounded-lg border transition-all ${
                  isVeg === opt.value
                    ? 'bg-accent-500/15 border-accent-500/40 text-accent-500'
                    : 'border-[rgba(255,255,255,0.08)] text-text-muted hover:border-[rgba(255,255,255,0.2)] hover:text-text-primary'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh button */}
        {riskScores && (
          <>
            <div className="w-px h-8 bg-[rgba(255,255,255,0.06)] hidden md:block" />
            <button onClick={() => { setLastFetchKey(null); fetchPlan(region, isVeg) }}
              disabled={loading}
              className="text-[11px] font-mono px-3 py-1 rounded-lg border border-[rgba(255,255,255,0.08)] text-text-muted hover:border-accent-500/40 hover:text-accent-500 transition-all disabled:opacity-40 flex items-center gap-2">
              {loading
                ? <span className="w-3 h-3 border border-accent-500/50 border-t-accent-500 rounded-full animate-spin" />
                : '↻'}
              Regenerate
            </button>
          </>
        )}

        {/* No assessment warning */}
        {!riskScores && (
          <p className="text-[11px] text-text-muted/50 font-mono ml-auto">
            Complete assessment first to generate your ML plan
          </p>
        )}
      </div>

      {/* ── Daily nutrient bar ──────────────────────────────────────────────── */}
      {dailySummary && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Calories',  val: `${Math.round(dailySummary.total_kcal)} kcal`,    hi: false },
            { label: 'Protein',   val: `${dailySummary.protein_g}g`,                      hi: false },
            { label: 'Fiber',     val: `${dailySummary.fiber_g}g`,                        hi: dailySummary.fiber_g >= 25 },
            { label: 'Sodium',    val: `${Math.round(dailySummary.sodium_mg)}mg`,          hi: false },
            { label: 'Potassium', val: `${Math.round(dailySummary.potassium_mg || 0)}mg`, hi: false },
            { label: 'Omega-3',   val: `${dailySummary.omega3_g}g`,                       hi: dailySummary.omega3_g >= 1 },
          ].map(({ label, val, hi }) => (
            <div key={label} className={`glass-card p-3 text-center border transition-all ${hi ? 'border-accent-500/25 bg-accent-500/5' : 'border-[rgba(255,255,255,0.05)]'}`}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">{label}</p>
              <p className={`text-xs font-medium ${hi ? 'text-accent-500' : 'text-text-primary'}`}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* BMI note */}
      {bmiNote && (
        <div className="glass-card p-4 border-l-2" style={{ borderColor: bmiNote.color, background: `${bmiNote.color}05` }}>
          <p className="text-[12px] text-text-muted leading-relaxed">
            <strong className="text-text-primary">Portion guidance:</strong> {bmiNote.text}
          </p>
        </div>
      )}

      {/* ── Meal tabs ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {MEALS.map(m => {
          const mealData = m !== 'morning' ? dietPlan?.meals?.[m] : null
          return (
            <button key={m} onClick={() => setActiveMeal(m)}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeMeal === m
                  ? 'bg-accent-500/10 border-accent-500/30 text-accent-500'
                  : 'glass-card border-[rgba(255,255,255,0.06)] text-text-muted hover:text-text-primary hover:border-[rgba(255,255,255,0.15)]'
              }`}>
              <p className="text-[11px] font-mono uppercase tracking-widest mb-1">{MEAL_TIMES[m]}</p>
              <p className="text-xs font-medium tracking-wide">{MEAL_LABELS[m]}</p>
              {mealData && (
                <p className="text-[10px] font-mono text-accent-500/70 mt-1">{Math.round(mealData.total_kcal)} kcal</p>
              )}
              {!mealData && loading && m !== 'morning' && (
                <p className="text-[10px] font-mono text-text-muted/30 mt-1 animate-pulse">loading…</p>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Meal detail ─────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-3">
        {/* Meal header */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-[11px] font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20 tracking-widest">
            {MEAL_TIMES[activeMeal]}
          </span>
          <h3 className="text-sm font-medium text-text-primary tracking-wide">{MEAL_LABELS[activeMeal]}</h3>
          {usingML && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-accent-500/20 text-accent-500/70">
              ML · {Math.round(apiMealData.total_kcal)} kcal
            </span>
          )}
          {usingML && apiMealData?.items?.[0]?.scoring_method && (
            <span className="ml-auto text-[10px] font-mono text-text-muted/40 uppercase tracking-widest">
              {apiMealData.items[0].scoring_method}
            </span>
          )}
          {isMorning && (
            <span className="ml-auto text-[10px] font-mono text-text-muted/40 uppercase tracking-widest">
              Pre-meal protocol
            </span>
          )}
        </div>

        {/* Meal AI summary */}
        {usingML && apiMealData?.meal_summary && (
          <p className="text-[11px] text-accent-500/80 font-mono tracking-wide mb-3 pl-1 border-l border-accent-500/30">
            {apiMealData.meal_summary}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && !isMorning && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonItem key={i} />)}
          </div>
        )}

        {/* Error state */}
        {error && !loading && !isMorning && (
          <div className="p-4 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)]">
            <p className="text-[12px] text-[#ef4444]/80 font-mono">
              ⚠ ML API unavailable — {error}
            </p>
            <p className="text-[11px] text-text-muted/50 mt-1 font-mono">
              Make sure the backend is running on port 8000.
            </p>
          </div>
        )}

        {/* No risk scores */}
        {!riskScores && !isMorning && (
          <div className="p-6 text-center">
            <p className="text-[13px] text-text-muted/60 font-mono">Complete the assessment first</p>
            <p className="text-[11px] text-text-muted/30 mt-1 font-mono">Risk scores are required to generate a personalised ML meal plan</p>
          </div>
        )}

        {/* ML / morning items */}
        {!loading && displayItems.map((item, i) => {
          const isApiItem = !isMorning
          const food  = isApiItem ? item.food  : item.name
          const qty   = isApiItem ? item.kitchen_unit : item.qty
          const note  = isApiItem ? item.reason       : item.note
          const kcal  = isApiItem ? item.kcal         : null
          const prot  = isApiItem ? item.protein_g    : null
          const fib   = isApiItem ? item.fiber_g      : null
          const ml    = isApiItem ? item.ml_score     : null
          const rule  = isApiItem ? item.rule_score   : null

          return (
            <div key={i}
              className="flex items-start gap-4 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-colors">
              <div className="w-6 h-6 rounded border border-[rgba(255,255,255,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[11px] font-mono text-text-muted">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <p className="text-xs text-text-primary tracking-wide font-medium">{food}</p>
                  <span className="text-[11px] font-mono text-accent-500 flex-shrink-0">{qty}</span>
                </div>
                <p className="text-[11px] text-text-muted tracking-wide leading-relaxed">{note}</p>
                {/* ML score + macros bar */}
                {isApiItem && (kcal || ml != null) && (
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {kcal   != null && <span className="text-[10px] font-mono text-text-muted/40">{kcal} kcal</span>}
                    {prot   != null && <span className="text-[10px] font-mono text-text-muted/40">{prot}g protein</span>}
                    {fib    != null && fib > 0 && <span className="text-[10px] font-mono text-text-muted/40">{fib}g fiber</span>}
                    {ml     != null && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-accent-500/50">
                        <span className="w-12 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                          <span className="h-full block rounded-full bg-accent-500/60" style={{ width: `${Math.round(ml * 100)}%` }} />
                        </span>
                        ML {Math.round(ml * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Prioritise + Avoid (side by side) ─────────────────────────────── */}
      {(addMore.length > 0 || avoidsToShow.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addMore.length > 0 && (
            <div className="glass-card p-5 border-l-2 border-[rgba(34,197,94,0.55)] bg-[rgba(34,197,94,0.05)]">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#22c55e] mb-3">Prioritise These Foods</p>
              <div className="space-y-2">
                {addMore.slice(0, 5).map((r, i) => (
                  <p key={i} className="text-[11px] text-[rgba(220,252,231,0.95)] tracking-wide flex gap-2">
                    <span className="text-[#22c55e] flex-shrink-0">+</span>{r}
                  </p>
                ))}
              </div>
            </div>
          )}

          {avoidsToShow.length > 0 && (
            <div className="glass-card p-5 border-l-2 border-[rgba(239,68,68,0.55)] bg-[rgba(239,68,68,0.05)]">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#ef4444] mb-3">Avoid These Foods</p>
              <div className="space-y-2">
                {avoidsToShow.slice(0, 6).map((f, i) => (
                  <p key={i} className="text-[11px] text-[rgba(254,226,226,0.95)] tracking-wide flex gap-2">
                    <span className="text-[#ef4444] flex-shrink-0">-</span>{f}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Nutrient gaps ───────────────────────────────────────────────────── */}
      {gaps.length > 0 && (
        <div className="glass-card p-5 border-l-2 border-[rgba(251,191,36,0.4)]">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[rgba(251,191,36,0.7)] mb-3">Nutrient Gaps to Address</p>
          <div className="space-y-2">
            {gaps.map((g, i) => (
              <p key={i} className="text-[11px] text-text-muted tracking-wide flex gap-2">
                <span className="text-[rgba(251,191,36,0.5)] flex-shrink-0">⚠</span>{g}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── Supplements ─────────────────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-text-muted mb-4">Evidence-Backed Supplements</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Vitamin D3',             dose: '1000–2000 IU/day', note: 'Deficient in 70% of Indians — improves insulin sensitivity', show: true },
            { name: 'Magnesium Glycinate',     dose: '200–400 mg/day',   note: 'Reduces BP, improves sleep quality and insulin action',       show: (riskScores?.hypertension_risk > 40 || riskScores?.diabetes_risk > 40) },
            { name: 'Omega-3 (fish/algae oil)', dose: '1g EPA+DHA/day',   note: 'Reduces TG by 20–30%, lowers cardiovascular risk',            show: riskScores?.cvd_risk > 40 },
            { name: 'Ashwagandha (KSM-66)',    dose: '300–600 mg/day',   note: 'Cortisol ↓ 28%, anxiety ↓ 40% (Chandrasekhar 2012)',          show: riskScores?.mental_health_index > 40 || !riskScores },
          ].filter(s => s.show !== false).map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-xs text-text-primary font-medium">{s.name}</p>
                <span className="text-[11px] font-mono text-accent-500">{s.dose}</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">{s.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ICMR + disclaimer ───────────────────────────────────────────────── */}
      {dietPlan?.icmr_compliance_note && (
        <div className="glass-card p-4 border border-[rgba(255,255,255,0.04)]">
          <p className="text-[10px] text-text-muted/40 font-mono tracking-wide leading-relaxed">{dietPlan.icmr_compliance_note}</p>
        </div>
      )}
      <div className="pt-1 text-center">
        <p className="text-[11px] text-text-muted/40 font-mono uppercase tracking-widest">
          {dietPlan?.medical_disclaimer || 'Dietary guidance only. Consult a registered dietitian for clinical nutrition therapy.'}
        </p>
      </div>
    </div>
  )
}
