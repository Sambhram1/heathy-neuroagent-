import { useState, useMemo } from 'react'

// ─── Meal database ─────────────────────────────────────────────────────────
const BASE_MEALS = {
  morning: {
    title: 'Morning Protocol', time: '7:00 – 8:00 AM',
    items: [
      { name: 'Overnight soaked methi seeds', qty: '2 tbsp', note: 'Reduces fasting glucose by ~14% (IJPP 2009)', conditions: ['diabetes'] },
      { name: 'Warm turmeric + lemon water', qty: '1 glass', note: 'Anti-inflammatory start to the day', conditions: ['all'] },
      { name: 'Akhrot (walnuts) or almonds', qty: '5–6 nuts', note: 'Omega-3, α-linolenic acid, heart-protective', conditions: ['all'] },
      { name: 'Garlic cloves (raw, swallowed)', qty: '2 cloves', note: 'Allicin reduces systolic BP by ~8 mmHg', conditions: ['hypertension', 'cvd'] },
    ],
  },
  breakfast: {
    title: 'Breakfast', time: '8:30 – 9:30 AM',
    items: [
      { name: 'Ragi mudde or jowar roti', qty: '2 pieces', note: 'Low GI millet — recommended by ICMR 2024', conditions: ['all'] },
      { name: 'Moong dal chilla / egg whites', qty: '2–3 pieces', note: '20g protein, long satiety, stable glucose', conditions: ['all'] },
      { name: 'Mixed sabzi (spinach + tomato)', qty: '1 cup', note: 'Folate, potassium, nitrates for BP', conditions: ['all'] },
      { name: 'Flaxseed (alsi) chutney / powder', qty: '1 tbsp', note: 'ALA omega-3, reduces TG by 20–25%', conditions: ['cvd', 'hypertension'] },
    ],
  },
  lunch: {
    title: 'Lunch', time: '12:30 – 1:30 PM',
    items: [
      { name: 'Rajma / chana / moong dal', qty: '1 cup cooked', note: '25g fiber/day → 18% lower T2D risk (ADA 2023)', conditions: ['all'] },
      { name: 'Brown rice or bajra roti', qty: '1 cup / 2 rotis', note: 'Whole grain, lower glycemic load than white rice', conditions: ['all'] },
      { name: 'Curd — low fat', qty: '1 bowl', note: 'Probiotics reduce CRP; calcium for BP', conditions: ['all'] },
      { name: 'Raw salad — cucumber, carrot, beetroot', qty: 'Unlimited', note: 'Nitrates in beetroot lower systolic BP 4–8 mmHg', conditions: ['all'] },
      { name: 'Karela (bitter gourd) sabzi', qty: '½ cup', note: 'Polypeptide-P mimics insulin action', conditions: ['diabetes'] },
    ],
  },
  snack: {
    title: 'Afternoon Snack', time: '4:00 – 5:00 PM',
    items: [
      { name: 'Green tea (unsweetened)', qty: '1 cup', note: 'EGCG reduces LDL by 5–10%, anti-inflammatory', conditions: ['all'] },
      { name: 'Fox nuts (makhana) or puffed rajgira', qty: '1 handful', note: 'Low calorie, magnesium-rich, satisfying', conditions: ['all'] },
      { name: 'Apple or pear (not juice)', qty: '1 medium', note: 'Pectin binds cholesterol; low GI whole fruit', conditions: ['cvd', 'diabetes'] },
    ],
  },
  dinner: {
    title: 'Dinner', time: '7:00 – 8:00 PM',
    items: [
      { name: 'Khichdi — moong dal + barnyard millet', qty: '1 bowl', note: 'Easy to digest; complete amino acid profile', conditions: ['all'] },
      { name: 'Stir-fried palak or methi sabzi', qty: '1 cup', note: 'Iron, folate, low sodium — BP-friendly', conditions: ['all'] },
      { name: 'Haldi doodh — turmeric milk', qty: '1 glass', note: 'Curcumin reduces CRP by 9%, aids sleep onset', conditions: ['all'] },
      { name: 'Psyllium husk (isabgol) in water', qty: '1 tsp', note: 'Soluble fiber lowers post-prandial glucose', conditions: ['diabetes'] },
    ],
  },
}

