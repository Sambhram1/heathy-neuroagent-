import { useState } from 'react'

const CATEGORIES = [
  { id: 'diabetes', label: 'Metabolic', color: '#f59e0b' },
  { id: 'hypertension', label: 'Vascular', color: '#f97316' },
  { id: 'cvd', label: 'Cardiac', color: '#FF3B30' },
  { id: 'mental', label: 'Cognitive', color: '#eb4899' },
  { id: 'yoga', label: 'Yoga', color: '#F5F5F5' },
]

const VIDEOS = {
  diabetes: [
    {
      id: 'U9YKY7fdwyg',
      title: '30-Minute Walk for Blood Sugar Control',
      channel: 'Walk at Home',
      duration: '30 min',
      level: 'Beginner',
      tags: ['Low Impact', 'Cardio', 'Glucose Control'],
    },
    {
      id: 'TbwlC2B-BIg',
      title: 'Yoga Asanas for Diabetes Management',
      channel: 'Satvic Movement',
      duration: '25 min',
      level: 'Beginner',
      tags: ['Yoga', 'Insulin Sensitivity', 'Flexibility'],
    },
    {
      id: 'aXItOY0sNRU',
      title: 'Resistance Band Workout for Metabolic Health',
      channel: 'Fitness Blender',
      duration: '35 min',
      level: 'Intermediate',
      tags: ['Strength', 'Muscle Glucose Uptake'],
    },
  ],
  hypertension: [
    {
      id: 'inpok4MKVLM',
      title: '4-7-8 Breathing to Lower Blood Pressure',
      channel: 'Meditative Mind',
      duration: '10 min',
      level: 'All Levels',
      tags: ['Breathing', 'Parasympathetic', 'Stress Reduction'],
    },
    {
      id: 'COp7BR_Dvps',
      title: 'Gentle Yoga for High Blood Pressure',
      channel: 'Yoga With Adriene',
      duration: '28 min',
      level: 'Beginner',
      tags: ['Gentle Yoga', 'Relaxation', 'BP Control'],
    },
    {
      id: 'sTANio_2E0Q',
      title: 'Low-Impact Aerobics for Hypertension',
      channel: 'Pahla B Fitness',
      duration: '32 min',
      level: 'Beginner',
      tags: ['Cardio', 'Systolic Reduction', 'Safe'],
    },
  ],
  cvd: [
    {
      id: 'XUi7yd6Rl4A',
      title: 'Cardiac Rehab: Phase 2 Exercise Program',
      channel: 'Cleveland Clinic',
      duration: '20 min',
      level: 'Supervised',
      tags: ['Cardiac Rehab', 'Heart Rate Monitor', 'Safe'],
    },
    {
      id: '5pLcyHPqqpM',
      title: 'Chair Cardio for Heart Health',
      channel: 'HASfit',
      duration: '25 min',
      level: 'Beginner',
      tags: ['Low Intensity', 'Seated', 'Heart Health'],
    },
    {
      id: 'IVSmoRsJ3Kg',
      title: 'Mediterranean Walking Plan — Week 1',
      channel: 'Heart Foundation',
      duration: '15 min',
      level: 'Beginner',
      tags: ['Walking', 'Incremental', 'Cardio'],
    },
  ],
  mental: [
    {
      id: 'inpok4MKVLM',
      title: '10-Minute Mindfulness Meditation',
      channel: 'Headspace',
      duration: '10 min',
      level: 'All Levels',
      tags: ['Mindfulness', 'Stress Relief', 'Focus'],
    },
    {
      id: 'hJbRpHZr_d0',
      title: 'Yoga for Anxiety and Stress Relief',
      channel: 'Yoga With Adriene',
      duration: '30 min',
      level: 'Beginner',
      tags: ['Anxiety', 'Nervous System', 'Grounding'],
    },
    {
      id: 'O-6f5wQXSu8',
      title: 'Body Scan Relaxation for Sleep',
      channel: 'Calm',
      duration: '20 min',
      level: 'All Levels',
      tags: ['Sleep', 'Body Scan', 'Deep Rest'],
    },
  ],
  yoga: [
    {
      id: '9zRnGNKN55Y',
      title: 'Surya Namaskar — 12 Rounds Complete Guide',
      channel: 'The Art of Living',
      duration: '20 min',
      level: 'Intermediate',
      tags: ['Sun Salutation', 'Full Body', 'Energy'],
    },
    {
      id: 'DbQpB_vMkGk',
      title: 'Anulom Vilom Pranayama — Full Session',
      channel: 'Isha Foundation',
      duration: '15 min',
      level: 'All Levels',
      tags: ['Pranayama', 'Breathing', 'Calm'],
    },
    {
      id: 'v7AYKMP6rOE',
      title: 'Morning Yoga for Energy & Vitality',
      channel: 'Yoga With Adriene',
      duration: '25 min',
      level: 'Beginner',
      tags: ['Morning Routine', 'Energy', 'Flexibility'],
    },
  ],
}

function VideoCard({ video, color }) {
  const [showEmbed, setShowEmbed] = useState(false)

  return (
    <div className="glass-card overflow-hidden hover:border-[rgba(255,255,255,0.15)] transition-all group animate-fade-in">
      {/* Thumbnail / Embed */}
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
            <button
              onClick={() => setShowEmbed(true)}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(0,0,0,0.7)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </button>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white/70">
              {video.duration}
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[11px] text-text-primary leading-snug tracking-wide mb-2">{video.title}</p>
        <p className="text-[10px] text-text-muted font-mono mb-3">{video.channel} · {video.level}</p>
        <div className="flex flex-wrap gap-1.5">
          {video.tags.map((t) => (
            <span
              key={t}
              className="text-[9px] px-2 py-0.5 rounded font-mono tracking-widest uppercase"
              style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ExerciseVideos({ riskScores }) {
  // Default to highest-risk category
  const getDefaultCat = () => {
    if (!riskScores) return 'yoga'
    const scores = {
      diabetes: riskScores.diabetes_risk,
      hypertension: riskScores.hypertension_risk,
      cvd: riskScores.cvd_risk,
      mental: riskScores.mental_health_index,
    }
    const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : 'yoga'
  }

  const [active, setActive] = useState(getDefaultCat)
  const cat = CATEGORIES.find((c) => c.id === active)
  const videos = VIDEOS[active] || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-5 border-l-2 border-accent-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/10 blur-[60px] pointer-events-none rounded-full" />
        <div className="relative z-10">
          <p className="text-[12px] uppercase tracking-[0.2em] font-medium text-text-primary mb-1">Exercise Protocol</p>
          <p className="text-[10px] text-text-muted tracking-widest uppercase font-mono">Curated · Condition-Specific · Evidence-Graded</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className="text-[9px] px-4 py-2 rounded font-mono uppercase tracking-widest transition-all relative overflow-hidden"
            style={
              active === c.id
                ? { color: c.color, background: `${c.color}15`, border: `1px solid ${c.color}40` }
                : { color: '#8E8E93', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {active === c.id && (
              <span className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: c.color }} />
            )}
            {c.label}
          </button>
        ))}
      </div>

      {/* Videos grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} color={cat?.color || '#F5F5F5'} />
        ))}
      </div>

      <div className="pt-4 text-center">
        <p className="text-[9px] text-text-muted/60 font-mono uppercase tracking-widest">
          CONSULT YOUR PHYSICIAN BEFORE STARTING A NEW EXERCISE REGIMEN.
        </p>
      </div>
    </div>
  )
}
