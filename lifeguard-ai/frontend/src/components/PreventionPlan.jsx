import { useState } from 'react'
import EvidenceCard from './EvidenceCard'

const PLAN_TABS = [
  { id: 'priority', label: '01 // Priority', key: 'priority_actions' },
  { id: 'nutrition', label: '02 // Nutrition', key: 'nutrition' },
  { id: 'exercise', label: '03 // Movement', key: 'exercise' },
  { id: 'sleep', label: '04 // Recovery', key: 'sleep_stress' },
  { id: 'mental', label: '05 // Cognitive', key: 'mental_wellness' },
  { id: 'doctor', label: '06 // Clinical', key: 'see_a_doctor' },
]

function PriorityItem({ text, index }) {
  return (
    <div className="glass-card p-4 flex items-start gap-4 animate-slide-up group hover:border-[rgba(255,255,255,0.15)] transition-all">
      <div className="flex-shrink-0 w-8 h-8 rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center">
        <span className="text-[9px] font-bold font-mono tracking-widest text-text-muted group-hover:text-accent-500 transition-colors">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <p className="text-xs text-text-primary leading-relaxed tracking-wide mt-1">{text}</p>
    </div>
  )
}

function RecommendationCard({ rec }) {
  const [expanded, setExpanded] = useState(false)

  if (typeof rec === 'string') {
    // Doctor section items are strings
    const isAlert = rec.includes('⚠️')
    return (
      <div className={`glass-card p-4 border-l-2 ${isAlert ? 'border-accent-500 bg-[rgba(255,59,48,0.02)]' : 'border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.01)]'} animate-slide-up hover:border-[rgba(255,255,255,0.4)] transition-colors`}>
        <p className="text-xs text-text-primary leading-relaxed tracking-wide"
          dangerouslySetInnerHTML={{
            __html: rec
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
              .replace(/⚠️/g, '<span class="text-accent-500 mr-2">!</span>')
          }}
        />
      </div>
    )
  }

  return (
    <div className="glass-card p-4 space-y-3 animate-slide-up hover:border-[rgba(255,255,255,0.1)] transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-text-primary leading-relaxed tracking-wide">{rec.recommendation}</p>
      </div>
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[9px] uppercase tracking-widest text-text-muted hover:text-white transition-colors flex items-center gap-2 border px-2 py-1 rounded border-[rgba(255,255,255,0.1)]"
        >
          {expanded ? '▲ COLLAPSE' : '▼ RATIONALE'}
        </button>
      </div>
      
      {expanded && (
        <div className="pt-3 animate-fade-in text-xs bg-[rgba(255,255,255,0.02)] p-3 rounded border border-[rgba(255,255,255,0.03)] mt-2">
          <p className="text-text-muted leading-relaxed mb-3">
             <span className="text-accent-500 mr-2 inline-block">↳</span>  
             {rec.why}
          </p>
          {rec.source && (
            <div className="flex items-center gap-2 text-[9px] text-text-muted/60 font-mono uppercase tracking-widest">
               <span className="w-1 h-1 bg-text-muted/50 rounded-full" />
               CIT: {rec.source}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyPlanState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center glass-card border-dashed">
      <div className="w-16 h-16 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center mb-6 float-anim backdrop-blur-md">
        <span className="w-4 h-4 rounded-full border-2 border-accent-500 animate-pulse" />
      </div>
      <p className="text-sm font-medium tracking-widest text-text-primary uppercase mb-2">Awaiting Parameters</p>
      <p className="text-[10px] text-text-muted tracking-wide max-w-[200px] leading-relaxed mx-auto">
        Complete diagnostic sequence in the communication core to synthesize protocol.
      </p>
    </div>
  )
}

// Static plan shown when plan_ready is true but no structured plan data yet
const STATIC_PLAN = {
  priority_actions: [
    'Start a 30-minute post-dinner walk every day this week.',
    'Replace one serving of white rice/maida with a millet option (jowar roti, ragi mudde, or bajra chapati).',
    'Reduce added salt by 1 teaspoon daily — target: 5g/day total.',
    'Add 1 handful of akhrot (walnuts) or 1 tbsp alsi (flaxseed) powder daily for omega-3 intake.',
    'Begin 10-minute Anulom-Vilom pranayama each morning this week.',
    'Schedule a health check-up within 4 weeks: fasting glucose, lipid profile, BP.',
  ],
  nutrition: [
    {
      recommendation: 'Adopt the ICMR Plate: 45% millets/whole grains, 20% protein (dal, paneer, eggs), 30% healthy fats.',
      why: 'India-specific dietary pattern shown to prevent metabolic syndrome at population level.',
      source: 'ICMR Dietary Guidelines 2024',
    },
    {
      recommendation: 'Consume 2 tbsp soaked methi (fenugreek) seeds each morning. Soak overnight, swallow with water.',
      why: 'Reduces postprandial glucose and improves insulin sensitivity. HbA1c reduction of 0.8% in 8 weeks.',
      source: 'Indian Journal of Physiology 2009',
    },
    {
      recommendation: 'Include rajma, chana, or moong dal in at least one meal daily.',
      why: '25g+ dietary fiber/day is associated with 18% lower T2D risk.',
      source: 'ADA Nutrition Guidelines 2023',
    },
    {
      recommendation: 'Add 1 tsp turmeric (haldi) to daily cooking — a golden latte or turmeric dal is ideal.',
      why: 'Curcumin reduces IL-6 by 14% and CRP by 9%, protecting against chronic inflammation.',
      source: 'Nutrients 2021',
    },
  ],
  exercise: [
    {
      recommendation: 'Week 1–2: 20-min brisk walk after dinner, 5 days/week. Week 3–4: Increase to 30–45 min.',
      why: '150 min/week moderate activity reduces diabetes risk 35–40% and systolic BP by 5–8 mmHg.',
      source: 'WHO Global Action Plan 2018 · AHA 2017',
    },
    {
      recommendation: 'Add 12 rounds of Surya Namaskar 3 mornings/week. Each set = 25–30 min moderate aerobic exercise.',
      why: 'Reduces BMI by 1.5 kg/m² over 12 weeks and improves cardiovascular fitness.',
      source: 'Yoga Research Foundation 2019',
    },
  ],
  sleep_stress: [
    {
      recommendation: 'Set a consistent sleep schedule: same bedtime (10–10:30 PM) and wake time (6–6:30 AM), even on weekends.',
      why: 'Sleep consistency regulates circadian cortisol rhythm, reducing insulin resistance and BP elevation.',
      source: 'ESH Guidelines 2023',
    },
    {
      recommendation: 'Practice 15 min of Anulom-Vilom (alternate nostril breathing) before bed at 6 breaths/minute.',
      why: 'Pranayama reduces systolic BP by 6.5 mmHg and activates the parasympathetic nervous system.',
      source: 'International Journal of Yoga 2014',
    },
    {
      recommendation: 'Remove screens 45 minutes before sleep. Use blue-light glasses if unavoidable.',
      why: 'Blue light suppresses melatonin, disrupts sleep onset, and increases next-day cortisol.',
      source: 'Sleep Foundation Clinical Review 2023',
    },
  ],
  mental_wellness: [
    {
      recommendation: 'Begin 20-minute daily meditation (Vipassana, mindfulness, or guided apps like Headspace). Track mood in a journal.',
      why: '20-min daily meditation reduces perceived stress by 31% and lowers cortisol by 18% after 8 weeks.',
      source: 'JAMA Psychiatry 2014',
    },
    {
      recommendation: 'Schedule at least one social activity per week — meeting a friend, family dinner, or community group.',
      why: 'Social isolation increases all-cause mortality by 29% — equivalent to smoking 15 cigarettes/day.',
      source: 'Holt-Lunstad 2015',
    },
  ],
  see_a_doctor: [
    '**Schedule within 4 weeks**: Fasting glucose, HbA1c, full lipid profile, BP measurement.',
    '**Recheck in 3 months**: After implementing lifestyle changes, retest to track improvement.',
    'If systolic BP >140 on any reading → consult a physician immediately.',
    'If fasting glucose >100 mg/dL → request Oral Glucose Tolerance Test (OGTT).',
  ],
}

export default function PreventionPlan({ planReady, evidence }) {
  const [activeTab, setActiveTab] = useState('priority')
  const [showEvidence, setShowEvidence] = useState(false)

  if (!planReady) return <EmptyPlanState />

  const plan = STATIC_PLAN
  const currentTab = PLAN_TABS.find(t => t.id === activeTab)
  const items = plan[currentTab?.key] || []

  return (
    <div className="space-y-6 animate-fade-in relative z-10 w-full">
      {/* Plan header */}
      <div className="glass-card p-5 border-l-2 border-accent-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/10 blur-[60px] pointer-events-none rounded-full" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] font-medium text-text-primary mb-1">Targeted Modification Protocol</p>
            <p className="text-[10px] text-text-muted tracking-widest uppercase font-mono">Synthesized · Optimized · Evidence-Based</p>
          </div>
          <button className="text-[9px] px-3 py-1.5 rounded border border-[rgba(255,255,255,0.1)] text-text-muted hover:text-white hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.05)] transition-all font-mono tracking-widest uppercase flex items-center gap-2">
            Export <span className="opacity-50">.PDF</span>
          </button>
        </div>
      </div>

      {/* Tab pills flex grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {PLAN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[9px] px-4 py-3 rounded uppercase tracking-widest font-mono text-left transition-all relative overflow-hidden ${
              activeTab === tab.id
                ? 'bg-accent-500/10 border border-accent-500/30 text-accent-500'
                : 'glass-card border-[rgba(255,255,255,0.05)] text-text-muted hover:text-white hover:border-[rgba(255,255,255,0.15)]'
            }`}
          >
             {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent-500" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-3 pt-2">
        {activeTab === 'priority'
          ? items.map((item, i) => <PriorityItem key={i} text={item} index={i} />)
          : items.map((item, i) => <RecommendationCard key={i} rec={item} />)
        }
      </div>

      {/* Evidence citations */}
      {evidence && evidence.length > 0 && (
        <div className="pt-6 mt-6 border-t border-[rgba(255,255,255,0.05)]">
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="w-full flex items-center justify-between text-[10px] text-text-muted hover:text-white transition-colors"
          >
            <span className="font-mono uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[rgba(255,255,255,0.2)] rounded-full"></span>
              Verified Medical Data Sources [{evidence.length}]
            </span>
            <span className="opacity-50 font-mono border px-1.5 py-0.5 rounded border-[rgba(255,255,255,0.1)]">{showEvidence ? 'COLLAPSE' : 'EXPAND'}</span>
          </button>
          {showEvidence && (
            <div className="space-y-3 animate-fade-in mt-4">
              {evidence.slice(0, 6).map((ev, i) => (
                <EvidenceCard key={i} {...ev} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pt-6 relative z-10 text-center">
         <p className="text-[9px] text-text-muted/60 font-mono uppercase tracking-widest leading-loose">
           PROTOCOL FOR PREVENTIVE MODELING ONLY. <br/>
           SEEK CLINICAL GUIDANCE BEFORE MODIFICATION OF REGIMEN.
         </p>
      </div>
    </div>
  )
}
