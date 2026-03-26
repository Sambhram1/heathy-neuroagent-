import { useState } from 'react'

// ─── Question definitions ──────────────────────────────────────────────────
const STEPS = [
  {
    id: 'demographics',
    title: 'About You',
    subtitle: 'Basic demographic parameters',
    questions: [
      {
        id: 'age_range',
        text: 'What is your age?',
        type: 'mcq',
        options: [
          { label: 'Under 25', value: 22 },
          { label: '25 – 34', value: 29 },
          { label: '35 – 44', value: 39 },
          { label: '45 – 54', value: 49 },
          { label: '55 or older', value: 62 },
        ],
      },
      {
        id: 'sex',
        text: 'Biological sex',
        type: 'mcq',
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Prefer not to say', value: 'other' },
        ],
      },
    ],
  },
  {
    id: 'body',
    title: 'Body Composition',
    subtitle: 'Used to calculate BMI and metabolic risk',
    questions: [
      { id: 'height_cm', text: 'Height (cm)', type: 'number', min: 100, max: 230, placeholder: '170', unit: 'cm' },
      { id: 'weight_kg', text: 'Weight (kg)', type: 'number', min: 30, max: 250, placeholder: '70', unit: 'kg' },
      {
        id: 'waist_range',
        text: 'Approximate waist circumference?',
        type: 'mcq',
        options: [
          { label: "I don't know", value: null },
          { label: '< 80 cm (slim)', value: 75 },
          { label: '80 – 90 cm (moderate)', value: 85 },
          { label: '90 – 100 cm (large)', value: 95 },
          { label: '> 100 cm (very large)', value: 105 },
        ],
      },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    subtitle: 'Daily habits and routines',
    questions: [
      {
        id: 'activity_level',
        text: 'Daily physical activity level',
        type: 'mcq',
        options: [
          { label: 'Sedentary — mostly sitting', value: 'sedentary' },
          { label: 'Light — walking, housework', value: 'light' },
          { label: 'Moderate — regular exercise', value: 'moderate' },
          { label: 'Active — gym, sports 5+×/wk', value: 'active' },
        ],
      },
      {
        id: 'diet_quality',
        text: 'How would you rate your diet?',
        type: 'mcq',
        options: [
          { label: 'Poor — lots of fried, processed food', value: 2 },
          { label: 'Fair — sometimes healthy', value: 5 },
          { label: 'Good — mostly whole foods', value: 7 },
          { label: 'Excellent — clean, balanced diet', value: 9 },
        ],
      },
      {
        id: 'sleep_hours',
        text: 'Average sleep per night',
        type: 'mcq',
        options: [
          { label: 'Less than 5 hours', value: 4.5 },
          { label: '5 – 6 hours', value: 5.5 },
          { label: '7 – 8 hours', value: 7.5 },
          { label: 'More than 8 hours', value: 8.5 },
        ],
      },
      {
        id: 'sleep_quality',
        text: 'Sleep quality',
        type: 'mcq',
        options: [
          { label: 'Poor — often unrefreshed', value: 'poor' },
          { label: 'Fair — sometimes disrupted', value: 'fair' },
          { label: 'Good — usually well-rested', value: 'good' },
        ],
      },
    ],
  },
  {
    id: 'risk_factors',
    title: 'Risk Factors',
    subtitle: 'Key lifestyle and behavioural parameters',
    questions: [
      {
        id: 'smoking',
        text: 'Do you smoke?',
        type: 'mcq',
        options: [
          { label: 'Never smoked', value: 'never' },
          { label: 'Former smoker', value: 'former' },
          { label: 'Yes, currently smoking', value: 'current' },
        ],
      },
      {
        id: 'alcohol',
        text: 'Alcohol consumption',
        type: 'mcq',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Occasional (1–2×/week)', value: 'occasional' },
          { label: 'Regular (3+×/week)', value: 'regular' },
        ],
      },
      {
        id: 'stress_level',
        text: 'Current stress level',
        type: 'mcq',
        options: [
          { label: '1–3 / Low — generally calm', value: 2 },
          { label: '4–6 / Moderate — manageable', value: 5 },
          { label: '7–8 / High — often stressed', value: 7 },
          { label: '9–10 / Critical — overwhelmed', value: 9 },
        ],
      },
    ],
  },
  {
    id: 'history_vitals',
    title: 'Family History & Vitals',
    subtitle: 'Clinical and genetic risk markers',
    questions: [
      {
        id: 'family_history',
        text: 'Family history of (select all that apply)',
        type: 'multi',
        options: [
          { label: 'Type 2 Diabetes', value: 'diabetes' },
          { label: 'Hypertension / High BP', value: 'hypertension' },
          { label: 'Heart Disease / Stroke', value: 'cvd' },
          { label: 'None of the above', value: '__none__' },
        ],
      },
      {
        id: 'bp_range',
        text: 'Do you know your blood pressure?',
        type: 'mcq',
        options: [
          { label: "I don't know", value: null },
          { label: 'Normal (below 120/80)', value: 110 },
          { label: 'Elevated (120–129 systolic)', value: 125 },
          { label: 'High (130+ systolic)', value: 142 },
        ],
      },
      {
        id: 'glucose_range',
        text: 'Fasting blood glucose (if known)',
        type: 'mcq',
        options: [
          { label: "I don't know", value: null },
          { label: 'Normal (below 100 mg/dL)', value: 85 },
          { label: 'Pre-diabetic (100–125 mg/dL)', value: 112 },
          { label: 'Diabetic range (126+ mg/dL)', value: 140 },
        ],
      },
    ],
  },
  {
    id: 'mental',
    title: 'Mental Wellbeing',
    subtitle: 'PHQ-9 / GAD-7 screening proxy',
    questions: [
      {
        id: 'phq_interest',
        text: 'Over the past 2 weeks, how often have you felt little interest or pleasure in things?',
        type: 'mcq',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'phq_hopeless',
        text: 'Feeling down, hopeless, or having little energy?',
        type: 'mcq',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'gad_anxious',
        text: 'Feeling anxious, nervous, or on edge?',
        type: 'mcq',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'gad_worry',
        text: 'Unable to control worrying?',
        type: 'mcq',
        options: [
          { label: 'Not at all', value: 0 },
          { label: 'Several days', value: 1 },
          { label: 'More than half the days', value: 2 },
          { label: 'Nearly every day', value: 3 },
        ],
      },
    ],
  },
]

