import { MessageSquarePlus, Paperclip } from "lucide-react"

export default function Toolbar({ t, showComment, setShowComment, comment, images, fileRef, addImages }) {
  return (
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      <button type="button" onClick={() => setShowComment(v => !v)} className={`toolbar-btn ${showComment || comment ? "active" : ""}`}>
        <MessageSquarePlus size={14} /> {t.addComment}
        {comment && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }} />}
      </button>
      <button type="button" onClick={() => fileRef.current?.click()} className="toolbar-btn">
        <Paperclip size={14} /> {t.attach}
        {images.length > 0 && (
          <span style={{ background: "color-mix(in oklab, var(--primary) 20%, transparent)", color: "var(--primary)", borderRadius: 999, padding: "1px 6px", fontSize: "0.68rem", fontWeight: 700 }}>
            {images.length}
          </span>
        )}
      </button>
      <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--fg2)", opacity: 0.6 }}>{t.optionalHelp}</span>
    </div>
  )
}