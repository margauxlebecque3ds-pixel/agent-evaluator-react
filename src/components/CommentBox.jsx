import { useState } from "react"
import { X } from "lucide-react"

export default function CommentBox({ t, value, onChange }) {
  const [saved, setSaved] = useState(false)

  return (
    <div style={{ marginTop: 12, borderRadius: 12, border: "1px solid color-mix(in oklab, var(--primary) 30%, transparent)", background: "color-mix(in oklab, var(--primary) 5%, transparent)", padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--primary)", opacity: 0.8 }}>{t.addComment}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {!saved ? (
            <button type="button" onClick={() => { if (value.trim()) setSaved(true) }}
              style={{ background: "var(--primary)", border: "none", cursor: "pointer", color: "white", borderRadius: 6, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 600, fontFamily: "inherit" }}>
              {t.saveComment || "Save"}
            </button>
          ) : (
            <button type="button" onClick={() => setSaved(false)}
              style={{ background: "none", border: "1px solid var(--border)", cursor: "pointer", color: "var(--fg2)", borderRadius: 6, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 500, fontFamily: "inherit" }}>
              {t.editComment || "Edit"}
            </button>
          )}
          {!saved && value && (
            <button type="button" onClick={() => { onChange(""); setSaved(false) }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg2)", display: "flex" }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      {saved ? (
        <p style={{ fontSize: "0.85rem", color: "white", lineHeight: 1.5, margin: 0 }}>{value}</p>
      ) : (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={t.commentPlaceholder} rows={2} autoFocus
          style={{ width: "100%", background: "none", border: "none", outline: "none", resize: "none", fontSize: "0.85rem", color: "white", fontFamily: "inherit", lineHeight: 1.5 }} />
      )}
    </div>
  )
}