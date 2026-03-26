export default function EvidenceCard({ source, text, condition, relevance_score }) {
  const conditionColors = {
    diabetes: { color: '#C8C8C8', bg: 'rgba(200,200,200,0.02)', border: 'rgba(200,200,200,0.2)', label: 'Metabolic' },
    hypertension: { color: '#A7A7A7', bg: 'rgba(167,167,167,0.02)', border: 'rgba(167,167,167,0.2)', label: 'Vascular' },
    cvd: { color: '#E5E5E5', bg: 'rgba(229,229,229,0.05)', border: 'rgba(229,229,229,0.3)', label: 'Cardio' },
    mental_health: { color: '#9E9E9E', bg: 'rgba(158,158,158,0.02)', border: 'rgba(158,158,158,0.2)', label: 'Cognitive' },
  }
  const c = conditionColors[condition] || { color: '#F5F5F5', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.1)', label: 'General' }

  return (
    <div
      className="rounded-lg p-4 border animate-fade-in text-[10px] uppercase tracking-widest font-mono"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold tracking-widest flex-shrink-0"
          style={{ color: c.color, background: `${c.color}20` }}
        >
          {c.label}
        </span>
        {relevance_score !== undefined && (
          <span className="text-[9px] text-text-muted flex-shrink-0 flex items-center gap-1.5" style={{ color: c.color }}>
            <span className="w-1 h-1 rounded-full" style={{ background: c.color }} />
            {relevance_score}% MATCH
          </span>
        )}
      </div>
      <p className="text-text-primary leading-relaxed mb-3 line-clamp-3 normal-case tracking-wide font-sans">{text}</p>
      <div className="flex items-center gap-2 text-text-muted/60">
        <span className="w-4 border-t border-[rgba(255,255,255,0.1)] inline-block"></span>
        <span>{source}</span>
      </div>
    </div>
  )
}
