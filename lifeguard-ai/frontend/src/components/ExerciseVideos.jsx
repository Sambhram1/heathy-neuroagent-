import { useState, useMemo } from 'react'

const ALL_VIDEOS = [
  // Diabetes / metabolic
  { id: 'U9YKY7fdwyg', title: '30-Min Walk for Blood Sugar Control', channel: 'Walk at Home', duration: '30 min', level: 'Beginner', condition: 'diabetes', intensity: 1, tags: ['Low Impact', 'Glucose Control'] },
  { id: 'TbwlC2B-BIg', title: 'Yoga Asanas for Diabetes Management', channel: 'Satvic Movement', duration: '25 min', level: 'Beginner', condition: 'diabetes', intensity: 1, tags: ['Yoga', 'Insulin Sensitivity'] },
  { id: 'aXItOY0sNRU', title: 'Resistance Training for Metabolic Health', channel: 'Fitness Blender', duration: '35 min', level: 'Intermediate', condition: 'diabetes', intensity: 2, tags: ['Strength', 'Muscle Mass'] },
  { id: 'pqn-3cLWyXY', title: 'HIIT for Insulin Resistance', channel: 'Sydney Cummings', duration: '30 min', level: 'Advanced', condition: 'diabetes', intensity: 3, tags: ['HIIT', 'Fat Loss'] },

  // Hypertension / vascular
  { id: 'inpok4MKVLM', title: '4-7-8 Breathing to Lower Blood Pressure', channel: 'Meditative Mind', duration: '10 min', level: 'All Levels', condition: 'hypertension', intensity: 1, tags: ['Breathing', 'Parasympathetic'] },
  { id: 'COp7BR_Dvps', title: 'Gentle Yoga for High Blood Pressure', channel: 'Yoga With Adriene', duration: '28 min', level: 'Beginner', condition: 'hypertension', intensity: 1, tags: ['Gentle Yoga', 'BP Control'] },
  { id: 'sTANio_2E0Q', title: 'Low-Impact Aerobics for Hypertension', channel: 'Pahla B Fitness', duration: '32 min', level: 'Beginner', condition: 'hypertension', intensity: 1, tags: ['Cardio', 'Safe BP'] },
  { id: 'tybOi4hjZFQ', title: 'Strength Circuit for Heart & BP Health', channel: 'HASfit', duration: '40 min', level: 'Intermediate', condition: 'hypertension', intensity: 2, tags: ['Strength', 'Endurance'] },

  // CVD / cardiac
  { id: 'XUi7yd6Rl4A', title: 'Cardiac Rehab Phase 2 Exercise Program', channel: 'Cleveland Clinic', duration: '20 min', level: 'Supervised', condition: 'cvd', intensity: 1, tags: ['Cardiac Rehab', 'Safe'] },
  { id: '5pLcyHPqqpM', title: 'Chair Cardio for Heart Health', channel: 'HASfit', duration: '25 min', level: 'Beginner', condition: 'cvd', intensity: 1, tags: ['Low Intensity', 'Seated'] },
  { id: 'IVSmoRsJ3Kg', title: 'Mediterranean Walking Plan Week 1', channel: 'Heart Foundation', duration: '15 min', level: 'Beginner', condition: 'cvd', intensity: 1, tags: ['Walking', 'Heart Health'] },
  { id: 'TkaYafQ-XC4', title: 'Low-Impact Cardio for Heart Health', channel: 'Fitness Blender', duration: '30 min', level: 'Intermediate', condition: 'cvd', intensity: 2, tags: ['Cardio', 'Moderate'] },

  // Mental health
  { id: 'O-6f5wQXSu8', title: '10-Min Mindfulness Meditation', channel: 'Headspace', duration: '10 min', level: 'All Levels', condition: 'mental', intensity: 1, tags: ['Mindfulness', 'Stress Relief'] },
  { id: 'hJbRpHZr_d0', title: 'Yoga for Anxiety and Stress Relief', channel: 'Yoga With Adriene', duration: '30 min', level: 'Beginner', condition: 'mental', intensity: 1, tags: ['Anxiety', 'Grounding'] },
  { id: 'z6X5oEIg6Ak', title: 'EMDR Butterfly Tap for Anxiety', channel: 'Therapy in a Nutshell', duration: '12 min', level: 'All Levels', condition: 'mental', intensity: 1, tags: ['EMDR', 'Trauma-Informed'] },
  { id: 'QHkXD33F5Hk', title: 'Endorphin Boost Workout for Depression', channel: 'MommaStrong', duration: '25 min', level: 'Beginner', condition: 'mental', intensity: 2, tags: ['Mood Lift', 'Serotonin'] },

  // Yoga
  { id: '9zRnGNKN55Y', title: 'Surya Namaskar — 12 Rounds Complete Guide', channel: 'The Art of Living', duration: '20 min', level: 'Intermediate', condition: 'yoga', intensity: 2, tags: ['Sun Salutation', 'Full Body'] },
  { id: 'DbQpB_vMkGk', title: 'Anulom Vilom Pranayama Full Session', channel: 'Isha Foundation', duration: '15 min', level: 'All Levels', condition: 'yoga', intensity: 1, tags: ['Pranayama', 'Calm'] },
  { id: 'v7AYKMP6rOE', title: 'Morning Yoga for Energy & Vitality', channel: 'Yoga With Adriene', duration: '25 min', level: 'Beginner', condition: 'yoga', intensity: 1, tags: ['Morning Routine', 'Energy'] },
  { id: '2n_MRa1xhm8', title: 'Kapalbhati Pranayama — Metabolic Boost', channel: 'Satvic Movement', duration: '20 min', level: 'Intermediate', condition: 'yoga', intensity: 2, tags: ['Pranayama', 'Detox', 'Metabolic'] },
]

