import { ArrowLeft, Download, FileText } from "lucide-react"
import { HEURISTICS } from "../heuristics"
import TopControls from "./TopControls"

export default function HeuristicsPage({ t, lang, changeLang, theme, toggleTheme, isDark, setPage }) {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <TopControls t={t} lang={lang} changeLang={changeLang} theme={theme} toggleTheme={toggleTheme} isDark={isDark} />
      </div>

      <main style={{ padding: "32px 40px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
          <button onClick={() => setPage("home")} className="btn-ghost" style={{ borderRadius: 999, padding: "8px 18px", fontSize: "0.85rem" }}>
            <ArrowLeft size={15} /> {t.backToEval}
          </button>
          <a href={lang === "fr"
            ? "https://raw.githubusercontent.com/margauxlebecque3ds-pixel/agent-evaluator/master/10heuritiques.pdf"
            : "https://raw.githubusercontent.com/margauxlebecque3ds-pixel/agent-evaluator/master/10heuristics.pdf"}
            download className="btn-primary" style={{ borderRadius: 999, padding: "10px 22px", fontSize: "0.85rem", textDecoration: "none" }}>
            <Download size={15} /> {t.downloadPdf}
          </a>
        </div>

        <header style={{ marginBottom: 40, maxWidth: 700 }}>
          <div className="glass" style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "4px 14px", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--fg2)", marginBottom: 16 }}>
            <FileText size={11} style={{ color: "var(--primary)" }} /> {t.reference}
          </div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{t.heuristicsPageTitle}</h1>
          <p style={{ marginTop: 14, fontSize: "1rem", color: "var(--fg2)", lineHeight: 1.6 }}>{t.heuristicsPageSubtitle}</p>
        </header>

        <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
          {HEURISTICS.map(h => (
            <li key={h.id}
              style={{ position: "relative", overflow: "hidden", borderRadius: 20, padding: "24px 28px", background: "color-mix(in oklab, var(--surface) 60%, transparent)", border: "1px solid var(--border)", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "color-mix(in oklab, var(--primary) 40%, transparent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              <span style={{ position: "absolute", right: -8, top: -16, fontSize: 120, fontWeight: 700, color: "color-mix(in oklab, var(--primary) 7%, transparent)", lineHeight: 1, pointerEvents: "none", userSelect: "none", fontStyle: "italic" }}>
                {String(h.id).padStart(2, "0")}
              </span>
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--primary)", fontFamily: "monospace" }}>{String(h.id).padStart(2, "0")}</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
                <h2 style={{ fontSize: "clamp(1.2rem,2.5vw,1.6rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>{h.title[lang]}</h2>
                <p style={{ fontSize: "0.88rem", color: "var(--fg2)", lineHeight: 1.6, marginBottom: 14, maxWidth: 700 }}>{h.summary[lang]}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                  {h.bullets[lang].map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "color-mix(in oklab, var(--surface) 40%, transparent)", fontSize: "0.8rem", lineHeight: 1.5, color: "var(--fg2)" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--primary)", opacity: 0.7, flexShrink: 0, marginTop: 6 }} />
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <footer style={{ marginTop: 80, paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center", fontSize: "0.72rem", color: "var(--fg2)" }}>
          eval.ai · internal tool · Dassault Systèmes · Margaux Lebecque
        </footer>
      </main>
    </div>
  )
}