const CONDITION_AVOIDS = {
  diabetes: ['White rice (prefer red/brown)', 'Maida / refined flour', 'Fruit juices', 'Sweetened yogurt', 'Packaged cereals', 'Potatoes (limit)'],
  hypertension: ['Table salt (use rock salt)', 'Pickles & papad', 'Processed snacks', 'Canned foods', 'Margarine / Dalda', 'Excess coffee'],
  cvd: ['Trans fats / vanaspati', 'Red meat (limit to 1×/wk)', 'Organ meats', 'Full-fat dairy excess', 'Fried foods', 'Refined oils'],
  mental: ['Excess caffeine', 'Alcohol', 'Ultra-processed sugar', 'Skipping meals (cortisol spike)', 'Energy drinks'],
}

const CONDITION_COLORS = {
  diabetes: '#C8C8C8',
  hypertension: '#A7A7A7',
  cvd: '#E5E5E5',
  mental: '#9E9E9E',
}

const MEALS = ['morning', 'breakfast', 'lunch', 'snack', 'dinner']

function getPersonalizedItems(items, riskScores) {
  if (!riskScores) return items.filter((i) => i.conditions.includes('all'))
  return items.filter((item) => {
    if (item.conditions.includes('all')) return true
    return item.conditions.some((c) => {
      const score = { diabetes: riskScores.diabetes_risk, hypertension: riskScores.hypertension_risk, cvd: riskScores.cvd_risk, mental: riskScores.mental_health_index }[c]
      return score && score >= 35
    })
  })
}

