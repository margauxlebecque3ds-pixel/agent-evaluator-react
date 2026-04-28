import * as XLSX from "xlsx"

export function exportEvaluationToExcel(result, filename = "eval-ai-results.xlsx") {
  const rows = result.criteria.map((c, i) => ({
    "#": i + 1,
    "Criterion": c.criterion.replace(/_/g, " ").replace(/\b\w/g, ch => ch.toUpperCase()),
    "Score": c.score === null ? "N/A" : `${c.score}/5`,
    "Observed elements": c.observed || "",
    "Justification": c.justification || "",
    "Improvement advice": c.advice || "",
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws["!cols"] = [{ wch: 4 }, { wch: 36 }, { wch: 8 }, { wch: 50 }, { wch: 50 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, ws, "Criteria")

  if (result.global_suggestions) {
    const ws2 = XLSX.utils.aoa_to_sheet([["Global suggestions"], [result.global_suggestions]])
    ws2["!cols"] = [{ wch: 100 }]
    XLSX.utils.book_append_sheet(wb, ws2, "Global suggestions")
  }

  XLSX.writeFile(wb, filename)
}