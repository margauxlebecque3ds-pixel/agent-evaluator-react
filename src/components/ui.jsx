import { Paperclip, X } from "lucide-react"

export function FieldLabel({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--fg2)", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  )
}

function parseAdviceBullets(text) {
  if (!text) return null
  const str = Array.isArray(text) ? text.join("\n") : String(text)
  const lines = str.split("\n").map(l => l.trim()).filter(Boolean)
  const bullets = []
  for (const line of lines) {
    const highMatch = line.match(/^\[HIGH\]\s*(.+)/)
    const medMatch  = line.match(/^\[MEDIUM\]\s*(.+)/)
    const lowMatch  = line.match(/^\[LOW\]\s*(.+)/)
    if (highMatch)        bullets.push({ level: "HIGH",   text: highMatch[1] })
    else if (medMatch)    bullets.push({ level: "MEDIUM", text: medMatch[1] })
    else if (lowMatch)    bullets.push({ level: "LOW",    text: lowMatch[1] })
    else if (bullets.length > 0) bullets[bullets.length - 1].text += " " + line
  }
  return bullets.length > 0 ? bullets : null
}

const PRIORITY_STYLES = {
  HIGH:   { dot: "var(--danger)",  bg: "color-mix(in oklab, var(--danger) 8%, transparent)",  border: "color-mix(in oklab, var(--danger) 25%, transparent)",  label: "High" },
  MEDIUM: { dot: "var(--warning)", bg: "color-mix(in oklab, var(--warning) 8%, transparent)", border: "color-mix(in oklab, var(--warning) 25%, transparent)", label: "Medium" },
  LOW:    { dot: "var(--success)", bg: "color-mix(in oklab, var(--success) 8%, transparent)", border: "color-mix(in oklab, var(--success) 25%, transparent)", label: "Low" },
}

function AdviceBullet({ level, text }) {
  const s = PRIORITY_STYLES[level]
  const parts = String(text).split("→")
  const before = parts[0]?.trim()
  const after  = parts[1]?.trim()

  return (
    <div style={{ display: "flex", gap: 10, padding: "8px 12px", borderRadius: 8, background: s.bg, border: `1px solid ${s.border}`, marginBottom: 6 }}>
      <div style={{ flexShrink: 0, marginTop: 3 }}>
        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
      </div>
      <div style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "var(--fg)" }}>
        <span style={{ fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: s.dot, marginRight: 6 }}>{s.label}</span>
        {before}
        {after && (
          <>
            <span style={{ color: "var(--fg2)", margin: "0 4px" }}>→</span>
            <span style={{ color: "var(--primary)", fontStyle: "italic" }}>{after}</span>
          </>
        )}
      </div>
    </div>
  )
}

export function ResultSection({ label, body, highlight }) {
  const safeBody = body === null || body === undefined ? "" : (typeof body === "object" ? JSON.stringify(body) : String(body))
  const bullets = highlight ? parseAdviceBullets(safeBody) : null

  return (
    <div>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fg2)", marginBottom: 6 }}>{label}</div>
      {bullets ? (
        <div>
          {bullets.map((b, i) => <AdviceBullet key={i} level={b.level} text={b.text} />)}
        </div>
      ) : (
        <div style={{ fontSize: "0.84rem", lineHeight: 1.65, color: "var(--fg)", opacity: 0.85, whiteSpace: "pre-wrap", ...(highlight ? { background: "color-mix(in oklab, var(--primary) 6%, transparent)", borderRadius: 8, padding: "8px 12px" } : {}) }}>
          {safeBody}
        </div>
      )}
    </div>
  )
}

export function AttachList({ files, setFiles }) {
  return (
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
      {files.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-el)", padding: "5px 10px", fontSize: "0.78rem" }}>
          <Paperclip size={12} style={{ color: "var(--primary)" }} />
          <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
          <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg2)", display: "flex" }}>
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}