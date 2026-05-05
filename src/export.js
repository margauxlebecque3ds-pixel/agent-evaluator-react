import ExcelJS from "exceljs"

const COLORS = ["B8D9F5","AADEC8","B8E3A0","E0EE9A","F7E08A","F9C48A","F4A89A","F0A0C0","D4AEE8","B0BAEE"]
const LETTERS = ["A","B","C","D","E","F","G","H","I","J"]
const LABELS = [
  "A. Request adequacy","B. Reasoning transparency","C. Contextual relevance",
  "D. Human controllability","E. Cognitive load reduction","F. Reliability & anticipation",
  "G. Action segmentation","H. Bridge to interface and 3D model",
  "I. Interoperability","J. Consistency over time",
]

export async function exportEvaluationToExcel(result, title = "Exchange 1") {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Sheet1")

  ws.getColumn("B").width = 45
  const cwidths = [4,4,4,4,4,4,4,4,4,4,7.1,8.7]
  "CDEFGHIJKLMN".split("").forEach((c,i) => { ws.getColumn(c).width = cwidths[i] })

  const border = (l,r,t,b) => ({
    left:   l ? { style:"thin" } : undefined,
    right:  r ? { style:"thin" } : undefined,
    top:    t ? { style:"thin" } : undefined,
    bottom: b ? { style:"thin" } : undefined,
  })

  // ── Row 2-3: titre ─────────────────────────────────────────────────────────
  ws.mergeCells("C2:N3")
  const c2 = ws.getCell("C2")
  c2.value = title
  c2.font = { name:"Aptos Narrow", size:18, bold:true }
  c2.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FFFFD7C8" } }
  c2.alignment = { horizontal:"center", vertical:"middle" }
  ws.getRow(2).height = 21; ws.getRow(3).height = 21

  // ── Row 4: section header ──────────────────────────────────────────────────
  ws.mergeCells("C4:N4")
  const c4 = ws.getCell("C4")
  c4.value = "Grades for the 10 Criteria"
  c4.font = { name:"Aptos Narrow", size:18, bold:true, color:{ argb:"FFFFFFFF" } }
  c4.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF4BACC6" } }
  c4.alignment = { horizontal:"center", vertical:"middle" }
  ws.getRow(4).height = 24

  // ── Row 5: letter headers ──────────────────────────────────────────────────
  ws.getRow(5).height = 21
  LETTERS.forEach((letter, i) => {
    const col = String.fromCharCode(67 + i)
    const cell = ws.getCell(`${col}5`)
    cell.value = letter
    cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF"+COLORS[i] } }
    cell.font = { name:"Aptos Narrow", size:11 }
    cell.alignment = { horizontal:"center" }
    cell.border = border(true,true,true,true)
  })
  const avg5 = ws.getCell("M5")
  avg5.value = "Avg"; avg5.font = { name:"Aptos Narrow", size:11 }; avg5.alignment = { horizontal:"center" }
  const sum5 = ws.getCell("N5")
  sum5.value = "Sum"; sum5.font = { name:"Aptos Narrow", size:11 }; sum5.alignment = { horizontal:"center" }

  // ── Row 6: scores ──────────────────────────────────────────────────────────
  ws.getRow(6).height = 21
  const criteria = result.criteria || []
  LETTERS.forEach((_, i) => {
    const col = String.fromCharCode(67 + i)
    const cell = ws.getCell(`${col}6`)
    const score = i < criteria.length ? criteria[i].score : null
    cell.value = score !== null && score !== undefined ? score : "N/A"
    cell.font = { name:"Aptos Narrow", size:11 }
    cell.alignment = { horizontal:"center" }
  })
  const avgCell = ws.getCell("M6")
  avgCell.value = { formula:"AVERAGE(C6:L6)" }
  avgCell.font = { name:"Aptos Narrow", size:11 }
  avgCell.alignment = { horizontal:"center" }
  const sumCell = ws.getCell("N6")
  sumCell.value = { formula:"SUM(C6:L6)" }
  sumCell.font = { name:"Aptos Narrow", size:11 }
  sumCell.alignment = { horizontal:"center" }

  // ── Row 7: detail headers ──────────────────────────────────────────────────
  ws.getRow(7).height = 24
  const b7 = ws.getCell("B7")
  b7.value = "10 Criteria"
  b7.font = { name:"Aptos Narrow", size:11, bold:true, color:{ argb:"FFFFFFFF" } }
  b7.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF4BACC6" } }
  b7.alignment = { horizontal:"left", vertical:"middle" }

  ws.mergeCells("C7:N7")
  const c7 = ws.getCell("C7")
  c7.value = "Detailed evaluations"
  c7.font = { name:"Aptos Narrow", size:18, bold:true, color:{ argb:"FFFFFFFF" } }
  c7.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF4BACC6" } }
  c7.alignment = { horizontal:"center", vertical:"middle" }

  // ── Rows 8-37: critères ────────────────────────────────────────────────────
  for (let i = 0; i < 10; i++) {
    const startRow = 8 + i * 3
    const color = COLORS[i]
    const cdata = i < criteria.length ? criteria[i] : {}

    ws.mergeCells(`B${startRow}:B${startRow+2}`)
    const bCell = ws.getCell(`B${startRow}`)
    bCell.value = LABELS[i]
    bCell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:"FF"+color } }
    bCell.font = { name:"Aptos Narrow", size:14 }
    bCell.alignment = { horizontal:"left", vertical:"middle" }
    bCell.border = border(true,true,true,true)

    const rows = [
      ["Observation",   cdata.observed      || ""],
      ["Justification", cdata.justification || ""],
      ["Advice",        cdata.advice        || ""],
    ]

    rows.forEach(([label, value], j) => {
      const row = startRow + j
      ws.mergeCells(`C${row}:N${row}`)
      const cell = ws.getCell(`C${row}`)

      cell.value = value
        ? { richText: [
            { text: `${label}: `, font:{ name:"Aptos Narrow", size:11, bold:true } },
            { text: value,        font:{ name:"Aptos Narrow", size:11 } },
          ]}
        : label

      cell.alignment = { horizontal:"left", vertical:"top", wrapText:true }

      // Bordure : top sur Observation, bottom sur Advice, left toujours
      cell.border = border(
        true,               // left
        false,              // right
        j === 0,            // top sur première ligne
        j === 2,            // bottom sur dernière ligne
      )

      ws.getRow(row).height = value
        ? Math.max(30, Math.min(value.length / 3, 120))
        : 20
    })
  }

  // ── Tip row ────────────────────────────────────────────────────────────────
  ws.getRow(40).height = 37.5
  ws.getCell("B40").value = "Tips: Use ALT+H+O+I to autofit columns width"
  ws.getCell("B40").font = { name:"Aptos Narrow", size:10 }

  // ── Download ───────────────────────────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `eval-${Date.now()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}