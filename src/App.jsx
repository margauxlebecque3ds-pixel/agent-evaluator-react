import { useState, useEffect, useRef } from "react"
import {
  Info, X, Languages, ChevronDown, Check, Sun, Moon,
  MessageSquare, MessagesSquare, MessageSquarePlus, Paperclip,
  Play, Loader2, RotateCcw, Download, Sparkles, AlertTriangle,
  ArrowUpRight, ArrowLeft, FileText
} from "lucide-react"
import { evaluateSingle, evaluateMulti } from "./api"
import { exportEvaluationToExcel } from "./export"

// ── i18n ──────────────────────────────────────────────────────────────────────
const dict = {
  en: {
    heroTitle: "Evaluate LEO's responses",
    heroSubtitle: "The virtual companion by Dassault Systèmes — UX Heuristics Evaluation for AI Agents",
    seeHeuristics: "See the heuristics list",
    backToEval: "Back to evaluation",
    downloadPdf: "Download PDF",
    heuristicsPageTitle: "The 10 UX heuristics for AI agents",
    heuristicsPageSubtitle: "Adapted from Nielsen (1994) for AI companions in industrial CAD/simulation software.",
    modeSingle: "Single exchange",
    modeMulti: "Full conversation",
    userQuestion: "User question",
    userQuestionPlaceholder: "What did the user ask LEO?",
    leoResponse: "Agent's answer",
    leoResponsePlaceholder: "Paste LEO's response here…",
    fullConversation: "Full conversation",
    fullConversationPlaceholder: "Paste the entire conversation with timestamps…\n\n[10:32] User: How do I refine the mesh?\n[10:32] LEO: You can refine the mesh by…",
    optionalHelp: "Optional — add context to improve the evaluation",
    addComment: "Add comment",
    commentPlaceholder: "e.g. LEO highlighted the mesh zone in red",
    attach: "Attach screenshots",
    runEvaluation: "Run evaluation",
    evaluating: "Evaluating…",
    results: "Evaluation results",
    globalSuggestions: "Global suggestions",
    exportExcel: "Export to Excel",
    observed: "Observed elements",
    justification: "Justification",
    advice: "Improvement advice",
    naLabel: "N/A",
    errorTitle: "Evaluation failed",
    errorBody: "Could not reach the backend at http://127.0.0.1:8000. Make sure the FastAPI server is running.",
    requiredFields: "Please fill in the required fields.",
    newEvaluation: "New evaluation",
    aboutTitle: "About this tool",
    aboutBody: "Work in progress by Margaux Lebecque. This internal tool helps Dassault Systèmes developers evaluate LEO against 10 UX heuristics inspired by Nielsen (1994), adapted for AI agents in complex industrial software.",
    disclaimerCta: "Got it",
    aboutShort: "About",
    themeToggle: "Toggle theme",
    reference: "Reference · Margaux Lebecque",
    apiKeyLabel: "Mistral API Key",
    apiKeyPlaceholder: "sk-…",
    apiKeyHint: "Optional — uses server key by default",
    apiKeyTooltip: "Paste your Mistral API key here. ⚠️ Only works with Mistral keys (console.mistral.ai). If empty, the default server key is used.",
    modeSingleTooltip: "You have one question and one LEO response — use this mode.",
    modeMultiTooltip: "You have a full conversation with multiple exchanges — copy/paste it entirely here.",
    saveComment: "Save",
    editComment: "Edit comment",
  },
  fr: {
    heroTitle: "Évaluez les réponses de LEO",
    heroSubtitle: "Le compagnon virtuel de Dassault Systèmes — Évaluation des heuristiques UX pour agents IA",
    seeHeuristics: "Voir la liste des heuristiques",
    backToEval: "Retour à l'évaluation",
    downloadPdf: "Télécharger le PDF",
    heuristicsPageTitle: "Les 10 heuristiques UX pour agents IA",
    heuristicsPageSubtitle: "Adaptées de Nielsen (1994) pour les compagnons IA dans les logiciels CAO / simulation.",
    modeSingle: "Échange unique",
    modeMulti: "Conversation complète",
    userQuestion: "Question utilisateur",
    userQuestionPlaceholder: "Qu'a demandé l'utilisateur à LEO ?",
    leoResponse: "Réponse de l'agent",
    leoResponsePlaceholder: "Collez la réponse de LEO ici…",
    fullConversation: "Conversation complète",
    fullConversationPlaceholder: "Collez la conversation entière avec horodatage…\n\n[10:32] Utilisateur : Comment raffiner le maillage ?\n[10:32] LEO : Vous pouvez raffiner le maillage en…",
    optionalHelp: "Optionnel — ajoutez du contexte pour améliorer l'évaluation",
    addComment: "Ajouter un commentaire",
    commentPlaceholder: "ex. LEO a mis en surbrillance la zone de maillage en rouge",
    attach: "Joindre des captures",
    runEvaluation: "Lancer l'évaluation",
    evaluating: "Évaluation en cours…",
    results: "Résultats de l'évaluation",
    globalSuggestions: "Suggestions globales",
    exportExcel: "Exporter en Excel",
    observed: "Éléments observés",
    justification: "Justification",
    advice: "Conseil d'amélioration",
    naLabel: "N/A",
    errorTitle: "Échec de l'évaluation",
    errorBody: "Impossible de joindre le backend à http://127.0.0.1:8000. Vérifiez que le serveur FastAPI est démarré.",
    requiredFields: "Veuillez remplir les champs requis.",
    newEvaluation: "Nouvelle évaluation",
    aboutTitle: "À propos de cet outil",
    aboutBody: "Travail en cours par Margaux Lebecque. Cet outil interne aide les développeurs de Dassault Systèmes à évaluer LEO selon 10 heuristiques UX inspirées de Nielsen (1994), adaptées aux agents IA dans les logiciels industriels complexes.",
    disclaimerCta: "Compris",
    aboutShort: "À propos",
    themeToggle: "Changer de thème",
    reference: "Référence · Margaux Lebecque",
    apiKeyLabel: "Clé API Mistral",
    apiKeyPlaceholder: "sk-…",
    apiKeyHint: "Optionnel — utilise la clé serveur par défaut",
    saveComment: "Enregistrer",
    editComment: "Modifier le commentaire",
    apiKeyTooltip: "Collez votre clé API Mistral ici. ⚠️ Fonctionne uniquement avec les clés Mistral (console.mistral.ai). Si vide, la clé serveur par défaut est utilisée.",
    modeSingleTooltip: "Vous avez une seule question et une réponse de LEO — utilisez ce mode.",
    modeMultiTooltip: "Vous avez une conversation complète avec plusieurs échanges — copiez-collez-la entièrement ici.",
  }
}