const CONDITION_META = {
  diabetes: { label: 'Metabolic', color: '#C8C8C8', scoreKey: 'diabetes_risk' },
  hypertension: { label: 'Vascular', color: '#A7A7A7', scoreKey: 'hypertension_risk' },
  cvd: { label: 'Cardiac', color: '#E5E5E5', scoreKey: 'cvd_risk' },
  mental: { label: 'Cognitive', color: '#9E9E9E', scoreKey: 'mental_health_index' },
  yoga: { label: 'Yoga', color: '#F5F5F5', scoreKey: null },
}

function getMaxIntensity(riskScores) {
  if (!riskScores) return 3
  const cvd = riskScores.cvd_risk || 0
  if (cvd >= 70) return 1  // Only beginner if CVD is critical
  if (cvd >= 50) return 2  // Intermediate max
  return 3                 // All levels
}

function getRankedConditions(riskScores) {
  if (!riskScores) return ['yoga', 'mental', 'diabetes', 'hypertension', 'cvd']
  const scored = ['diabetes', 'hypertension', 'cvd', 'mental']
    .map((c) => ({ id: c, score: riskScores[CONDITION_META[c].scoreKey] || 0 }))
    .sort((a, b) => b.score - a.score)
  return [...scored.map((s) => s.id), 'yoga']
}

