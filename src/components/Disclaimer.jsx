import { Info, X } from "lucide-react"

export default function Disclaimer({ t, closed, onClose, onOpen }) {
  if (closed) return (
    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg2)", display: "flex", alignItems: "center", flexShrink: 0, padding: 4, borderRadius: 6, transition: "color 0.15s" }}
  onMouseEnter={e => e.currentTarget.style.color = "var(--fg)"}
  onMouseLeave={e => e.currentTarget.style.color = "var(--fg2)"}>
  <X size={16} />
</button>
  )
  return (
    <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", gap: 16, borderRadius: 16, padding: "14px 20px", background: "linear-gradient(100deg, color-mix(in oklab, var(--primary) 22%, transparent), color-mix(in oklab, var(--primary) 8%, transparent) 60%, transparent)", border: "1px solid color-mix(in oklab, var(--primary) 35%, transparent)" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in oklab, var(--primary) 25%, transparent)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Info size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{t.aboutTitle}</span>
          <span style={{ color: "var(--fg2)", fontSize: "0.72rem" }}>v0.2 · Margaux Lebecque · Dassault Systèmes</span>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--fg2)", lineHeight: 1.55 }}>{t.aboutBody}</p>
      </div>
      <button onClick={onClose} className="btn-ghost" style={{ borderRadius: 999, padding: "6px 14px", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
        {t.disclaimerCta} <X size={12} style={{ opacity: 0.7 }} />
      </button>
    </div>
  )
}