const HEURISTICS = [
  { id: 1, title: { en: "Request adequacy", fr: "Adéquation de la requête" }, summary: { en: "Did the agent grasp the intent and adopt the expected response structure?", fr: "L'agent a-t-il saisi l'intention et adopté la structure de réponse attendue ?" }, bullets: { en: ["Does the answer follow the expected format?", "Does the agent avoid off-topic answers?", "Does it fully cover the request?", "Is key info immediately readable?"], fr: ["La réponse respecte-t-elle le format attendu ?", "L'agent évite-t-il les réponses hors sujet ?", "La réponse couvre-t-elle l'intégralité de la demande ?", "La structure facilite-t-elle la lecture immédiate ?"] } },
  { id: 2, title: { en: 'Reasoning transparency ("Why")', fr: "Transparence du raisonnement (« Pourquoi »)" }, summary: { en: "The AI must show its thinking steps. Users should not have to take its word for it.", fr: "L'IA doit montrer ses étapes de pensée. L'utilisateur ne doit pas avoir à croire l'agent sur parole." }, bullets: { en: ["Does it explain why it proposes this action?", "Does it surface its sources or assumptions?", "Can the user trace a recommendation to its origin?"], fr: ["L'agent explique-t-il pourquoi il propose cette action ?", "Rend-il visibles ses sources ou hypothèses ?", "L'utilisateur peut-il retracer l'origine d'une recommandation ?"] } },
  { id: 3, title: { en: 'Contextual relevance ("Where")', fr: "Pertinence contextuelle (« Où »)" }, summary: { en: "The AI must know where we are in the workflow and who it's talking to.", fr: "L'IA doit savoir où l'on est dans le workflow et avec qui elle parle." }, bullets: { en: ["Are suggestions adapted to the workflow stage?", "Does it understand the user's role?", "Does it adapt vocabulary to the profile?", "Does it avoid unavailable actions?"], fr: ["Les suggestions sont-elles adaptées à l'étape du workflow ?", "L'agent comprend-il le rôle de l'utilisateur ?", "Adapte-t-il son vocabulaire au profil détecté ?", "Évite-t-il les actions non disponibles ?"] } },
  { id: 4, title: { en: "Human controllability", fr: "Contrôlabilité humaine" }, summary: { en: "The human must be able to modify, refine, undo at any time. The agent assists, it does not decide.", fr: "L'humain doit pouvoir modifier, raffiner, annuler à tout moment. L'agent assiste, ne décide pas." }, bullets: { en: ["Can the user interrupt or hand-edit a suggestion?", "Are these actions easy mid-interaction?", "Is undo reversible with no side-effects?"], fr: ["Possibilité d'interrompre ou modifier une suggestion manuellement ?", "Ces actions sont-elles faciles en cours d'interaction ?", "L'annulation est-elle réversible et sans effet de bord ?"] } },
  { id: 5, title: { en: "Cognitive load reduction", fr: "Réduction de la charge cognitive" }, summary: { en: "The AI must synthesize, not add noise. Too much unsolicited detail is as bad as too little.", fr: "L'IA doit synthétiser, pas ajouter du bruit. Trop de détails non sollicités est aussi mauvais que trop peu." }, bullets: { en: ["Is interacting simpler than classic menus?", "Does it simplify the task?", "Are answers appropriately sized?", "Does it offer summaries for complex answers?"], fr: ["L'interaction est-elle plus simple que les menus classiques ?", "Simplifie-t-elle la tâche ?", "Les réponses sont-elles bien calibrées ?", "Propose-t-elle des résumés pour les réponses complexes ?"] } },
  { id: 6, title: { en: 'Reliability & anticipation ("Safeguards")', fr: "Fiabilité & anticipation (« Garde-fous »)" }, summary: { en: "The agent must own its uncertainty and block impossible or destructive actions.", fr: "L'agent doit avouer ses doutes et bloquer les actions impossibles ou destructrices." }, bullets: { en: ["Does it ask for clarification on ambiguity?", "Does it detect impossible parameters?", "Does it express confidence levels?", "Does it anticipate downstream consequences?"], fr: ["Demande-t-elle clarification en cas d'ambiguïté ?", "Détecte-t-elle les paramètres impossibles ?", "Exprime-t-elle un niveau de confiance ?", "Anticipe-t-elle les conséquences négatives en aval ?"] } },
  { id: 7, title: { en: 'Action segmentation ("How")', fr: "Segmentation des actions (« Comment »)" }, summary: { en: "Break a complex goal into reachable steps, like an expert guiding a peer step by step.", fr: "Décomposer un objectif complexe en étapes atteignables, comme un expert qui guide un collègue." }, bullets: { en: ["Can it break a complex request into sub-steps?", "Are steps coherently ordered?", "Does it indicate links between steps?"], fr: ["Sait-elle segmenter une demande complexe en sous-étapes ?", "Les étapes sont-elles ordonnées de manière cohérente ?", "Indique-t-elle les liens entre les étapes ?"] } },
  { id: 8, title: { en: "Bridge to interface and 3D model", fr: "Relation avec l'interface et le modèle 3D" }, summary: { en: "Bridges between dialogue and direct manipulation: see what's selected, show answers graphically.", fr: "Ponts entre dialogue et manipulation directe : voir ce qui est sélectionné, montrer graphiquement ses réponses." }, bullets: { en: ["Can the user point to a 3D object as the subject?", "Can the AI highlight relevant zones?", "Does it keep dialogue ↔ 3D view in sync?", "Can it generate annotations on the model?"], fr: ["L'utilisateur peut-il désigner un objet 3D comme sujet ?", "L'IA met-elle en évidence les zones importantes ?", "Maintient-elle la synchronisation dialogue ↔ vue 3D ?", "Peut-elle générer des annotations sur le modèle ?"] } },
  { id: 9, title: { en: "Interoperability (access to project data)", fr: "Interopérabilité (accès aux données projet)" }, summary: { en: "The agent must extract and correlate data from CATIA, ENOVIA, material libraries, etc.", fr: "L'agent doit pouvoir extraire et corréler des données venant de CATIA, ENOVIA, librairies matériaux, etc." }, bullets: { en: ["Can it answer using data not in the current interface?", "Does it clearly state which data source it consulted?"], fr: ["Peut-il répondre en utilisant des données absentes de l'interface actuelle ?", "Indique-t-il clairement quelle source de données il a consultée ?"] } },
  { id: 10, title: { en: 'Consistency over time ("Memory")', fr: "Cohérence dans le temps (« Mémoire »)" }, summary: { en: "The AI must remember the engineer's style and decisions taken earlier in the session.", fr: "L'IA doit se souvenir du style de l'ingénieur et des décisions prises plus tôt dans la session." }, bullets: { en: ["Do responses stay consistent across the session?", "Does it remember earlier information?", "Does it flag contradictions with earlier decisions?", "Does it distinguish session vs project memory?"], fr: ["Les réponses restent-elles constantes dans la session ?", "L'agent se rappelle-t-il des informations données plus tôt ?", "Détecte-t-il une contradiction avec une décision prise plus tôt ?", "Distingue-t-il mémoire de session et mémoire projet ?"] } },
]

