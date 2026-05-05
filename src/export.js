import { API_BASE } from "./api"

export async function exportEvaluationToExcel(result, title = "Exchange 1") {
  const res = await fetch(`${API_BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, title }),
  })
  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `eval-${Date.now()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}