import { useState } from 'react'

const BASE_PLAN = {
  morning: {
    title: 'Morning Protocol',
    time: '7:00 – 9:00 AM',
    items: [
      { name: 'Overnight soaked methi seeds', qty: '2 tbsp', note: 'Reduces fasting glucose (IJPP 2009)' },
      { name: 'Warm turmeric lemon water', qty: '1 glass', note: 'Anti-inflammatory start' },
      { name: 'Handful of akhrot or almonds', qty: '5–6 nuts', note: 'Omega-3, healthy fats' },
    ],
  },
  breakfast: {
    title: 'Breakfast',
    time: '8:30 – 9:30 AM',
    items: [
      { name: 'Ragi mudde or jowar roti', qty: '2 pieces', note: 'Low GI millet — ICMR 2024' },
      { name: 'Moong dal chilla / egg whites', qty: '2–3 pieces', note: '20g protein, satiety' },
      { name: 'Mixed sabzi (spinach + tomato)', qty: '1 cup', note: 'Folate, potassium, BP control' },
    ],
  },
  lunch: {
    title: 'Lunch',
    time: '12:30 – 1:30 PM',
    items: [
      { name: 'Rajma or chana (any legume)', qty: '1 cup cooked', note: '25g fiber/day → 18% lower T2D risk' },
      { name: 'Brown rice or bajra roti', qty: '1 cup / 2 rotis', note: 'Whole grain, lower glycemic load' },
      { name: 'Curd (low-fat)', qty: '1 bowl', note: 'Probiotics, calcium, BP reduction' },
      { name: 'Raw salad (cucumber, carrot)', qty: 'Unlimited', note: 'Volume eating, micronutrients' },
    ],
  },
  snack: {
    title: 'Afternoon Snack',
    time: '4:00 – 5:00 PM',
    items: [
      { name: 'Green tea (unsweetened)', qty: '1 cup', note: 'Catechins reduce LDL by 5–10%' },
      { name: 'Fox nuts (makhana) or puffed rajgira', qty: '1 handful', note: 'Low cal, magnesium-rich' },
    ],
  },
  dinner: {
    title: 'Dinner',
    time: '7:00 – 8:00 PM',
    items: [
      { name: 'Khichdi (moong dal + millet)', qty: '1 bowl', note: 'Easy digest, complete amino acids' },
      { name: 'Stir-fried palak or methi sabzi', qty: '1 cup', note: 'Iron, folate, low sodium' },
      { name: 'Haldi doodh (turmeric milk)', qty: '1 glass', note: 'Curcumin → CRP ↓9%, sleep aid' },
    ],
  },
}

const DIABETES_EXTRAS = [
  'Replace white rice with red rice or foxtail millet (kangni).',
  'Eat in this order: fibre → protein → carbs to flatten the glucose curve.',
  'No fruit juice — eat whole fruit only. Limit banana and mango.',
  'Include bitter gourd (karela) juice 100ml, 3x/week.',
]

const HYPERTENSION_EXTRAS = [
  'Limit salt to 5g/day — use rock salt or sendha namak instead of table salt.',
  'Increase potassium: 1 banana OR 1 cup coconut water daily.',
  'Avoid pickles, papad, processed snacks — all hidden sodium sources.',
  'Garlic (2 raw cloves/day) shown to reduce systolic BP by 8 mmHg.',
]

const CVD_EXTRAS = [
  'Use mustard oil or groundnut oil (cold-pressed) — avoid refined oils.',
  'Include 1 tbsp flaxseed (alsi) powder daily in roti or dal.',
  'Limit red meat to once per week maximum — prefer fish, eggs, dal.',
  'Dark chocolate (>70% cocoa) 1 square daily — flavonoids protect endothelium.',
]

const MEALS = ['morning', 'breakfast', 'lunch', 'snack', 'dinner']

