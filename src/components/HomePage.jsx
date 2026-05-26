import { useRef } from "react"
import {
  MessageSquare, MessagesSquare, Play, Loader2, RotateCcw,
  Download, Sparkles, AlertTriangle, ArrowUpRight, ChevronDown, ChevronUp
} from "lucide-react"
import { useState } from "react"
import { exportEvaluationToExcel } from "../export"
import { scoreMeta } from "../heuristics"
import Disclaimer from "./Disclaimer"
import TopControls from "./TopControls"
import VCLogos from "./VCLogos"
import Toolbar from "./Toolbar"
import CommentBox from "./CommentBox"
import Tooltip from "./Tooltip"
import { FieldLabel, ResultSection, AttachList } from "./ui"

const HEURISTIC_LABELS = {
  en: {
    request_adequacy: "H1 — Request Adequacy",
    transparency_of_reasoning: "H2 — Transparency of Reasoning",
    contextual_relevance: "H3 — Contextual Relevance",
    human_controllability: "H4 — Human Controllability",
    cognitive_load_reduction: "H5 — Cognitive Load Reduction",
    reliability_and_anticipation: "H6 — Reliability & Anticipation",
    task_segmentation: "H7 — Task Segmentation",
    interface_and_3d_model_relationship: "H8 — Interface & 3D Model",
    interoperability: "H9 — Interoperability",
    consistency_over_time: "H10 — Consistency Over Time",
  },
  fr: {
    request_adequacy: "H1 — Adéquation de la requête",
    transparency_of_reasoning: "H2 — Transparence du raisonnement",
    contextual_relevance: "H3 — Pertinence contextuelle",
    human_controllability: "H4 — Contrôlabilité humaine",
    cognitive_load_reduction: "H5 — Réduction de la charge cognitive",
    reliability_and_anticipation: "H6 — Fiabilité & Anticipation",
    task_segmentation: "H7 — Segmentation des actions",
    interface_and_3d_model_relationship: "H8 — Interface & Modèle 3D",
    interoperability: "H9 — Interopérabilité",
    consistency_over_time: "H10 — Cohérence dans le temps",
  }
}

