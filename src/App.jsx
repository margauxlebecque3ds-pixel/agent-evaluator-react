import { useState, useEffect } from "react"
import { evaluateSingle, evaluateMulti } from "./api"
import { dict } from "./i18n"
import { globalStyles } from "./styles"
import HomePage from "./components/HomePage"
import HeuristicsPage from "./components/HeuristicsPage"
import Sidebar from "./components/Sidebar"

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("eval-lang") || "en")
  const [theme, setTheme] = useState(() => localStorage.getItem("eval-theme") || "dark")
  const [page, setPage] = useState("home")
  const [mode, setMode] = useState("single")
  const [userQuestion, setUserQuestion] = useState("")
  const [leoResponse, setLeoResponse] = useState("")
  const [conversation, setConversation] = useState("")
  const [comment, setComment] = useState("")
  const [showComment, setShowComment] = useState(false)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
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

  const reset = () => {
    setResult(null); setError(null); setUserQuestion(""); setLeoResponse("")
    setConversation(""); setComment(""); setShowComment(false); setImages([])
  }

  const run = async () => {
    setError(null)
    if (mode === "single" && (!userQuestion.trim() || !leoResponse.trim())) { alert(t.requiredFields); return }
    if (mode === "multi" && !conversation.trim()) { alert(t.requiredFields); return }
    setLoading(true)
    try {
      const r = mode === "single"
        ? await evaluateSingle({ userQuestion, leoResponse, comment: comment || undefined, images })
        : await evaluateMulti({ conversation, comment: comment || undefined, images })
      setResult(r)
      const newEntry = {
        id: Date.now(),
        name: null,
        date: new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        mode,
        avgScore: (() => {
          const scores = Object.values(r.evaluation || {}).map(v => v.score).filter(s => s !== null && s !== undefined)
          return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
        })(),
        result: r,
      }
      setHistory(prev => {
        const updated = [newEntry, ...prev].slice(0, 10)
        localStorage.setItem("eval-history", JSON.stringify(updated))
        return updated
      })
      setActiveHistoryId(newEntry.id)
      setSidebarOpen(true)
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }

  const sidebarProps = {
    t, isDark,
    open: sidebarOpen,
    onToggle: () => setSidebarOpen(v => !v),
    onClose: () => setSidebarOpen(false),
    history, setHistory,
    activeHistoryId, setActiveHistoryId,
    editingId, setEditingId,
    editingName, setEditingName,
    onNew: () => { reset(); setSidebarOpen(false) },
    onLoad: (entry) => { setResult(entry.result); setActiveHistoryId(entry.id); setSidebarOpen(false); setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100) },
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
              userQuestion={userQuestion} setUserQuestion={setUserQuestion}
              leoResponse={leoResponse} setLeoResponse={setLeoResponse}
              conversation={conversation} setConversation={setConversation}
              comment={comment} setComment={setComment}
              showComment={showComment} setShowComment={setShowComment}
              images={images} setImages={setImages}
              loading={loading} result={result} setResult={setResult} error={error}
              run={run} reset={reset}
            />
        }
      </div>
    </>
  )
}