function getBMINote(userProfile) {
  if (!userProfile) return null
  const bmi = userProfile.weight_kg / ((userProfile.height_cm / 100) ** 2)
  if (bmi >= 30) return { text: `BMI ${bmi.toFixed(1)} — Caloric deficit recommended. Aim for 300–500 kcal/day below maintenance. Prioritise protein (1.2g/kg) to preserve muscle.`, color: '#E5E5E5' }
  if (bmi >= 25) return { text: `BMI ${bmi.toFixed(1)} — Moderate calorie awareness. Focus on meal timing and fibre over strict restriction.`, color: '#A7A7A7' }
  if (bmi >= 23) return { text: `BMI ${bmi.toFixed(1)} — At South Asian metabolic risk threshold. Prioritise quality over quantity.`, color: '#C8C8C8' }
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

export default function DietPlan({ riskScores, userProfile }) {
  const [activeMeal, setActiveMeal] = useState('breakfast')

  const topConditions = useMemo(() => getTopConditions(riskScores), [riskScores])
  const bmiNote = useMemo(() => getBMINote(userProfile), [userProfile])

  const personalizedItems = useMemo(
    () => getPersonalizedItems(BASE_MEALS[activeMeal]?.items || [], riskScores),
    [activeMeal, riskScores]
  )

  const avoidsToShow = useMemo(
    () => topConditions.flatMap((c) => CONDITION_AVOIDS[c] || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10),
    [topConditions]
  )

  const meal = BASE_MEALS[activeMeal]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-5 border-l-2 border-accent-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/10 blur-[60px] pointer-events-none rounded-full" />
        <div className="flex items-center justify-between relative z-10 flex-wrap gap-3">
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] font-medium text-text-primary mb-1">Nutritional Protocol</p>
            <p className="text-[11px] text-text-muted tracking-widest uppercase font-mono">
              {riskScores ? 'Personalised for your risk profile' : 'ICMR Plate · India-Specific'}
            </p>
          </div>
          {topConditions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {topConditions.map((c) => (
                <span key={c} className="text-[11px] px-2 py-0.5 rounded font-mono tracking-widest uppercase"
                  style={{ color: CONDITION_COLORS[c], background: `${CONDITION_COLORS[c]}15`, border: `1px solid ${CONDITION_COLORS[c]}25` }}>
                  {c === 'mental' ? 'Cognitive' : c.charAt(0).toUpperCase() + c.slice(1)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BMI note */}
      {bmiNote && (
        <div className="glass-card p-4 border-l-2 animate-fade-in" style={{ borderColor: bmiNote.color, background: `${bmiNote.color}05` }}>
          <p className="text-[12px] text-text-muted leading-relaxed"><strong className="text-text-primary">Portion guidance:</strong> {bmiNote.text}</p>
        </div>
      )}

      {/* Meal tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {MEALS.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMeal(m)}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeMeal === m
                ? 'bg-accent-500/10 border-accent-500/30 text-accent-500'
                : 'glass-card border-[rgba(255,255,255,0.06)] text-text-muted hover:text-text-primary hover:border-[rgba(255,255,255,0.15)]'
            }`}
          >
            <p className="text-[11px] font-mono uppercase tracking-widest mb-1">{BASE_MEALS[m].time}</p>
            <p className="text-xs font-medium tracking-wide">{BASE_MEALS[m].title}</p>
          </button>
        ))}
      </div>

      {/* Meal detail */}
      <div className="glass-card p-6 space-y-3 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20 tracking-widest">{meal.time}</span>
          <h3 className="text-sm font-medium text-text-primary tracking-wide">{meal.title}</h3>
          {riskScores && (
            <span className="ml-auto text-[11px] font-mono text-text-muted/50 uppercase tracking-widest">
              {personalizedItems.length} items selected for you
            </span>
          )}
        </div>
        {personalizedItems.map((item, i) => (
          <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-colors">
            <div className="w-6 h-6 rounded border border-[rgba(255,255,255,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[11px] font-mono text-text-muted">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <p className="text-xs text-text-primary tracking-wide">{item.name}</p>
                <span className="text-[11px] font-mono text-accent-500 flex-shrink-0">{item.qty}</span>
              </div>
              <p className="text-[11px] text-text-muted tracking-wide">{item.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* What to avoid */}
      {avoidsToShow.length > 0 && (
        <div className="glass-card p-5 bg-[rgba(229,229,229,0.02)] border-l-2 border-accent-500/30">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent-500 mb-3">Limit or Avoid — Your Profile</p>
          <div className="flex flex-wrap gap-2">
            {avoidsToShow.map((f) => (
              <span key={f} className="text-[11px] px-3 py-1 rounded border border-accent-500/20 text-text-muted font-mono tracking-wide">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Key supplements */}
      <div className="glass-card p-5">
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-text-muted mb-4">Evidence-Backed Supplements</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Vitamin D3', dose: '1000–2000 IU/day', note: 'Deficient in 70% of Indians — improves insulin sensitivity & immunity', show: true },
            { name: 'Magnesium Glycinate', dose: '200–400 mg/day', note: 'Reduces BP, improves sleep quality and insulin action', show: (riskScores?.hypertension_risk > 40 || riskScores?.diabetes_risk > 40) },
            { name: 'Omega-3 (fish oil or algae)', dose: '1g EPA+DHA/day', note: 'Reduces TG by 20–30%, lowers cardiovascular event risk', show: riskScores?.cvd_risk > 40 },
            { name: 'Ashwagandha (KSM-66)', dose: '300–600 mg/day', note: 'Cortisol ↓ 28%, anxiety ↓ 40% (Chandrasekhar 2012)', show: riskScores?.mental_health_index > 40 || !riskScores },
          ].filter((s) => s.show !== false).map((s, i) => (
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

      <div className="pt-4 text-center">
        <p className="text-[11px] text-text-muted/60 font-mono uppercase tracking-widest">
          DIETARY GUIDANCE ONLY. CONSULT A REGISTERED DIETITIAN FOR PERSONALISED MEDICAL NUTRITION THERAPY.
        </p>
      </div>
    </div>
  )
}