export default function HomePage({
  t, lang, changeLang, theme, toggleTheme, isDark,
  disclaimerClosed, closeDisclaimer, openDisclaimer,
  setPage, mode, setMode,
  evalMode, setEvalMode,
  selectedHeuristics, toggleHeuristic, allHeuristics,
  userQuestion, setUserQuestion,
  leoResponse, setLeoResponse,
  conversation, setConversation,
  comment, setComment,
  showComment, setShowComment,
  images, setImages,
  loading, result, setResult, error,
  run, reset,
  apiKey, setApiKey,
}) {
  const fileRef = useRef(null)
  const [focusOpen, setFocusOpen] = useState(false)
  const addImages = (files) => setImages(prev => [...prev, ...Array.from(files).filter(f => f.type.startsWith("image/"))])
  const labels = HEURISTIC_LABELS[lang] || HEURISTIC_LABELS.en

  return (
    <div style={{ minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ padding: "20px 40px 0" }}>
        <Disclaimer t={t} closed={disclaimerClosed} onClose={closeDisclaimer} onOpen={openDisclaimer} />
      </div>

      <main style={{ padding: "24px 40px 80px" }}>

        {/* Hero */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                <h1 style={{ fontSize: "clamp(1.2rem,2.5vw,1.6rem)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.04em" }}>
                  {t.heroTitle}
                </h1>
                <VCLogos />
              </div>
              <p style={{ color: "var(--fg2)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 16 }}>
                {lang === "en"
                  ? "This tool gives you an initial UX perspective on your AI agent's responses — evaluating clarity, relevance, transparency, and more across 10 structured heuristics."
                  : "Cet outil vous permet d'obtenir un premier retour UX sur les réponses de votre agent IA — en évaluant la clarté, la pertinence, la transparence et bien plus, selon 10 heuristiques structurées."}
              </p>
              <button onClick={() => setPage("heuristics")}
                style={{ borderRadius: 999, padding: "9px 20px", fontSize: "0.82rem", fontWeight: 600, border: "1.5px solid rgba(59,130,246,0.7)", background: "rgba(59,130,246,0.12)", color: "rgba(59,130,246,1)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.2)"; e.currentTarget.style.borderColor = "rgba(59,130,246,1)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,0.12)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.7)" }}>
                {t.seeHeuristics} <ArrowUpRight size={14} />
              </button>
            </div>
            <div style={{ flexShrink: 0, paddingTop: 4 }}>
              <TopControls t={t} lang={lang} changeLang={changeLang} theme={theme} toggleTheme={toggleTheme} isDark={isDark} />
            </div>
          </div>
        </section>

        {/* API Key */}
        <div style={{ marginBottom: 24, maxWidth: 420 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--fg2)" }}>{t.apiKeyLabel}</label>
            <Tooltip text={t.apiKeyTooltip} />
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={t.apiKeyPlaceholder}
            style={{ width: "100%", background: "color-mix(in oklab, var(--surface-el) 75%, transparent)", backdropFilter: "blur(24px) saturate(160%)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 16px", color: "white", fontSize: "0.9rem", outline: "none", fontFamily: "monospace", transition: "border-color 0.15s, box-shadow 0.15s" }}
            onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px color-mix(in oklab, var(--primary) 18%, transparent)" }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none" }}
          />
        </div>

        {/* Mode switch */}
        <div style={{ marginBottom: 16 }}>
          <div className="glass" style={{ display: "inline-flex", borderRadius: 999, padding: 4, gap: 4 }}>
            {[["single", MessageSquare, t.modeSingle], ["multi", MessagesSquare, t.modeMulti]].map(([m, Icon, label]) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => { setMode(m); reset() }} style={{
                  borderRadius: 999, padding: "8px 20px", fontSize: "0.85rem", fontWeight: 500,
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit",
                  background: mode === m ? "var(--primary)" : "transparent",
                  color: mode === m ? "white" : "var(--fg2)",
                  boxShadow: mode === m ? "0 4px 14px color-mix(in oklab, var(--primary) 40%, transparent)" : "none",
                  transition: "all 0.2s",
                }}>
                  <Icon size={15} /> {label}
                </button>
                <Tooltip text={m === "single" ? t.modeSingleTooltip : t.modeMultiTooltip} />
              </div>
            ))}
          </div>
        </div>

        {/* Eval mode — Standard / Focus */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fg2)" }}>
              {lang === "en" ? "Evaluation mode" : "Mode d'évaluation"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["standard", lang === "en" ? "Standard — all 10 heuristics" : "Standard — 10 heuristiques"], ["focus", lang === "en" ? "Focus — custom selection" : "Focus — sélection personnalisée"]].map(([em, label]) => (
              <button key={em} onClick={() => { setEvalMode(em); if (em === "focus") setFocusOpen(true) }}
                style={{
                  borderRadius: 999, padding: "7px 16px", fontSize: "0.82rem", fontWeight: 500,
                  border: `1.5px solid ${evalMode === em ? "var(--primary)" : "var(--border)"}`,
                  background: evalMode === em ? "color-mix(in oklab, var(--primary) 12%, transparent)" : "transparent",
                  color: evalMode === em ? "var(--primary)" : "var(--fg2)",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Focus panel — dropdown checkboxes */}
          {evalMode === "focus" && (
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setFocusOpen(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--fg2)", fontSize: "0.78rem", fontFamily: "inherit", padding: 0, marginBottom: 8 }}>
                {focusOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {lang === "en"
                  ? `${selectedHeuristics.length} heuristic${selectedHeuristics.length > 1 ? "s" : ""} selected`
                  : `${selectedHeuristics.length} heuristique${selectedHeuristics.length > 1 ? "s" : ""} sélectionnée${selectedHeuristics.length > 1 ? "s" : ""}`}
              </button>

              {focusOpen && (
                <div className="glass" style={{ borderRadius: 14, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", maxWidth: 640 }}>
                  {allHeuristics.map(key => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                      <input
                        type="checkbox"
                        checked={selectedHeuristics.includes(key)}
                        onChange={() => toggleHeuristic(key)}
                        style={{ accentColor: "var(--primary)", width: 14, height: 14, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "0.82rem", color: selectedHeuristics.includes(key) ? "var(--fg)" : "var(--fg2)", fontWeight: selectedHeuristics.includes(key) ? 500 : 400 }}>
                        {labels[key]}
                      </span>
                    </label>
                  ))}
                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => allHeuristics.forEach(k => !selectedHeuristics.includes(k) && toggleHeuristic(k))}
                      style={{ fontSize: "0.72rem", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                      {lang === "en" ? "Select all" : "Tout sélectionner"}
                    </button>
                    <span style={{ color: "var(--border)" }}>·</span>
                    <button onClick={() => allHeuristics.forEach(k => selectedHeuristics.includes(k) && toggleHeuristic(k))}
                      style={{ fontSize: "0.72rem", color: "var(--fg2)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                      {lang === "en" ? "Clear all" : "Tout décocher"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form card */}
        <div className="glass-strong" style={{ borderRadius: 24, padding: 28 }}>
          {mode === "single" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <FieldLabel label={t.userQuestion}>
                <textarea value={userQuestion} onChange={e => setUserQuestion(e.target.value)} placeholder={t.userQuestionPlaceholder} rows={1} className="textarea-base" style={{ minHeight: 48 }} />
              </FieldLabel>
              <FieldLabel label={t.leoResponse}>
                <textarea value={leoResponse} onChange={e => setLeoResponse(e.target.value)} placeholder={t.leoResponsePlaceholder} rows={6} className="textarea-base" />
                <Toolbar t={t} showComment={showComment} setShowComment={setShowComment} comment={comment} images={images} fileRef={fileRef} addImages={addImages} />
                {(showComment || comment) && <CommentBox t={t} value={comment} onChange={setComment} />}
                {images.length > 0 && <AttachList files={images} setFiles={setImages} />}
              </FieldLabel>
            </div>
          ) : (
            <FieldLabel label={t.fullConversation}>
              <textarea value={conversation} onChange={e => setConversation(e.target.value)} placeholder={t.fullConversationPlaceholder} rows={10} className="textarea-base" style={{ fontFamily: "monospace", fontSize: "0.82rem" }} />
              <Toolbar t={t} showComment={showComment} setShowComment={setShowComment} comment={comment} images={images} fileRef={fileRef} addImages={addImages} />
              {(showComment || comment) && <CommentBox t={t} value={comment} onChange={setComment} />}
              {images.length > 0 && <AttachList files={images} setFiles={setImages} />}
            </FieldLabel>
          )}

          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => e.target.files && addImages(e.target.files)} />

          {/* Run row */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            {(result || error) ? (
              <button onClick={reset} className="btn-ghost" style={{ borderRadius: 999, padding: "8px 18px", fontSize: "0.82rem" }}>
                <RotateCcw size={14} /> {t.newEvaluation}
              </button>
            ) : <span />}
            <button onClick={run} disabled={loading} className="btn-primary" style={{ borderRadius: 999, padding: "12px 32px", fontSize: "0.9rem" }}>
              {loading
                ? <><Loader2 size={16} className="spin" /> {t.evaluating}</>
                : <><Play size={15} style={{ fill: "currentColor" }} /> {t.runEvaluation}</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="fade-up" style={{ marginTop: 20, borderRadius: 16, padding: 16, background: "color-mix(in oklab, var(--danger) 12%, transparent)", border: "1px solid color-mix(in oklab, var(--danger) 40%, transparent)", display: "flex", gap: 12 }}>
            <AlertTriangle size={18} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, color: "var(--danger)", marginBottom: 4 }}>{t.errorTitle}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--fg2)" }}>{t.errorBody}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--fg2)", marginTop: 6 }}>{error}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <section id="results" className="fade-up" style={{ marginTop: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, letterSpacing: "-0.025em" }}>{t.results}</h2>
              <button onClick={() => exportEvaluationToExcel(result)} className="btn-ghost" style={{ borderRadius: 999, padding: "8px 18px", fontSize: "0.82rem" }}>
                <Download size={14} /> {t.exportExcel}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 12 }}>
              {result.criteria.map((c, i) => {
                const meta = scoreMeta(c.score)
                return (
                  <div key={i} style={{ borderRadius: 16, padding: "20px 24px", background: "color-mix(in oklab, var(--surface) 60%, transparent)", border: "1px solid var(--border)", borderLeft: `4px solid ${meta.border}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                      <h3 style={{ fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.3 }}>
                        {c.criterion.replace(/_/g, " ").replace(/\b\w/g, ch => ch.toUpperCase())}
                      </h3>
                      <div style={{ background: meta.bg, color: meta.color, borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0, display: "flex", alignItems: "baseline", gap: 2 }}>
                        {c.score !== null && c.score !== undefined ? c.score : "N/A"}
                        {c.score !== null && c.score !== undefined && <span style={{ fontSize: "0.62rem", opacity: 0.6 }}>/5</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {c.justification && <ResultSection label={t.justification} body={c.justification} />}
                      {c.advice && <ResultSection label={t.advice} body={c.advice} highlight />}
                    </div>
                  </div>
                )
              })}
            </div>

            {result.global_suggestions && (
              <div style={{ marginTop: 20, borderRadius: 20, padding: 24, background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 14%, transparent), transparent)", border: "1px solid color-mix(in oklab, var(--primary) 35%, transparent)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Sparkles size={16} style={{ color: "var(--primary)" }} />
                  <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>{t.globalSuggestions}</h3>
                </div>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "var(--fg2)", whiteSpace: "pre-wrap" }}>{result.global_suggestions}</p>
              </div>
            )}
          </section>
        )}

        <footer style={{ marginTop: 80, paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center", fontSize: "0.72rem", color: "var(--fg2)" }}>
          eval.ai · internal tool · Dassault Systèmes
        </footer>
      </main>
    </div>
  )
}