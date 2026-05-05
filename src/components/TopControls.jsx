import { useState, useEffect, useRef } from "react"
import { Languages, ChevronDown, Check, Sun, Moon } from "lucide-react"

export default function TopControls({ t, lang, changeLang, theme, toggleTheme, isDark }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative" }} ref={ref}>
        <button onClick={() => setOpen(v => !v)} className="glass btn-ghost"
          style={{ borderRadius: 999, padding: "0 14px", height: 40, fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 8, color: "var(--fg)" }}>
          <Languages size={15} style={{ opacity: 0.7 }} />
          <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.72rem", fontWeight: 600 }}>{lang}</span>
          <ChevronDown size={13} style={{ opacity: 0.5, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
        </button>
        {open && (
          <div className="glass-strong fade-up" style={{ position: "absolute", right: 0, top: 48, borderRadius: 14, overflow: "hidden", minWidth: 160, zIndex: 50, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            {[["en", "English"], ["fr", "Français"]].map(([code, label]) => (
              <button key={code} onClick={() => { changeLang(code); setOpen(false) }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", color: lang === code ? "var(--primary)" : "var(--fg)", fontFamily: "inherit", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "color-mix(in oklab, var(--primary) 10%, transparent)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                {label}
                {lang === code && <Check size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={toggleTheme} className="glass btn-ghost" title={t.themeToggle}
        style={{ borderRadius: 999, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg)" }}>
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  )
}