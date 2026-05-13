from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI
import os
import re, json

client = OpenAI(
    api_key=os.getenv("MISTRAL_API_KEY"),
    base_url="https://api.mistral.ai/v1"
)

def call_main_agent(prompt):
    response = client.chat.completions.create(
        model="mistral-large-latest",
        messages=[
            {"role": "system", "content": "You are an expert assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

def parse_conversation(text):
    parts = re.split(r'\d{1,2}:\d{2}(?:\s*[AP]M)?', text)
    parts = [p.strip() for p in parts if p.strip()]
    if len(parts) < 2:
        return None
    exchanges = []
    for i, msg in enumerate(parts):
        role = "USER" if i % 2 == 0 else "LEO"
        exchanges.append({"role": role, "index": i + 1, "message": msg.strip()})
    return exchanges

def format_conversation_for_prompt(exchanges):
    lines = []
    exchange_num = 0
    for i in range(0, len(exchanges) - 1, 2):
        exchange_num += 1
        user_msg = exchanges[i]["message"] if i < len(exchanges) else ""
        leo_msg = exchanges[i+1]["message"] if i+1 < len(exchanges) else ""
        lines.append(f"--- EXCHANGE {exchange_num} ---")
        lines.append(f"[USER]: {user_msg}")
        lines.append(f"[LEO]: {leo_msg}")
        lines.append("")
    return "\n".join(lines)

def analyze_interface_image(image_b64):
    try:
        response = client.chat.completions.create(
            model="pixtral-12b-2409",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": "data:image/png;base64," + image_b64
                        },
                        {
                            "type": "text",
                            "text": "You are a UX researcher analyzing a screenshot from a CAD/simulation software interface (Dassault Systemes SIMULIA / 3DEXPERIENCE). Analyze this screenshot and describe: 1. What is visible in the 3D view (objects, selections, highlights, mesh, annotations)? 2. Is there any visual feedback from the AI agent (LEO/AURA/MARIE) on the 3D model (highlighted zones, color changes, annotations, glyphs)? 3. Does the interface state seem to reflect an action performed by the AI agent? 4. What is the overall state of the interface (which panels are open, what is selected)? Be specific and concise. This analysis will be used to evaluate the AI agent ability to interact with the 3D interface."
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        return "Image analysis unavailable: " + str(e)

SIMULIA_CONTEXT = """
EVALUATION CONTEXT — READ CAREFULLY:
You are evaluating a Virtual Companion (AURA, LEO, or MARIE) — an AI agent embedded inside Dassault Systèmes 3DEXPERIENCE platform (SIMULIA, CATIA, ENOVIA).

These companions assist engineers and designers in complex industrial workflows:
- Structural simulation (FEA), fluid dynamics (CFD), material selection, mesh refinement
- CAD operations, assembly design, tolerance analysis
- PLM data management, BOM, configuration management

TYPICAL USER PROFILES:
- Senior engineers (10+ years): expect precise technical answers, numerical data, direct recommendations, no hand-holding
- Junior engineers / students: may need more guidance, clearer explanations, step-by-step breakdowns
- IMPORTANT: A good companion DETECTS the user's level from how they phrase their question and ADAPTS accordingly. It also offers to adjust: "Would you like a more detailed explanation or a summary?"

WHAT MAKES A COMPANION RESPONSE EXCELLENT IN THIS CONTEXT:
- References specific simulation parameters, material properties, or workflow steps
- Proposes to RUN a simulation or analysis rather than just describing what could be done
- Cites data from the project (CATIA model, ENOVIA database, material library)
- Adapts vocabulary to detected user level
- Bridges conversation to the 3D interface (highlights zones, proposes annotations)
- Anticipates downstream effects (e.g. "changing this parameter will affect your mesh quality")

WHAT MAKES A RESPONSE POOR IN THIS CONTEXT:
- Generic Wikipedia-level answers (explaining that carbon fiber is lightweight to an engineer)
- No connection to the actual simulation software or project data
- Treating every user as a complete beginner
- Not proposing any action the agent could perform in the software
"""

ADVICE_FORMAT_INSTRUCTION = """
CRITICAL — improvement_advice FORMAT:
You MUST format improvement_advice as a structured list of priorities. Each item MUST follow this exact format:
[HIGH] Short title — "exact quote from agent response" → What should have been said/done instead.
[MEDIUM] Short title — "exact quote or description" → Improvement suggestion.
[LOW] Short title — Description → Nice-to-have improvement.

Rules:
- Maximum 3 bullets per criterion
- Each bullet MUST include a short direct quote from the agent response (in quotes) OR reference a specific absence
- Keep each bullet under 2 lines
- Prioritize: HIGH = blocks user task, MEDIUM = degrades experience, LOW = polish
- If score is 4 or 5, still provide 1-2 LOW items for continuous improvement
"""

def evaluate_response(prompt, response_text, language="en", mode="single", conversation_raw="", image_b64=None, user_comment=None):
    if language == "fr":
        lang_instruction = "Reponds UNIQUEMENT en francais. Tous les champs du JSON doivent etre rediges en francais. Les labels [HIGH]/[MEDIUM]/[LOW] restent en anglais."
    else:
        lang_instruction = "Respond ONLY in English. All JSON fields must be written in English."

    if mode == "single":
        comment_text = ""
        if user_comment:
            comment_text = "\n\nUSER CONTEXT NOTE (provided by the evaluator about what the agent did on the interface): " + str(user_comment)

        image_analysis_text = ""
        if image_b64:
            image_analysis = analyze_interface_image(image_b64)
            image_analysis_text = "\n\nINTERFACE SCREENSHOT ANALYSIS (use this to evaluate Criterion 8):\n" + image_analysis + "\n\nBased on this screenshot, Criterion 8 IS NOW APPLICABLE."

        evaluation_prompt = f"""
{SIMULIA_CONTEXT}

LANGUAGE INSTRUCTION: {lang_instruction}

{ADVICE_FORMAT_INSTRUCTION}

You are evaluating a SINGLE EXCHANGE between a user and a Virtual Companion (LEO/AURA/MARIE).

HEURISTIC EVALUATION FRAMEWORK
================================

CRITERION 1 - Request Adequacy
Did the agent understand the request and respond in the right format?
0: Completely misses the request or responds to a different question.
1: Wrong format or heavily partial — key parts of the request ignored.
2: Right topic but wrong format or missing significant parts.
3: Main request covered with correct format, minor gaps or slight off-topic elements.
4: Well-structured, full coverage, immediately readable.
5: Perfect — every part of the request answered in the ideal format, nothing missing.

CRITERION 2 - Transparency of Reasoning ("Why")
Does the agent show WHY it recommends what it recommends?
0: Pure black box — conclusion with zero explanation.
1: Vague generic phrase ("this is a good option") — no actual reasoning.
2: Some reasoning but key assumptions hidden — user cannot verify.
3: Main reasoning visible, some gaps — partially traceable.
4: Clear reasoning chain, minor gaps — mostly traceable.
5: Full step-by-step reasoning, sources/assumptions cited, user invited to verify or challenge.

CRITERION 3 - Contextual Relevance ("Where/Who")
Does the agent adapt to the user's role, expertise level, and workflow step?
0: Completely generic — could be copy-pasted from Wikipedia, no industrial context.
1: Minimal adaptation — mentions the domain but ignores user level or workflow step.
2: Partial adaptation — right domain but wrong level (too basic for expert, too complex for junior).
3: Reasonable adaptation — adapted to context, minor vocabulary or level mismatches.
4: Well-adapted — detects user level, adapts vocabulary, stays in workflow context.
5: Perfect — detects level from phrasing, adapts response depth, offers to adjust ("Want more detail or a summary?"), references specific workflow step.

CRITERION 4 - Human Controllability
Does the agent preserve user agency and control?
0: Performs or implies irreversible actions with no warning or confirmation request.
1: No mechanism for user to override, modify or cancel.
2: Vague implication that user could modify ("you can change this").
3: Acknowledges user control in principle, mentions it once.
4: Actively invites validation or modification before proceeding.
5: Full controllability — every suggestion framed as optional, explains how to modify/cancel, no action without confirmation.

CRITERION 5 - Cognitive Load Reduction
Does the agent make the task easier, not harder?
0: Overwhelming wall of text OR completely empty/useless response.
1: Right content but chaotic structure — user must work to extract information.
2: Understandable but wrong size — too long or too short for the task.
3: Reasonable but could be tighter — some redundancy or missing summary.
4: Well-calibrated length and structure — easy to scan.
5: Optimal — perfect length, clear formatting, summary offered for long answers, key info highlighted.

CRITERION 6 - Reliability & Anticipation ("Guardrails")
Does the agent handle uncertainty and prevent errors?
0: Confidently answers ambiguous questions AND/OR suggests actions that could cause errors.
1: Guesses without flagging uncertainty OR blocks without explanation.
2: Generic disclaimer only ("I might be wrong") — no targeted uncertainty management.
3: Identifies ambiguity or risk, asks one clarifying question OR proposes one alternative.
4: Identifies + asks + proposes alternative + mentions downstream risk.
5: Flags all uncertainty with confidence levels, asks targeted questions, proposes multiple alternatives, anticipates downstream effects.

CRITERION 7 - Task Segmentation ("How")
Does the agent break complex tasks into clear actionable steps?
0: No decomposition — dumps all information as one block.
1: Lists items but unordered or incomplete — no logical flow.
2: Partial sequence — steps present but dependencies missing.
3: Logical sequence with some gaps — mostly followable.
4: Clear ordered steps, mostly complete, dependencies mentioned.
5: Complete sequence — prerequisites checked, dependencies explicit, each step actionable.

CRITERION 8 - Interface & 3D Model Relationship
NOT APPLICABLE if no 3D model interaction and no screenshot provided.
0: No 3D awareness — responds as if in a text chatbot with no software context.
1: Vague 3D reference — mentions the model but no actual interaction.
2: Acknowledges the 3D object by name but proposes no interface action.
3: References specific objects in text, proposes one interface action.
4: Partial 3D interaction — highlights or selects but incomplete sync.
5: Full sync — highlights relevant zones, proposes annotations, interface and dialogue perfectly aligned.

CRITERION 9 - Interoperability (Data Access)
NOT APPLICABLE if no external data needed.
0: Only uses information from the current message — no project data access.
1: Alludes to external data but fabricates or hallucinates values.
2: References one data source but vaguely ("your project data").
3: References one identified source with specific values.
4: Cross-references multiple sources (CATIA model + material library + ENOVIA).
5: Full integration — all relevant sources cited, values cross-checked, discrepancies flagged.

CRITERION 10 - Consistency Over Time ("Memory")
NOT APPLICABLE for a single exchange.

USER PROMPT: {prompt}
AGENT RESPONSE: {response_text}
{comment_text}
{image_analysis_text}

OUTPUT — STRICTLY VALID JSON — NO EXTRA TEXT:
{{
  "evaluation": {{
    "request_adequacy": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "transparency_of_reasoning": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "contextual_relevance": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "human_controllability": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "cognitive_load_reduction": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "reliability_and_anticipation": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "task_segmentation": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "interface_and_3d_model_relationship": {{"score": null, "applicable": false, "observed_elements": "N/A", "justification": "Not applicable: no screenshot or 3D context provided.", "improvement_advice": "N/A"}},
    "interoperability": {{"score": null, "applicable": false, "observed_elements": "N/A", "justification": "Not applicable: no external data required.", "improvement_advice": "N/A"}},
    "consistency_over_time": {{"score": null, "applicable": false, "observed_elements": "N/A", "justification": "Not applicable: single exchange.", "improvement_advice": "N/A"}}
  }},
  "global_improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}
STRICT RULES: observed_elements must cite concrete quotes from the response. justification must reference the SIMULIA/industrial context. improvement_advice MUST follow the [HIGH]/[MEDIUM]/[LOW] bullet format. Respond ONLY with JSON.
"""

    else:
        exchanges = parse_conversation(conversation_raw)
        if not exchanges:
            return evaluate_response(prompt, conversation_raw, language, "single", "")

        conversation_formatted = format_conversation_for_prompt(exchanges)
        n_exchanges = len(exchanges) // 2

        evaluation_prompt = f"""
{SIMULIA_CONTEXT}

LANGUAGE INSTRUCTION: {lang_instruction}

{ADVICE_FORMAT_INSTRUCTION}

You are evaluating a FULL CONVERSATION between a user and a Virtual Companion (LEO/AURA/MARIE) inside Dassault Systèmes 3DEXPERIENCE. The conversation has {n_exchanges} exchanges.

For each criterion:
- Give a GLOBAL score (0-5) reflecting overall quality across ALL exchanges
- In observed_elements: cite SPECIFIC exchanges by number with short quotes
- In justification: explain the score with references to specific exchanges AND the industrial context
- In improvement_advice: follow the [HIGH]/[MEDIUM]/[LOW] format, cite which exchange needs improvement

CONVERSATION TO EVALUATE:
{conversation_formatted}

HEURISTIC EVALUATION FRAMEWORK
================================

CRITERION 1 - Request Adequacy
0: Misses requests consistently across exchanges.
1: Wrong format or heavily partial in most exchanges.
2: Right topic but wrong format or significant gaps across exchanges.
3: Main requests covered, some gaps or format issues in minority of exchanges.
4: Well-structured full coverage across exchanges, minor issues.
5: Every request in every exchange perfectly addressed.

CRITERION 2 - Transparency of Reasoning
0: No explanation in any exchange — pure black box throughout.
1: Vague generic explanations only ("this is recommended") across exchanges.
2: Partial reasoning in some exchanges, black box in others.
3: Adequate reasoning in most exchanges, some gaps.
4: Clear structured reasoning throughout, minor gaps.
5: Full transparency across all exchanges — sources cited, reasoning traceable.

CRITERION 3 - Contextual Relevance
0: Completely generic throughout — no industrial or user context.
1: Minimal adaptation — domain mentioned but user level ignored.
2: Partial adaptation — right domain, wrong level in most exchanges.
3: Reasonable adaptation overall, minor mismatches.
4: Well-adapted — tracks user level evolution across exchanges.
5: Perfectly tailored — detects level from phrasing, adapts across conversation, offers level adjustment.

CRITERION 4 - Human Controllability
0: Irreversible actions suggested/implied with no warning throughout.
1: No override mechanisms in any exchange.
2: Vague implication of control in some exchanges.
3: Acknowledges control in principle across exchanges.
4: Actively invites validation in most exchanges.
5: Full controllability throughout — every suggestion framed as optional.

CRITERION 5 - Cognitive Load Reduction
0: Overwhelming or empty responses throughout.
1: Poor structure across most exchanges.
2: Wrong size (too long/short) in most responses.
3: Reasonable but could be tighter overall.
4: Well-calibrated throughout.
5: Optimal across all exchanges — perfect length, clear formatting.

CRITERION 6 - Reliability & Anticipation
0: Confident on ambiguous requests throughout, no error prevention.
1: Guesses without flagging consistently.
2: Generic disclaimers only across exchanges.
3: Identifies some ambiguities and asks clarification in some exchanges.
4: Good uncertainty management throughout.
5: Exemplary — flags all uncertainty, targeted questions, anticipates downstream effects throughout.

CRITERION 7 - Task Segmentation
0: No decomposition in any exchange.
1: Unordered or incomplete steps across exchanges.
2: Partial sequences, missing dependencies throughout.
3: Logical sequences in most exchanges, some gaps.
4: Clear ordered sequences throughout, mostly complete.
5: Complete sequences with explicit dependencies across all exchanges.

CRITERION 8 - Interface & 3D Model Relationship
NOT APPLICABLE if no 3D model interaction in the conversation.
(Same rubric as single mode but evaluated across all exchanges)

CRITERION 9 - Interoperability
NOT APPLICABLE if no external data needed in the conversation.
(Same rubric as single mode but evaluated across all exchanges)

CRITERION 10 - Consistency Over Time ("Memory") — KEY CRITERION
APPLICABLE since this is a multi-exchange conversation.
0: No memory — each exchange treated as a completely fresh start.
1: Vague inconsistent references to earlier content.
2: Recalls some information but inconsistently — misses key context.
3: Reasonable session memory — references earlier exchanges, misses some contradictions.
4: Good memory — references earlier decisions, flags most inconsistencies.
5: Perfect memory — proactively applies earlier context, flags contradictions, builds on previous answers.

OUTPUT — STRICTLY VALID JSON — NO EXTRA TEXT:
{{
  "evaluation": {{
    "request_adequacy": {{"score": 0, "applicable": true, "observed_elements": "Exchange 1: '...quote...'; Exchange 2: '...quote...'", "justification": "...", "improvement_advice": "..."}},
    "transparency_of_reasoning": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "contextual_relevance": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "human_controllability": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "cognitive_load_reduction": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "reliability_and_anticipation": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "task_segmentation": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "interface_and_3d_model_relationship": {{"score": null, "applicable": false, "observed_elements": "N/A", "justification": "Not applicable: no 3D interaction in conversation.", "improvement_advice": "N/A"}},
    "interoperability": {{"score": null, "applicable": false, "observed_elements": "N/A", "justification": "Not applicable: no external data required.", "improvement_advice": "N/A"}},
    "consistency_over_time": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}}
  }},
  "global_improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}
STRICT RULES: Cite exchange numbers and short quotes. justification must reference the industrial/SIMULIA context. improvement_advice MUST follow [HIGH]/[MEDIUM]/[LOW] format. Respond ONLY with JSON.
"""

    evaluation = client.chat.completions.create(
        model="mistral-large-latest",
        messages=[
            {"role": "system", "content": "You are a senior UX researcher evaluating AI agents in industrial software. You respond only in valid JSON."},
            {"role": "user", "content": evaluation_prompt}
        ]
    ).choices[0].message.content

    match = re.search(r'\{.*\}', evaluation, re.DOTALL)
    if match:
        evaluation_json = match.group(0)
        try:
            data = json.loads(evaluation_json)
            for c in data["evaluation"]:
                criterion = data["evaluation"][c]
                if criterion.get("applicable") == False:
                    continue
                score = criterion.get("score")
                if score is None or not isinstance(score, (int, float)):
                    continue
                data["evaluation"][c]["score"] = max(0, min(5, score))
            return json.dumps(data)
        except json.JSONDecodeError:
            return evaluation_json
    else:
        return evaluation


def generate_export_xlsx(result: dict, title: str = "Exchange 1") -> bytes:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    import io

    FONT_NAME = "Aptos Narrow"
    CRITERION_COLORS = ["B8D9F5","AADEC8","B8E3A0","E0EE9A","F7E08A","F9C48A","F4A89A","F0A0C0","D4AEE8","B0BAEE"]
    LETTERS = ["A","B","C","D","E","F","G","H","I","J"]
    CRITERION_LABELS = [
        "A. Request adequacy","B. Reasoning transparency","C. Contextual relevance",
        "D. Human controllability","E. Cognitive load reduction","F. Reliability & anticipation",
        "G. Action segmentation","H. Bridge to interface and 3D model",
        "I. Interoperability","J. Consistency over time",
    ]

    def fill(hex_color): return PatternFill("solid", fgColor=hex_color)
    def thin_border(left=True, right=True, top=True, bottom=True):
        thin = Side(border_style="thin"); none = Side(border_style=None)
        return Border(left=thin if left else none, right=thin if right else none, top=thin if top else none, bottom=thin if bottom else none)
    def font(size=11, bold=False): return Font(name=FONT_NAME, size=size, bold=bold)

    wb = Workbook(); ws = wb.active; ws.title = "Sheet1"

    ws.column_dimensions["B"].width = 45
    for col, w in zip("CDEFGHIJKLMN", [3.3,3.6,3.7,13,3.3,13,3.7,13,3.3,3.3,7.1,8.7]):
        ws.column_dimensions[col].width = w

    ws.merge_cells("C2:N3"); ws["C2"] = title; ws["C2"].font = font(18, True)
    ws.row_dimensions[2].height = 21; ws.row_dimensions[3].height = 21

    ws.merge_cells("C4:N4"); ws["C4"] = "Grades for the 10 Criteria"; ws["C4"].font = font(18, True)
    ws.row_dimensions[4].height = 24

    ws.row_dimensions[5].height = 21
    for i, (letter, color) in enumerate(zip(LETTERS, CRITERION_COLORS)):
        col = get_column_letter(3 + i); cell = ws[f"{col}5"]
        cell.value = letter; cell.fill = fill(color)
        cell.font = font(11); cell.alignment = Alignment(horizontal="center"); cell.border = thin_border()
    ws["M5"] = "Avg"; ws["M5"].font = font(11); ws["M5"].alignment = Alignment(horizontal="center")
    ws["N5"] = "Sum"; ws["N5"].font = font(11); ws["N5"].alignment = Alignment(horizontal="center")

    ws.row_dimensions[6].height = 21
    criteria = result.get("criteria", [])
    for i in range(10):
        col = get_column_letter(3 + i); cell = ws[f"{col}6"]
        if i < len(criteria):
            score = criteria[i].get("score")
            cell.value = score if score is not None else "N/A"
        cell.font = font(11); cell.alignment = Alignment(horizontal="center")
    ws["M6"] = "=AVERAGE(C6:L6)"; ws["M6"].font = font(11); ws["M6"].alignment = Alignment(horizontal="center")
    ws["N6"] = "=SUM(C6:L6)"; ws["N6"].font = font(11); ws["N6"].alignment = Alignment(horizontal="center")

    ws.row_dimensions[7].height = 24
    ws["B7"] = "10 Criteria"; ws["B7"].font = font(11, True)
    ws.merge_cells("C7:N7"); ws["C7"] = "Detailed evaluations"; ws["C7"].font = font(18, True)

    for i in range(10):
        start_row = 8 + i * 3; color = CRITERION_COLORS[i]
        ws.merge_cells(f"B{start_row}:B{start_row+2}")
        b = ws[f"B{start_row}"]
        b.value = CRITERION_LABELS[i]; b.fill = fill(color); b.font = font(14)
        b.alignment = Alignment(horizontal="left", vertical="center"); b.border = thin_border()

        cdata = criteria[i] if i < len(criteria) else {}
        for j, (label, key) in enumerate([("Observation","observed"),("Justification","justification"),("Advice","advice")]):
            row = start_row + j; value = cdata.get(key, "") or ""
            ws.merge_cells(f"C{row}:N{row}")
            c = ws[f"C{row}"]
            c.value = f"{label}: {value}" if value else label
            c.font = font(11); c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
            c.border = thin_border(left=True, right=False, top=j==0, bottom=j==2)
            charsPerLine = 90
            lines = max(1, len(str(value)) // charsPerLine + 1) if value else 1
            ws.row_dimensions[row].height = max(20, lines * 15)

    ws.row_dimensions[40].height = 37.5
    ws["B40"] = "Tips: Use ALT+H+O+I to autofit columns width"; ws["B40"].font = font(10)

    buf = io.BytesIO(); wb.save(buf); buf.seek(0)
    return buf.read()