function scoreMeta(score) {
  if (score === null || score === undefined) return { color: "var(--neutral)", bg: "rgba(148,163,184,0.15)", border: "var(--neutral)" }
  if (score === 5) return { color: "var(--success)", bg: "rgba(52,211,153,0.15)", border: "var(--success)" }
  if (score >= 3) return { color: "var(--warning)", bg: "rgba(251,191,36,0.15)", border: "var(--warning)" }
  return { color: "var(--danger)", bg: "rgba(248,113,113,0.15)", border: "var(--danger)" }
}

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
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }

  const sharedProps = { t, lang, changeLang, theme, toggleTheme, isDark, disclaimerClosed, closeDisclaimer, openDisclaimer }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        :root {
          --primary: oklch(0.62 0.21 252);
          --primary-glow: oklch(0.72 0.18 230);
          --success: oklch(0.72 0.18 155);
          --warning: oklch(0.78 0.16 70);
          --danger: oklch(0.66 0.23 25);
          --neutral: oklch(0.6 0.02 260);
          --radius: 0.875rem;
        }

        [data-theme="dark"] {
          --bg: oklch(0.13 0.025 260);
          --surface: oklch(0.16 0.028 260 / 0.7);
          --surface-el: oklch(0.21 0.035 260);
          --border: oklch(0.28 0.03 260 / 0.6);
          --fg: oklch(1 0 0);
          --fg2: oklch(0.78 0.02 260);
          --bg-grad1: oklch(0.18 0.08 252);
          --bg-grad3: oklch(0.42 0.14 230);
        }
        [data-theme="light"] {
          --bg: oklch(0.985 0.005 260);
          --surface: oklch(1 0 0 / 0.85);
          --surface-el: oklch(1 0 0);
          --border: oklch(0.88 0.01 260);
          --fg: oklch(0.12 0.025 260);
          --fg2: oklch(0.45 0.02 260);
          --bg-grad1: oklch(0.92 0.06 240);
          --bg-grad3: oklch(0.85 0.09 220);
        }

        body {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: 
            radial-gradient(ellipse 80% 60% at 100% 50%, var(--bg-grad3) 0%, transparent 55%),
            radial-gradient(ellipse 70% 70% at 0% 0%, var(--bg-grad1) 0%, transparent 60%),
            var(--bg);
          background-attachment: fixed;
          min-height: 100vh;
          color: var(--fg);
          -webkit-font-smoothing: antialiased;
        }

        .glass {
          background: color-mix(in oklab, var(--surface) 60%, transparent);
          backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid var(--border);
        }
        .glass-strong {
          background: color-mix(in oklab, var(--surface-el) 75%, transparent);
          backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid var(--border);
        }

        .textarea-base {
          width: 100%; background: transparent;
          border: 1px solid var(--border); border-radius: 12px;
          padding: 14px 16px; color: var(--fg);
          font-size: 0.9rem; line-height: 1.55; resize: vertical;
          outline: none; font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .textarea-base::placeholder { color: var(--fg2); opacity: 0.6; }
        .textarea-base:focus {
          border-color: var(--primary);
          background: color-mix(in oklab, var(--primary) 4%, transparent);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 18%, transparent);
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-glow));
          color: white; border: none; cursor: pointer; font-family: inherit;
          font-weight: 600; display: inline-flex; align-items: center; gap: 6px;
          box-shadow: 0 8px 24px -8px color-mix(in oklab, var(--primary) 60%, transparent);
          transition: transform 0.15s, filter 0.15s;
        }
        .btn-primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.6; cursor: wait; }

        .btn-ghost {
          background: color-mix(in oklab, var(--surface) 60%, transparent);
          border: 1px solid var(--border); color: var(--fg2); cursor: pointer;
          font-family: inherit; font-weight: 500;
          display: inline-flex; align-items: center; gap: 6px;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .btn-ghost:hover { background: var(--surface-el); border-color: color-mix(in oklab, var(--primary) 40%, transparent); color: var(--fg); }

        .toolbar-btn {
          display: inline-flex; align-items: center; gap: 6px;
          border-radius: 8px; border: 1px solid color-mix(in oklab, var(--border) 100%, transparent);
          background: color-mix(in oklab, var(--surface) 60%, transparent);
          color: var(--fg2); cursor: pointer; padding: 6px 12px;
          font-size: 0.75rem; font-weight: 500; font-family: inherit;
          transition: all 0.15s;
        }
        .toolbar-btn:hover { border-color: color-mix(in oklab, var(--primary) 40%, transparent); background: color-mix(in oklab, var(--primary) 5%, transparent); color: var(--fg); }
        .toolbar-btn.active { border-color: color-mix(in oklab, var(--primary) 50%, transparent); background: color-mix(in oklab, var(--primary) 10%, transparent); color: var(--primary); }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease both; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; display: inline-block; }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
      `}</style>

      {page === "heuristics"
        ? <HeuristicsPage {...sharedProps} setPage={setPage} />
        : <HomePage {...sharedProps} setPage={setPage} apiKey={apiKey} setApiKey={setApiKey}
            mode={mode} setMode={setMode}
            userQuestion={userQuestion} setUserQuestion={setUserQuestion}
            leoResponse={leoResponse} setLeoResponse={setLeoResponse}
            conversation={conversation} setConversation={setConversation}
            comment={comment} setComment={setComment}
            showComment={showComment} setShowComment={setShowComment}
            images={images} setImages={setImages}
            loading={loading} result={result} error={error}
            run={run} reset={reset}
          />
      }
    </>
  )
}

// ── Disclaimer ────────────────────────────────────────────────────────────────
function Tooltip({ text }) {
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

function Disclaimer({ t, closed, onClose, onOpen }) {
  if (closed) return (
    <button onClick={onOpen} style={{ width: 40, height: 40, borderRadius: "50%", background: "color-mix(in oklab, var(--primary) 15%, transparent)", color: "var(--primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 1px color-mix(in oklab, var(--primary) 30%, transparent)", transition: "all 0.15s" }}
      title={t.aboutTitle}>
      <Info size={16} />
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

// ── Top Controls ──────────────────────────────────────────────────────────────
function TopControls({ t, lang, changeLang, theme, toggleTheme, isDark }) {
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
        <button onClick={() => setOpen(v => !v)} className="glass btn-ghost" style={{ borderRadius: 999, padding: "0 14px", height: 40, fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.9)" }}>
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
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {label}
                {lang === code && <Check size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={toggleTheme} className="glass btn-ghost" title={t.themeToggle}
        style={{ borderRadius: 999, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.9)" }}>
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  )
}

// ── Home Page ─────────────────────────────────────────────────────────────────
function HomePage({ t, lang, changeLang, theme, toggleTheme, isDark, disclaimerClosed, closeDisclaimer, openDisclaimer, setPage, mode, setMode, userQuestion, setUserQuestion, leoResponse, setLeoResponse, conversation, setConversation, comment, setComment, showComment, setShowComment, images, setImages, loading, result, error, run, reset, apiKey, setApiKey }) {
  const fileRef = useRef(null)
  const addImages = (files) => setImages(prev => [...prev, ...Array.from(files).filter(f => f.type.startsWith("image/"))])

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Header — static, not fixed */}
      <div style={{ padding: "20px 40px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Disclaimer t={t} closed={disclaimerClosed} onClose={closeDisclaimer} onOpen={openDisclaimer} />
        </div>
      </div>

      <main style={{ padding: "24px 40px 80px" }}>
        {/* Hero */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: "clamp(2rem,4vw,1.8rem)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.04em", fontFamily: "'Plus Jakarta Sans', sans-serif", WebkitFontSmoothing: "antialiased", textRendering: "optimizeLegibility" }}>
                {t.heroTitle}
              </h1>
              <p style={{ marginTop: 10, color: "var(--fg2)", fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.heroSubtitle}
              </p>
              <p style={{ marginTop: 6, color: "var(--fg2)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                {lang === "en" ? "This tool gives you an initial UX perspective on your AI agent's responses — evaluating clarity, relevance, transparency, and more across 10 structured heuristics." : "Cet outil vous permet d'obtenir un premier retour UX sur les réponses de votre agent IA — en évaluant la clarté, la pertinence, la transparence et bien plus, selon 10 heuristiques structurées."}
              </p>
              <button onClick={() => setPage("heuristics")} style={{ marginTop: 16, borderRadius: 999, padding: "9px 20px", fontSize: "0.82rem", fontWeight: 600, border: "1.5px solid rgba(59,130,246,0.7)", background: "rgba(59,130,246,0.12)", color: "rgba(59,130,246,1)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "all 0.15s" }}
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
            <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.13em", color: "rgba(255,255,255,0.5)" }}>{t.apiKeyLabel}</label>
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
        <div style={{ marginBottom: 20 }}>
          <div className="glass" style={{ display: "inline-flex", borderRadius: 999, padding: 4, gap: 4 }}>
            {[["single", MessageSquare, t.modeSingle], ["multi", MessagesSquare, t.modeMulti]].map(([m, Icon, label]) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => { setMode(m); reset() }} style={{
                borderRadius: 999, padding: "8px 20px", fontSize: "0.85rem", fontWeight: 500,
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit",
                background: mode === m ? "var(--primary)" : "transparent",
                color: mode === m ? "white" : "rgba(255,255,255,0.75)",
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

        {/* Card */}
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
              {loading ? <><Loader2 size={16} className="spin" /> {t.evaluating}</> : <><Play size={15} style={{ fill: "currentColor" }} /> {t.runEvaluation}</>}
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
                  <div key={i} style={{ borderRadius: 16, padding: "20px 24px", background: "color-mix(in oklab, var(--surface) 60%, transparent)", border: "1px solid var(--border)", borderLeft: `4px solid ${meta.border}`, transition: "border-color 0.2s" }}>
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
                      {c.observed && <ResultSection label={t.observed} body={c.observed} />}
                      {c.justification && <ResultSection label={t.justification} body={c.justification} />}
                      {c.advice && c.score !== null && c.score < 5 && <ResultSection label={t.advice} body={c.advice} highlight />}
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

// ── Heuristics Page ───────────────────────────────────────────────────────────
function HeuristicsPage({ t, lang, changeLang, theme, toggleTheme, isDark, setPage }) {
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
          <a href={lang === "fr" ? "https://raw.githubusercontent.com/margauxlebecque3ds-pixel/agent-evaluator/master/10heuritiques.pdf" : "https://raw.githubusercontent.com/margauxlebecque3ds-pixel/agent-evaluator/master/10heuristics.pdf"}
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
            <li key={h.id} style={{ position: "relative", overflow: "hidden", borderRadius: 20, padding: "24px 28px", background: "color-mix(in oklab, var(--surface) 60%, transparent)", border: "1px solid var(--border)", transition: "border-color 0.2s" }}
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

// ── Small components ──────────────────────────────────────────────────────────
function FieldLabel({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--fg2)", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  )
}

function Toolbar({ t, showComment, setShowComment, comment, images, fileRef, addImages }) {
  return (
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      <button type="button" onClick={() => setShowComment(v => !v)} className={`toolbar-btn ${showComment || comment ? "active" : ""}`}>
        <MessageSquarePlus size={14} /> {t.addComment}
        {comment && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }} />}
      </button>
      <button type="button" onClick={() => fileRef.current?.click()} className="toolbar-btn">
        <Paperclip size={14} /> {t.attach}
        {images.length > 0 && <span style={{ background: "color-mix(in oklab, var(--primary) 20%, transparent)", color: "var(--primary)", borderRadius: 999, padding: "1px 6px", fontSize: "0.68rem", fontWeight: 700 }}>{images.length}</span>}
      </button>
      <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--fg2)", opacity: 0.6 }}>{t.optionalHelp}</span>
    </div>
  )
}

function CommentBox({ t, value, onChange }) {
  const [saved, setSaved] = useState(false)
  const saveLabel = t.saveComment || "Save"
  const editLabel = t.editComment || "Edit comment"

  return (
    <div style={{ marginTop: 12, borderRadius: 12, border: "1px solid color-mix(in oklab, var(--primary) 30%, transparent)", background: "color-mix(in oklab, var(--primary) 5%, transparent)", padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--primary)", opacity: 0.8 }}>{t.addComment}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {!saved ? (
            <button type="button" onClick={() => { if (value.trim()) setSaved(true) }}
              style={{ background: "var(--primary)", border: "none", cursor: "pointer", color: "white", borderRadius: 6, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 600, fontFamily: "inherit" }}>
              {saveLabel}
            </button>
          ) : (
            <button type="button" onClick={() => setSaved(false)}
              style={{ background: "none", border: "1px solid var(--border)", cursor: "pointer", color: "var(--fg2)", borderRadius: 6, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 500, fontFamily: "inherit" }}>
              {editLabel}
            </button>
          )}
          {!saved && value && <button type="button" onClick={() => { onChange(""); setSaved(false) }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg2)", display: "flex" }}><X size={13} /></button>}
        </div>
      </div>
      {saved ? (
        <p style={{ fontSize: "0.85rem", color: "white", lineHeight: 1.5, margin: 0 }}>{value}</p>
      ) : (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={t.commentPlaceholder} rows={2} autoFocus
          style={{ width: "100%", background: "none", border: "none", outline: "none", resize: "none", fontSize: "0.85rem", color: "white", fontFamily: "inherit", lineHeight: 1.5 }} />
      )}
    </div>
  )
}

function AttachList({ files, setFiles }) {
  return (
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
      {files.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-el)", padding: "5px 10px", fontSize: "0.78rem" }}>
          <Paperclip size={12} style={{ color: "var(--primary)" }} />
          <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
          <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg2)", display: "flex" }}><X size={12} /></button>
        </div>
      ))}
    </div>
  )
}

function ResultSection({ label, body, highlight }) {
  return (
    <div>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--fg2)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "0.84rem", lineHeight: 1.65, color: "var(--fg)", opacity: 0.85, whiteSpace: "pre-wrap", ...(highlight ? { background: "color-mix(in oklab, var(--primary) 6%, transparent)", borderRadius: 8, padding: "8px 12px" } : {}) }}>
        {body}
      </div>
    </div>
  )
}