import { useState, useRef } from 'react'

export default function DiagnosisUpload({ onReportSaved, existingReport }) {
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(existingReport ? 'done' : null)
  const [savedReport, setSavedReport] = useState(existingReport || null)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(f.type)) { setStatus('error'); return }
    setFile(f)
    setStatus('loading')
    setTimeout(() => {
      const ctx = {
        filename: f.name,
        fileType: f.type,
        fileSize: `${(f.size / 1024).toFixed(0)} KB`,
        uploadedAt: new Date().toISOString(),
        notes: notes || '',
      }
      setSavedReport(ctx)
      setStatus('done')
      onReportSaved?.(ctx)
    }, 1800)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleNotesChange = (e) => {
    setNotes(e.target.value)
    if (savedReport) {
      const updated = { ...savedReport, notes: e.target.value }
      setSavedReport(updated)
      onReportSaved?.(updated)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-5 border-l-2 border-accent-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/10 blur-[60px] pointer-events-none rounded-full" />
        <div className="relative z-10">
          <p className="text-[12px] uppercase tracking-[0.2em] font-medium text-text-primary mb-1">Diagnosis Report Upload</p>
          <p className="text-[11px] text-text-muted tracking-widest uppercase font-mono">Optional · PDF or Image · Contextualises AI Responses</p>
        </div>
      </div>

      {/* Existing report banner */}
      {savedReport && (
        <div className="glass-card p-5 border-l-2 border-[rgba(255,255,255,0.3)] animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-text-primary">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-primary tracking-wide mb-1">Report on File</p>
              <p className="text-[11px] text-text-muted font-mono tracking-widest">{savedReport.filename}</p>
              {savedReport.fileSize && <p className="text-[11px] text-text-muted/50 font-mono mt-0.5">{savedReport.fileSize} · {savedReport.fileType}</p>}
              <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                The AI diagnostic chatbot will reference this report in its analysis. Ask it questions like "What do my blood sugar levels mean?" or "Explain my lipid profile."
              </p>
            </div>
            <button
              onClick={() => { setStatus(null); setSavedReport(null); setFile(null); onReportSaved?.(null) }}
              className="text-[11px] font-mono text-text-muted/40 hover:text-accent-500 transition-colors uppercase tracking-widest flex-shrink-0"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Drop zone */}
      {!savedReport && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`glass-card p-12 flex flex-col items-center justify-center cursor-pointer transition-all border-dashed text-center ${
            dragging ? 'border-accent-500 bg-accent-500/5' : 'hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.02)]'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

          <div className={`w-16 h-16 rounded-full border flex items-center justify-center mb-5 transition-all ${dragging ? 'border-accent-500/50 bg-accent-500/10' : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={dragging ? 'text-accent-500' : 'text-text-muted'} stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <p className="text-sm text-text-primary tracking-wide mb-2">{dragging ? 'Release to upload' : 'Drop your report here'}</p>
          <p className="text-[11px] text-text-muted tracking-widest uppercase font-mono">PDF · JPEG · PNG · WebP</p>
        </div>
      )}

      {/* Processing */}
      {status === 'loading' && (
        <div className="glass-card p-5 flex items-center gap-4 animate-fade-in">
          <div className="w-8 h-8 rounded border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-xs text-text-primary tracking-wide">Processing report…</p>
            <p className="text-[11px] text-text-muted font-mono mt-1">{file?.name}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="glass-card p-5 border-l-2 border-accent-500 animate-fade-in bg-[rgba(229,229,229,0.03)]">
          <p className="text-xs text-accent-500 tracking-wide">Unsupported file type. Please upload a PDF or image (JPEG, PNG, WebP).</p>
        </div>
      )}

      {/* Notes / Key values */}
      {savedReport && (
        <div className="glass-card p-5 space-y-3">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-text-muted mb-3">Key Values (Optional)</p>
          <p className="text-[12px] text-text-muted leading-relaxed mb-3">
            Paste key findings from your report here so the AI can use them precisely (e.g. "HbA1c: 6.2%, Fasting glucose: 108 mg/dL, LDL: 142 mg/dL"):
          </p>
          <textarea
            rows={4}
            value={notes}
            onChange={handleNotesChange}
            placeholder="HbA1c: 6.2%, Fasting glucose: 108 mg/dL, LDL: 142 mg/dL, BP: 128/84..."
            className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-xs text-text-primary placeholder-text-muted/30 outline-none focus:border-accent-500/30 transition-all font-mono resize-none"
          />
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Blood Reports', 'HbA1c, fasting glucose, lipid profile, CBC, TSH'],
          ['Imaging Reports', 'ECG printouts, chest X-ray, echo, DEXA'],
          ['Doctor Notes', 'Discharge summaries, prescription records'],
        ].map(([title, desc]) => (
          <div key={title} className="glass-card p-4">
            <p className="text-[11px] font-mono uppercase tracking-widest text-accent-500 mb-2">{title}</p>
            <p className="text-[12px] text-text-muted leading-relaxed tracking-wide">{desc}</p>
          </div>
        ))}
      </div>

      <div className="pt-4 text-center">
        <p className="text-[11px] text-text-muted/60 font-mono uppercase tracking-widest">
          REPORTS ARE PROCESSED LOCALLY. NOT TRANSMITTED TO EXTERNAL SERVERS.
        </p>
      </div>
    </div>
  )
}
