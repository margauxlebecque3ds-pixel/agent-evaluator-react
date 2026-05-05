import { X, Plus, Pencil, Trash2, PanelLeft } from "lucide-react"

export default function Sidebar({ t, open, onToggle, onClose, history, setHistory, activeHistoryId, setActiveHistoryId, editingId, setEditingId, editingName, setEditingName, onNew, onLoad, isDark }) {
  const deleteEntry = (id) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    localStorage.setItem("eval-history", JSON.stringify(updated))
    if (activeHistoryId === id) setActiveHistoryId(null)
  }

  const saveRename = (id) => {
    const updated = history.map(h => h.id === id ? { ...h, name: editingName || h.name } : h)
    setHistory(updated)
    localStorage.setItem("eval-history", JSON.stringify(updated))
    setEditingId(null)
    setEditingName("")
  }

  const scoreColor = (score) => {
    if (!score) return "var(--neutral)"
    if (score >= 4) return "var(--success)"
    if (score >= 2.5) return "var(--warning)"
    return "var(--danger)"
  }

  const railBg = isDark ? "oklch(0.11 0.025 260)" : "oklch(0.97 0.008 260)"
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"

  return (
    <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40, display: "flex" }}>

      {/* Rail — toujours visible */}
      <div style={{
        width: 40, flexShrink: 0,
        background: railBg,
        borderRight: `1px solid ${borderColor}`,
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 20, gap: 8,
      }}>
        <button onClick={onToggle} style={{
          background: "none", border: "none", cursor: "pointer",
          color: open ? "var(--primary)" : "var(--fg2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 6,
          transition: "color 0.15s, background 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "color-mix(in oklab, var(--primary) 10%, transparent)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <PanelLeft size={16} />
        </button>
      </div>

      {/* Panel sliding */}
      <div style={{
        width: open ? 240 : 0,
        overflow: "hidden",
        transition: "width 0.25s ease",
        background: railBg,
        borderRight: open ? `1px solid ${borderColor}` : "none",
      }}>
        <div style={{ width: 240, padding: "20px 16px 16px", display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fg2)" }}>{t.historyTitle}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg2)", display: "flex", padding: 4, borderRadius: 6 }}>
              <X size={14} />
            </button>
          </div>

          {/* New evaluation */}
          <button onClick={onNew} style={{ width: "100%", borderRadius: 8, padding: "8px 12px", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontFamily: "inherit" }}>
            <Plus size={13} /> {t.newEvaluation}
          </button>

          {/* History list */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--fg2)", fontSize: "0.78rem", marginTop: 32, opacity: 0.6 }}>
                {t.noEvalYet}
              </div>
            ) : (
              history.map((entry, i) => (
                <div key={entry.id} onClick={() => { onLoad(entry); setActiveHistoryId(entry.id) }}
                  style={{ borderRadius: 8, padding: "8px 10px", cursor: "pointer", background: activeHistoryId === entry.id ? "color-mix(in oklab, var(--primary) 15%, transparent)" : "transparent", border: activeHistoryId === entry.id ? "1px solid color-mix(in oklab, var(--primary) 40%, transparent)" : "1px solid transparent", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (activeHistoryId !== entry.id) e.currentTarget.style.background = "color-mix(in oklab, var(--fg) 5%, transparent)" }}
                  onMouseLeave={e => { if (activeHistoryId !== entry.id) e.currentTarget.style.background = "transparent" }}>
                  {editingId === entry.id ? (
                    <input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => saveRename(entry.id)}
                      onKeyDown={e => e.key === "Enter" && saveRename(entry.id)}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      style={{ width: "100%", background: "var(--surface-el)", border: "1px solid var(--primary)", borderRadius: 4, padding: "2px 6px", color: "var(--fg)", fontSize: "0.78rem", fontFamily: "inherit", outline: "none" }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.name || `Test ${history.length - i}`}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--fg2)" }}>{entry.date}</span>
                          <span style={{ fontSize: "0.62rem", background: "color-mix(in oklab, var(--primary) 15%, transparent)", color: "var(--primary)", borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>
                            {entry.mode === "single" ? t.singleBadge : t.multiBadge}
                          </span>
                          {entry.avgScore && (
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: scoreColor(parseFloat(entry.avgScore)) }}>
                              {entry.avgScore}/5
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditingId(entry.id); setEditingName(entry.name || `Test ${history.length - i}`) }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg2)", padding: 3, borderRadius: 4, display: "flex" }}
                          title={t.renameEval}>
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => deleteEntry(entry.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 3, borderRadius: 4, display: "flex" }}
                          title={t.deleteEval}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}