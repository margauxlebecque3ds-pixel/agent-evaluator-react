import { useState, useEffect } from "react"

const logos = [
  { src: "/aura.png", name: "AURA" },
  { src: "/leo.png", name: "LEO" },
  { src: "/marie.png", name: "MARIE" },
]

export default function VCLogos() {
  const [visible, setVisible] = useState([false, false, false])

  useEffect(() => {
    logos.forEach((_, i) => {
      setTimeout(() => {
        setVisible(v => { const next = [...v]; next[i] = true; return next })
      }, i * 300)
    })
  }, [])

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {logos.map((logo, i) => (
        <div key={logo.name} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          opacity: visible[i] ? 1 : 0,
          transform: visible[i] ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}>
          <img src={logo.src} alt={logo.name} style={{ height: 32, width: 32, objectFit: "contain" }} />
        </div>
      ))}
    </div>
  )
}