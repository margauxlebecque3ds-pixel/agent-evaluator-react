export const API_BASE = "https://agent-evaluator-react.onrender.com"

async function imagesToBase64(files) {
  return Promise.all(
    files.map(f => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ name: f.name, data: String(reader.result) })
      reader.onerror = reject
      reader.readAsDataURL(f)
    }))
  )
}

export async function evaluateSingle({ userQuestion, leoResponse, comment, images = [] }) {
  const payload = {
    prompt: userQuestion,
    response: leoResponse,
    language: localStorage.getItem("eval-lang") || "en",
    user_comment: comment || "",
    image_b64: images.length ? (await imagesToBase64(images)).map(i => i.data.split(",")[1]) : null,
  }
  const res = await fetch(`${API_BASE}/evaluate/single`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Backend returned ${res.status}`)
  return normalize(await res.json())
}

export async function evaluateMulti({ conversation, comment, images = [] }) {
  const payload = {
    conversation,
    language: localStorage.getItem("eval-lang") || "en",
    user_comment: comment || "",
    image_b64: images.length ? (await imagesToBase64(images)).map(i => i.data.split(",")[1]) : null,
  }
  const res = await fetch(`${API_BASE}/evaluate/multi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Backend returned ${res.status}`)
  return normalize(await res.json())
}

function normalize(raw) {
  let data = raw
  if (raw.result && typeof raw.result === "string") {
    try { data = JSON.parse(raw.result) } catch { data = raw }
  }

  if (data.evaluation && typeof data.evaluation === "object" && !Array.isArray(data.evaluation)) {
    const criteria = Object.entries(data.evaluation).map(([key, val]) => ({
      criterion: key,
      score: val.score === null || val.score === undefined || val.score === "N/A" ? null : Number(val.score),
      justification: val.justification || "",
      advice: val.improvement_advice || val.advice || "",
    }))
    return {
      criteria,
      global_suggestions: Array.isArray(data.global_improvement_suggestions)
        ? data.global_improvement_suggestions.join("\n• ")
        : (data.global_suggestions || ""),
    }
  }

  const criteriaRaw = data.criteria || data.results || data.evaluation || []
  const criteria = (Array.isArray(criteriaRaw) ? criteriaRaw : []).map(c => ({
    criterion: String(c.criterion || c.name || c.heuristic || "Unknown"),
    score: c.score === null || c.score === undefined || c.score === "N/A" ? null : Number(c.score),
    justification: c.justification || "",
    advice: c.improvement_advice || c.advice || "",
  }))
  return {
    criteria,
    global_suggestions: data.global_suggestions || data.global_improvement_suggestions || "",
  }
}