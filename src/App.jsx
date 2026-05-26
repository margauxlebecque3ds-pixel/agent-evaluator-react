import { useState, useEffect } from "react"
import { evaluateSingle, evaluateMulti } from "./api"
import { dict } from "./i18n"
import { globalStyles } from "./styles"
import HomePage from "./components/HomePage"
import HeuristicsPage from "./components/HeuristicsPage"
import Sidebar from "./components/Sidebar"

const ALL_HEURISTICS = [
  "request_adequacy",
  "transparency_of_reasoning",
  "contextual_relevance",
  "human_controllability",
  "cognitive_load_reduction",
  "reliability_and_anticipation",
  "task_segmentation",
  "interface_and_3d_model_relationship",
  "interoperability",
  "consistency_over_time",
]

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("eval-lang") || "en")
  const [theme, setTheme] = useState(() => localStorage.getItem("eval-theme") || "dark")
  const [page, setPage] = useState("home")
  const [mode, setMode] = useState("single")
  const [evalMode, setEvalMode] = useState("standard") // "standard" | "focus"
  const [selectedHeuristics, setSelectedHeuristics] = useState(ALL_HEURISTICS)
  const [userQuestion, setUserQuestion] = useState("")
  const [leoResponse, setLeoResponse] = useState("")
  const [conversation, setConversation] = useState("")
  const [comment, setComment] = useState("")
  const [showComment, setShowComment] = useState(false)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [runningId, setRunningId] = useState(null)
  const [resultBoth, setResultBoth] = useState(null)
  const [error, setError] = useState(null)
  const [disclaimerClosed, setDisclaimerClosed] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("eval-api-key") || "")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("eval-history") || "[]") } catch { return [] }
  })
  const [activeHistoryId, setActiveHistoryId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState("")

  const t = dict[lang]
  const isDark = theme === "dark"
  const result = resultBoth ? (resultBoth[lang] || resultBoth["en"]) : null

  useEffect(() => { localStorage.setItem("eval-lang", lang) }, [lang])
  useEffect(() => { localStorage.setItem("eval-api-key", apiKey) }, [apiKey])
  useEffect(() => {
    localStorage.setItem("eval-theme", theme)
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const changeLang = (l) => { setLang(l); localStorage.setItem("eval-lang", l) }
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark")
  const closeDisclaimer = () => { setDisclaimerClosed(true); localStorage.setItem("eval-disclaimer", "1") }
  const openDisclaimer = () => { setDisclaimerClosed(false); localStorage.removeItem("eval-disclaimer") }

  const toggleHeuristic = (key) => {
    setSelectedHeuristics(prev =>
      prev.includes(key)
        ? prev.filter(h => h !== key)
        : [...prev, key]
    )
  }

  const reset = () => {
    setResultBoth(null); setError(null); setUserQuestion(""); setLeoResponse("")
    setConversation(""); setComment(""); setShowComment(false); setImages([])
    setActiveHistoryId(null)
  }

  const activeHeuristics = evalMode === "standard" ? ALL_HEURISTICS : selectedHeuristics

  const run = async () => {
    setError(null)
    if (mode === "single" && (!userQuestion.trim() || !leoResponse.trim())) { alert(t.requiredFields); return }
    if (mode === "multi" && !conversation.trim()) { alert(t.requiredFields); return }
    if (evalMode === "focus" && selectedHeuristics.length === 0) { alert("Please select at least one heuristic."); return }

    const entryId = Date.now()
    const newEntry = {
      id: entryId,
      name: null,
      date: new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      mode,
      evalMode,
      loading: true,
      avgScore: null,
      resultBoth: null,
      inputs: { userQuestion, leoResponse, conversation },
    }

    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 10)
      localStorage.setItem("eval-history", JSON.stringify(updated))
      return updated
    })
    setActiveHistoryId(entryId)
    setRunningId(entryId)
    setSidebarOpen(true)
    setLoading(true)
    setResultBoth(null)

    try {
      const [rEn, rFr] = await Promise.all([
        mode === "single"
          ? evaluateSingle({ userQuestion, leoResponse, comment: comment || undefined, images, language: "en", activeHeuristics })
          : evaluateMulti({ conversation, comment: comment || undefined, images, language: "en", activeHeuristics }),
        mode === "single"
          ? evaluateSingle({ userQuestion, leoResponse, comment: comment || undefined, images, language: "fr", activeHeuristics })
          : evaluateMulti({ conversation, comment: comment || undefined, images, language: "fr", activeHeuristics }),
      ])

      const both = { en: rEn, fr: rFr }

      const avgScore = (() => {
        const scores = (rEn.criteria || []).map(c => c.score).filter(s => s !== null && s !== undefined)
        return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
      })()

      setHistory(prev => {
        const updated = prev.map(h => h.id === entryId ? { ...h, loading: false, resultBoth: both, avgScore } : h)
        localStorage.setItem("eval-history", JSON.stringify(updated))
        return updated
      })

      setActiveHistoryId(cur => {
        if (cur === entryId) {
          setResultBoth(both)
          setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100)
        }
        return cur
      })

    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setHistory(prev => {
        const updated = prev.map(h => h.id === entryId ? { ...h, loading: false } : h)
        localStorage.setItem("eval-history", JSON.stringify(updated))
        return updated
      })
    } finally {
      setLoading(false)
      setRunningId(null)
    }
  }

  const isViewingRunning = activeHistoryId === runningId && loading

  const sidebarProps = {
    t, isDark,
    open: sidebarOpen,
    onToggle: () => setSidebarOpen(v => !v),
    onClose: () => setSidebarOpen(false),
    history, setHistory,
    activeHistoryId, setActiveHistoryId,
    editingId, setEditingId,
    editingName, setEditingName,
    runningId,
    onNew: () => { reset(); setSidebarOpen(false) },
    onLoad: (entry) => {
      setActiveHistoryId(entry.id)
      if (entry.inputs) {
        setMode(entry.mode || "single")
        setUserQuestion(entry.inputs.userQuestion || "")
        setLeoResponse(entry.inputs.leoResponse || "")
        setConversation(entry.inputs.conversation || "")
      }
      setResultBoth(entry.resultBoth || null)
      setSidebarOpen(false)
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100)
    },
  }

  return (
    <>
      <style>{globalStyles}</style>
      <Sidebar {...sidebarProps} />
      <div style={{
        marginLeft: sidebarOpen ? 280 : 40,
        transition: "margin-left 0.25s ease",
        minHeight: "100vh",
      }}>
        {page === "heuristics"
          ? <HeuristicsPage t={t} lang={lang} changeLang={changeLang} theme={theme} toggleTheme={toggleTheme} isDark={isDark} setPage={setPage} />
          : <HomePage
              t={t} lang={lang} changeLang={changeLang} theme={theme} toggleTheme={toggleTheme} isDark={isDark}
              disclaimerClosed={disclaimerClosed} closeDisclaimer={closeDisclaimer} openDisclaimer={openDisclaimer}
              setPage={setPage}
              apiKey={apiKey} setApiKey={setApiKey}
              open={sidebarOpen}
              mode={mode} setMode={setMode}
              evalMode={evalMode} setEvalMode={setEvalMode}
              selectedHeuristics={selectedHeuristics} toggleHeuristic={toggleHeuristic}
              allHeuristics={ALL_HEURISTICS}
              userQuestion={userQuestion} setUserQuestion={setUserQuestion}
              leoResponse={leoResponse} setLeoResponse={setLeoResponse}
              conversation={conversation} setConversation={setConversation}
              comment={comment} setComment={setComment}
              showComment={showComment} setShowComment={setShowComment}
              images={images} setImages={setImages}
              loading={isViewingRunning}
              result={result} setResult={() => {}} error={error}
              run={run} reset={reset}
            />
        }
      </div>
    </>
  )
}