// ─── Individual question renderers ─────────────────────────────────────────
function MCQQuestion({ question, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-primary font-medium tracking-wide leading-relaxed">{question.text}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt, i) => {
          const selected = value === opt.value || (Array.isArray(value) && value.includes(opt.value))
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`text-left px-4 py-3 rounded-xl border text-xs transition-all ${
                selected
                  ? 'border-accent-500/50 bg-accent-500/10 text-text-primary'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-text-muted hover:border-[rgba(255,255,255,0.2)] hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full border flex-shrink-0 transition-all ${
                    selected ? 'border-accent-500 bg-accent-500' : 'border-[rgba(255,255,255,0.2)]'
                  }`}
                />
                <span className="tracking-wide">{opt.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MultiQuestion({ question, value = [], onChange }) {
  const toggle = (v) => {
    if (v === '__none__') {
      onChange(['__none__'])
      return
    }
    const next = value.filter((x) => x !== '__none__')
    if (next.includes(v)) {
      onChange(next.filter((x) => x !== v))
    } else {
      onChange([...next, v])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-primary font-medium tracking-wide leading-relaxed">{question.text}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt, i) => {
          const selected = value.includes(opt.value)
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`text-left px-4 py-3 rounded-xl border text-xs transition-all ${
                selected
                  ? 'border-accent-500/50 bg-accent-500/10 text-text-primary'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-text-muted hover:border-[rgba(255,255,255,0.2)] hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded border flex-shrink-0 transition-all ${
                    selected ? 'border-accent-500 bg-accent-500' : 'border-[rgba(255,255,255,0.2)]'
                  }`}
                />
                <span className="tracking-wide">{opt.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NumberInput({ question, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-primary font-medium tracking-wide">{question.text}</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={question.min}
          max={question.max}
          placeholder={question.placeholder}
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || null)}
          className="w-36 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted/40 outline-none focus:border-accent-500/50 transition-colors font-mono"
        />
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">{question.unit}</span>
      </div>
    </div>
  )
}

// ─── Converts raw answers → API payload ────────────────────────────────────
function buildPayload(answers) {
  const phq9 = Math.min(27, ((answers.phq_interest || 0) + (answers.phq_hopeless || 0)) * 4)
  const gad7 = Math.min(21, ((answers.gad_anxious || 0) + (answers.gad_worry || 0)) * 3.5)
  const fh = (answers.family_history || []).filter((x) => x !== '__none__')

  return {
    age: answers.age_range || 35,
    sex: answers.sex || 'other',
    height_cm: answers.height_cm || 170,
    weight_kg: answers.weight_kg || 70,
    waist_cm: answers.waist_range ?? null,
    activity_level: answers.activity_level || 'sedentary',
    diet_quality: answers.diet_quality || 5,
    sleep_hours: answers.sleep_hours || 7,
    sleep_quality: answers.sleep_quality || 'fair',
    stress_level: answers.stress_level || 5,
    family_history: fh,
    smoking: answers.smoking === 'current',
    alcohol: answers.alcohol || 'none',
    systolic_bp: answers.bp_range ?? null,
    fasting_glucose: answers.glucose_range ?? null,
    phq9_estimate: Math.round(phq9),
    gad7_estimate: Math.round(gad7),
  }
}

// ─── Step is complete when all required questions answered ──────────────────
function isStepComplete(step, answers) {
  return step.questions.every((q) => {
    if (q.type === 'multi') return Array.isArray(answers[q.id]) && answers[q.id].length > 0
    if (q.type === 'number') return answers[q.id] !== undefined && answers[q.id] !== null && !isNaN(answers[q.id])
    // For MCQ: just check the key was explicitly set (null is a valid answer for "I don't know")
    return q.id in answers
  })
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function AssessmentForm({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const step = STEPS[stepIndex]
  const progress = ((stepIndex) / STEPS.length) * 100
  const complete = isStepComplete(step, answers)

  const setAnswer = (qId, value) => setAnswers((prev) => ({ ...prev, [qId]: value }))

  const next = async () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      // Submit
      setLoading(true)
      setError('')
      try {
        const payload = buildPayload(answers)
        const res = await fetch('/api/assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        onComplete({ profile: payload, riskScores: data.risk_scores, amplifiers: data.amplifiers, profileSummary: data.profile_summary })
      } catch (e) {
        setError(`Analysis failed: ${e.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const back = () => setStepIndex((i) => Math.max(0, i - 1))

  // Live BMI preview
  const bmi = answers.height_cm && answers.weight_kg
    ? (answers.weight_kg / ((answers.height_cm / 100) ** 2)).toFixed(1)
    : null

  return (
    <div className="min-h-full flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20 tracking-widest uppercase">
              Step {stepIndex + 1} of {STEPS.length}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted/50">
              {step.id.toUpperCase()}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${progress + (100 / STEPS.length)}%` }}
            />
          </div>

          <h2 className="text-2xl font-light tracking-tight text-text-primary mb-1">{step.title}</h2>
          <p className="text-[11px] text-text-muted font-mono uppercase tracking-[0.15em]">{step.subtitle}</p>
        </div>

        {/* Questions */}
        <div className="space-y-6 animate-fade-in">
          {step.questions.map((q) => (
            <div key={q.id} className="glass-card p-5">
              {q.type === 'mcq' && (
                <MCQQuestion
                  question={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswer(q.id, v)}
                />
              )}
              {q.type === 'multi' && (
                <MultiQuestion
                  question={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswer(q.id, v)}
                />
              )}
              {q.type === 'number' && (
                <NumberInput
                  question={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswer(q.id, v)}
                />
              )}
            </div>
          ))}

          {/* BMI preview */}
          {bmi && step.id === 'body' && (
            <div className="glass-card p-4 flex items-center gap-4 border-l-2 border-[rgba(255,255,255,0.2)] animate-fade-in">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-text-muted mb-1">BMI (Calculated)</p>
                <p className="text-2xl font-light font-mono" style={{
                  color: bmi < 18.5 ? '#C8C8C8' : bmi < 23 ? '#F5F5F5' : bmi < 25 ? '#C8C8C8' : bmi < 30 ? '#A7A7A7' : '#E5E5E5'
                }}>{bmi}</p>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {bmi < 18.5 ? 'Underweight' : bmi < 23 ? 'Healthy (South Asian threshold)' : bmi < 25 ? 'Overweight risk begins at 23 for South Asians' : bmi < 30 ? 'Overweight' : 'Obese'}
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl border border-accent-500/30 bg-accent-500/5 animate-fade-in">
            <p className="text-[11px] text-accent-500 font-mono">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={back}
            disabled={stepIndex === 0}
            className="text-[10px] font-mono uppercase tracking-widest text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors flex items-center gap-2"
          >
            ← Back
          </button>

          <button
            onClick={next}
            disabled={!complete || loading}
            className="px-8 py-3.5 rounded-xl bg-accent-500 text-[#0B0B0B] font-medium text-xs tracking-wide hover:bg-[#BFBFBF] disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(229,229,229,0.3)] flex items-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-[#0B0B0B] border-t-transparent rounded-full animate-spin" />
                Analysing…
              </>
            ) : stepIndex === STEPS.length - 1 ? (
              'Run Analysis →'
            ) : (
              'Continue →'
            )}
          </button>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === stepIndex ? 'w-6 bg-accent-500' : i < stepIndex ? 'w-2 bg-accent-500/40' : 'w-2 bg-[rgba(255,255,255,0.1)]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