function VideoCard({ video, color, isRecommended }) {
  const [showEmbed, setShowEmbed] = useState(false)

  return (
    <div className="glass-card overflow-hidden hover:border-[rgba(255,255,255,0.15)] transition-all group animate-fade-in relative">
      {isRecommended && (
        <div className="absolute top-2 left-2 z-10 text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded" style={{ color, background: `${color}20`, border: `1px solid ${color}40` }}>
          Recommended
        </div>
      )}

      <div className="relative bg-[rgba(255,255,255,0.02)] aspect-video">
        {showEmbed ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <>
            <img
              src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
            />
            <button onClick={() => setShowEmbed(true)} className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[rgba(0,0,0,0.7)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </button>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70">{video.duration}</div>
          </>
        )}
      </div>

      <div className="p-4">
        <p className="text-[11px] text-text-primary leading-snug tracking-wide mb-2">{video.title}</p>
        <p className="text-[10px] text-text-muted font-mono mb-3">{video.channel} · {video.level}</p>
        <div className="flex flex-wrap gap-1.5">
          {video.tags.map((t) => (
            <span key={t} className="text-[9px] px-2 py-0.5 rounded font-mono tracking-widest uppercase" style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ExerciseVideos({ riskScores, userProfile }) {
  const rankedConditions = useMemo(() => getRankedConditions(riskScores), [riskScores])
  const maxIntensity = useMemo(() => getMaxIntensity(riskScores), [riskScores])
  const [activeCondition, setActiveCondition] = useState(() => rankedConditions[0])

  const filteredVideos = useMemo(() => {
    return ALL_VIDEOS
      .filter((v) => v.condition === activeCondition && v.intensity <= maxIntensity)
      .sort((a, b) => a.intensity - b.intensity)
  }, [activeCondition, maxIntensity])

  const meta = CONDITION_META[activeCondition]
  const topScore = riskScores?.[meta?.scoreKey]

  // Intensity warning
  const intensityWarning = maxIntensity < 3 && (activeCondition === 'cvd' || activeCondition === 'hypertension')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-5 border-l-2 border-accent-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/10 blur-[60px] pointer-events-none rounded-full" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] font-medium text-text-primary mb-1">Exercise Protocol</p>
            <p className="text-[10px] text-text-muted tracking-widest uppercase font-mono">
              {riskScores ? 'Personalised for your risk profile' : 'Curated · Condition-Specific'}
            </p>
          </div>
          {maxIntensity < 3 && (
            <div className="px-3 py-1.5 rounded border border-accent-500/30 bg-accent-500/5">
              <p className="text-[9px] font-mono text-accent-500 uppercase tracking-widest">High-intensity filtered</p>
            </div>
          )}
        </div>
      </div>

      {/* Condition tabs — sorted by risk */}
      <div className="flex flex-wrap gap-2">
        {rankedConditions.map((cond, idx) => {
          const m = CONDITION_META[cond]
          const score = riskScores?.[m.scoreKey]
          const isActive = activeCondition === cond
          return (
            <button
              key={cond}
              onClick={() => setActiveCondition(cond)}
              className="text-[9px] px-4 py-2.5 rounded font-mono uppercase tracking-widest transition-all relative overflow-hidden flex items-center gap-2"
              style={isActive
                ? { color: m.color, background: `${m.color}15`, border: `1px solid ${m.color}40` }
                : { color: '#8E8E93', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: m.color }} />}
              {idx === 0 && riskScores && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.color }} />}
              {m.label}
              {score !== undefined && score !== null && (
                <span className="text-[8px] opacity-60">{Math.round(score)}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Intensity warning */}
      {intensityWarning && (
        <div className="glass-card p-4 border-l-2 border-accent-500/50 bg-[rgba(229,229,229,0.02)] animate-fade-in">
          <p className="text-[11px] text-text-muted leading-relaxed">
            <strong className="text-text-primary">Note:</strong> High-intensity exercises are filtered based on your cardiovascular risk ({Math.round(riskScores?.cvd_risk || 0)}/100). Shown videos are safe for your risk level. Always warm up and consult your doctor before starting.
          </p>
        </div>
      )}

      {/* Videos */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((v, i) => (
            <VideoCard key={v.id} video={v} color={meta?.color || '#F5F5F5'} isRecommended={i === 0 && !!riskScores} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center border-dashed">
          <p className="text-sm text-text-muted">No videos match your current intensity filter for this category.</p>
          <p className="text-[10px] text-text-muted/50 font-mono mt-2">Try Yoga or Mental Health for gentler options.</p>
        </div>
      )}

      <div className="pt-4 text-center">
        <p className="text-[9px] text-text-muted/60 font-mono uppercase tracking-widest">
          CONSULT YOUR PHYSICIAN BEFORE STARTING A NEW EXERCISE REGIMEN.
        </p>
      </div>
    </div>
  )
}
