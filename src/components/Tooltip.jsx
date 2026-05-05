import { useState } from "react"
import { Info } from "lucide-react"

export default function Tooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", padding: 0, color: "var(--fg2)" }}>
        <Info size={13} style={{ opacity: 0.6 }} />
      </button>
      {show && (
        <span style={{
          position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
          background: "color-mix(in oklab, var(--surface-el) 95%, transparent)",
          backdropFilter: "blur(16px)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "8px 12px", fontSize: "0.75rem", lineHeight: 1.5,
          color: "var(--fg)", width: 240, zIndex: 100,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", pointerEvents: "none",
          whiteSpace: "normal",
        }}>
          {text}
        </span>
      )}
    </span>
  )
}