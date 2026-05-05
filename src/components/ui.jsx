import { Paperclip, X } from "lucide-react"

export function FieldLabel({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--fg2)", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  )
}

export function ResultSection({ label, body, highlight }) {
  return (
    <div>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fg2)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "0.84rem", lineHeight: 1.65, color: "var(--fg)", opacity: 0.85, whiteSpace: "pre-wrap", ...(highlight ? { background: "color-mix(in oklab, var(--primary) 6%, transparent)", borderRadius: 8, padding: "8px 12px" } : {}) }}>
        {body}
      </div>
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