function MealCard({ meal, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all ${
        isActive
          ? 'bg-accent-500/10 border-accent-500/30 text-accent-500'
          : 'glass-card border-[rgba(255,255,255,0.06)] text-text-muted hover:text-text-primary hover:border-[rgba(255,255,255,0.15)]'
      }`}
    >
      <p className="text-[9px] font-mono uppercase tracking-widest mb-1">{meal.time}</p>
      <p className="text-xs font-medium tracking-wide">{meal.title}</p>
    </button>
  )
}

export default function DietPlan({ riskScores }) {
  const [activeMeal, setActiveMeal] = useState('breakfast')

  const extras = []
  if (riskScores?.diabetes_risk > 40) extras.push(...DIABETES_EXTRAS)
  if (riskScores?.hypertension_risk > 40) extras.push(...HYPERTENSION_EXTRAS)
  if (riskScores?.cvd_risk > 40) extras.push(...CVD_EXTRAS)

  const meal = BASE_PLAN[activeMeal]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-5 border-l-2 border-accent-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/10 blur-[60px] pointer-events-none rounded-full" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] font-medium text-text-primary mb-1">Nutritional Protocol</p>
            <p className="text-[10px] text-text-muted tracking-widest uppercase font-mono">ICMR Plate · India-Specific · Risk-Adjusted</p>
          </div>
          {riskScores && (
            <div className="flex gap-2 flex-wrap justify-end">
              {riskScores.diabetes_risk > 40 && (
                <span className="text-[9px] px-2 py-0.5 rounded font-mono tracking-widest uppercase text-[#f59e0b] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)]">Metabolic</span>
              )}
              {riskScores.hypertension_risk > 40 && (
                <span className="text-[9px] px-2 py-0.5 rounded font-mono tracking-widest uppercase text-[#f97316] bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">Vascular</span>
              )}
              {riskScores.cvd_risk > 40 && (
                <span className="text-[9px] px-2 py-0.5 rounded font-mono tracking-widest uppercase text-accent-500 bg-accent-500/10 border border-accent-500/20">Cardiac</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meal tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {MEALS.map((m) => (
          <MealCard
            key={m}
            meal={BASE_PLAN[m]}
            isActive={activeMeal === m}
            onClick={() => setActiveMeal(m)}
          />
        ))}
      </div>

      {/* Meal detail */}
      <div className="glass-card p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20 tracking-widest uppercase">{meal.time}</span>
          <h3 className="text-sm font-medium text-text-primary tracking-wide">{meal.title}</h3>
        </div>
        {meal.items.map((item, i) => (
          <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-colors">
            <div className="w-6 h-6 rounded border border-[rgba(255,255,255,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-mono text-text-muted">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <p className="text-xs text-text-primary tracking-wide">{item.name}</p>
                <span className="text-[10px] font-mono text-accent-500 flex-shrink-0">{item.qty}</span>
              </div>
              <p className="text-[10px] text-text-muted tracking-wide">{item.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Condition-specific extras */}
      {extras.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">!</span>
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-[0.2em]">Risk-Specific Adjustments</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {extras.slice(0, 6).map((e, i) => (
              <div key={i} className="glass-card p-4 border-l-2 border-[rgba(255,255,255,0.15)] hover:border-accent-500/40 transition-colors">
                <p className="text-[11px] text-text-muted leading-relaxed tracking-wide">{e}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foods to avoid */}
      <div className="glass-card p-5 bg-[rgba(255,59,48,0.02)] border-l-2 border-accent-500/30">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-500 mb-3">Limit or Avoid</p>
        <div className="flex flex-wrap gap-2">
          {['Maida / White flour', 'Refined sugar', 'Packaged snacks', 'Fried foods', 'Sweetened drinks', 'Margarine / Dalda', 'Excess salt'].map((f) => (
            <span key={f} className="text-[10px] px-3 py-1 rounded border border-accent-500/20 text-text-muted font-mono tracking-wide">
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 text-center">
        <p className="text-[9px] text-text-muted/60 font-mono uppercase tracking-widest">
          DIETARY GUIDANCE ONLY. CONSULT A REGISTERED DIETITIAN FOR PERSONALISED MEDICAL NUTRITION THERAPY.
        </p>
      </div>
    </div>
  )
}
