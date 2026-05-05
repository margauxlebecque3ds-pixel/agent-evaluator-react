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
    """Send image to Pixtral for 3D interface analysis."""
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
                            "text": "You are a UX researcher analyzing a screenshot from a CAD/simulation software interface (Dassault Systemes SIMULIA / 3DEXPERIENCE). Analyze this screenshot and describe: 1. What is visible in the 3D view (objects, selections, highlights, mesh, annotations)? 2. Is there any visual feedback from the AI agent (LEO) on the 3D model (highlighted zones, color changes, annotations, glyphs)? 3. Does the interface state seem to reflect an action performed by the AI agent? 4. What is the overall state of the interface (which panels are open, what is selected)? Be specific and concise. This analysis will be used to evaluate the AI agent ability to interact with the 3D interface."
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        return "Image analysis unavailable: " + str(e)

def evaluate_response(prompt, response_text, language="en", mode="single", conversation_raw="", image_b64=None, user_comment=None):
    if language == "fr":
        lang_instruction = "Reponds UNIQUEMENT en francais. Tous les champs du JSON doivent etre rediges en francais."
    else:
        lang_instruction = "Respond ONLY in English. All JSON fields must be written in English."

    if mode == "single":
        # Build optional context
        comment_text = ""
        if user_comment:
            comment_text = "\n\nUSER CONTEXT NOTE (provided by the evaluator about what LEO did on the interface): " + str(user_comment)

        image_analysis_text = ""
        if image_b64:
            image_analysis = analyze_interface_image(image_b64)
            image_analysis_text = "\n\nINTERFACE SCREENSHOT ANALYSIS (use this to evaluate Criterion 8 - Interface & 3D Model Relationship):\n" + image_analysis + "\n\nBased on this screenshot analysis, Criterion 8 IS NOW APPLICABLE. Score it based on what you can observe in the interface."

        evaluation_prompt = f"""
You are a senior UX researcher specializing in AI agent evaluation within complex industrial software (CAD/simulation).

LANGUAGE INSTRUCTION: {lang_instruction}

Evaluate the AI agent's response against the heuristic framework below. Score each criterion with a detailed rubric-anchored justification.

HEURISTIC EVALUATION FRAMEWORK
================================

CRITERION 1 - Request Adequacy
Did the agent understand the request and respond in the right format?
Sub-questions: Right format? On topic? Full coverage? Key info immediately visible?
0: Completely misses the request. 1: Wrong format or partial. 2: Right topic, partially right format. 3: Main request covered, minor gaps. 4: Well-structured, full coverage. 5: Perfect format, every part answered.

CRITERION 2 - Transparency of Reasoning ("Why")
Does the agent make its reasoning visible?
Sub-questions: Explains why? Sources/assumptions visible? Traceable recommendation?
0: No explanation, pure black box. 1: Vague generic explanation. 2: Partial reasoning, key gaps. 3: Adequate reasoning, some gaps. 4: Clear structured reasoning, minor gaps. 5: Full step-by-step reasoning, sources cited, user invited to verify.

CRITERION 3 - Contextual Relevance ("Where")
Does the agent adapt to the user's role, expertise, and workflow step?
Sub-questions: Adapted to workflow step? User role understood? Vocabulary adapted? No unavailable actions? No redundant info?
0: Completely generic. 1: Minimal context awareness. 2: Partial adaptation. 3: Reasonable adaptation, minor mismatches. 4: Well-adapted, minor gaps. 5: Perfectly tailored.

CRITERION 4 - Human Controllability
Does the agent preserve user control?
Sub-questions: Can user interrupt/modify? Easy to do mid-interaction? Reversible with no side effects?
0: Irreversible actions, no warning. 1: No override mechanism. 2: Vague implication of control. 3: Acknowledges control in principle. 4: Actively invites validation/modification. 5: Full controllability, suggestions only, explains how to modify/cancel.

CRITERION 5 - Cognitive Load Reduction ("Less is More")
Does the agent reduce mental effort?
Sub-questions: Simpler than menus? Actually simplifies? Right size response? Summary offered?
0: Overwhelming or empty. 1: Right content, poor structure. 2: Understandable but wrong size. 3: Reasonable but could be tighter. 4: Well-calibrated. 5: Optimal length, clear formatting, summary when needed.

CRITERION 6 - Reliability & Anticipation ("Doubt & Guardrail")
Does the agent manage uncertainty and prevent errors?
Sub-questions: Asks clarification when ambiguous? Catches impossible parameters? Expresses confidence levels? Anticipates downstream consequences?
0: Confident on ambiguous requests AND executes problematic actions. 1: Guesses without flagging OR blocks without explanation. 2: Generic disclaimer OR vague flag. 3: Identifies ambiguity/risk, asks OR proposes one alternative. 4: Identifies + asks + proposes alternative. 5: Flags uncertainty AND errors, targeted questions, multiple alternatives, confidence levels, anticipates downstream effects.

CRITERION 7 - Task Segmentation ("How")
Does the agent break complex tasks into steps?
Sub-questions: Logical sub-steps? Coherent order? Dependencies pointed out?
0: No decomposition. 1: Unordered/incomplete steps. 2: Partial sequence, missing dependencies. 3: Logical sequence, some gaps. 4: Clear ordered sequence, mostly complete. 5: Complete sequence, explicit dependencies, prerequisites checked.

CRITERION 8 - Interface & 3D Model Relationship
Does the agent bridge conversation and 3D model?
NOT APPLICABLE if no 3D model interaction and no screenshot provided.
0: No 3D awareness. 1: Vague 3D reference. 2: Acknowledges object, no interaction. 3: References objects in text. 4: Partial 3D interaction. 5: Full sync, highlights, annotations.

CRITERION 9 - Interoperability (Data Access)
Does the agent act like an expert who read the full project?
NOT APPLICABLE if no external data needed.
0: Only current interaction data. 1: Alludes to external data, fabricated. 2: One source, unclear. 3: One identified source. 4: Multiple sources cross-referenced. 5: Full integration, all sources cited.

CRITERION 10 - Consistency Over Time ("Memory")
NOT APPLICABLE for a single exchange.

USER PROMPT: {prompt}
AGENT RESPONSE: {response_text}
{comment_text}
{image_analysis_text}

OUTPUT - STRICTLY VALID JSON - NO EXTRA TEXT:
{{
  "evaluation": {{
    "request_adequacy": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "transparency_of_reasoning": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "contextual_relevance": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "human_controllability": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "cognitive_load_reduction": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "reliability_and_anticipation": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "task_segmentation": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "interface_and_3d_model_relationship": {{"score": null, "applicable": false, "observed_elements": "...", "justification": "Not applicable: no screenshot or 3D context provided.", "improvement_advice": "..."}},
    "interoperability": {{"score": null, "applicable": false, "observed_elements": "...", "justification": "Not applicable: no external data required.", "improvement_advice": "..."}},
    "consistency_over_time": {{"score": null, "applicable": false, "observed_elements": "...", "justification": "Not applicable: single exchange.", "improvement_advice": "..."}}
  }},
  "global_improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}
STRICT RULES: No global score. observed_elements must cite concrete elements. improvement_advice must be specific. Respond ONLY with JSON.
"""

    else:
        exchanges = parse_conversation(conversation_raw)
        if not exchanges:
            return evaluate_response(prompt, conversation_raw, language, "single", "")

        conversation_formatted = format_conversation_for_prompt(exchanges)
        n_exchanges = len(exchanges) // 2

        evaluation_prompt = f"""
You are a senior UX researcher specializing in AI agent evaluation within complex industrial software (CAD/simulation).

LANGUAGE INSTRUCTION: {lang_instruction}

You are evaluating a FULL CONVERSATION between a user and LEO (an AI agent by Dassault Systemes). The conversation has {n_exchanges} exchanges.

For each criterion:
- Give a GLOBAL score (0-5) reflecting the overall quality across all exchanges
- In observed_elements: cite SPECIFIC exchanges by number
- In justification: explain the score with references to specific exchanges
- In improvement_advice: give actionable advice, citing which exchange(s) need improvement

CONVERSATION TO EVALUATE:
{conversation_formatted}

HEURISTIC EVALUATION FRAMEWORK
================================

CRITERION 1 - Request Adequacy
0: Misses requests consistently. 1: Wrong format or partial in most exchanges. 2: Right topic, partially right format. 3: Main requests covered, some gaps. 4: Well-structured across exchanges. 5: Every request perfectly addressed.

CRITERION 2 - Transparency of Reasoning
0: No explanation in any exchange. 1: Vague generic explanations. 2: Partial reasoning. 3: Adequate reasoning, some gaps. 4: Clear structured reasoning overall. 5: Full transparency across all exchanges.

CRITERION 3 - Contextual Relevance
0: Completely generic throughout. 1: Minimal adaptation. 2: Partial adaptation. 3: Reasonable adaptation overall. 4: Well-adapted, minor gaps. 5: Perfectly tailored, tracks user context evolution.

CRITERION 4 - Human Controllability
0: Irreversible actions, no warning. 1: No override mechanisms. 2: Vague implication of control. 3: Acknowledges control in principle. 4: Actively invites validation. 5: Full controllability throughout.

CRITERION 5 - Cognitive Load Reduction
0: Overwhelming or empty responses. 1: Poor structure overall. 2: Wrong size in most responses. 3: Reasonable but could be tighter. 4: Well-calibrated overall. 5: Optimal throughout.

CRITERION 6 - Reliability & Anticipation
0: Confident on ambiguous requests throughout. 1: Guesses without flagging consistently. 2: Generic disclaimers only. 3: Identifies some ambiguities. 4: Good uncertainty management overall. 5: Exemplary throughout.

CRITERION 7 - Task Segmentation
0: No decomposition in any exchange. 1: Unordered/incomplete steps. 2: Partial sequences. 3: Logical sequences, some gaps. 4: Clear ordered sequences overall. 5: Complete sequences with dependencies throughout.

CRITERION 8 - Interface & 3D Model Relationship
NOT APPLICABLE if no 3D model interaction in the conversation.

CRITERION 9 - Interoperability
NOT APPLICABLE if no external data needed in the conversation.

CRITERION 10 - Consistency Over Time ("Memory") - KEY CRITERION
APPLICABLE since this is a multi-exchange conversation.
0: No memory, each exchange treated as fresh start. 1: Vague inconsistent references. 2: Recalls some info but inconsistently. 3: Reasonable session memory, misses contradictions. 4: Good memory, references earlier decisions. 5: Perfect memory, proactively applies context, flags contradictions.

OUTPUT - STRICTLY VALID JSON - NO EXTRA TEXT:
{{
  "evaluation": {{
    "request_adequacy": {{"score": 0, "applicable": true, "observed_elements": "Cite specific exchanges...", "justification": "...", "improvement_advice": "..."}},
    "transparency_of_reasoning": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "contextual_relevance": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "human_controllability": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "cognitive_load_reduction": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "reliability_and_anticipation": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "task_segmentation": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "interface_and_3d_model_relationship": {{"score": null, "applicable": false, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "interoperability": {{"score": null, "applicable": false, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}},
    "consistency_over_time": {{"score": 0, "applicable": true, "observed_elements": "...", "justification": "...", "improvement_advice": "..."}}
  }},
  "global_improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}
STRICT RULES: No global score. Cite exchange numbers. Respond ONLY with JSON.
"""

    evaluation = client.chat.completions.create(
        model="mistral-large-latest",
        messages=[
            {"role": "system", "content": "You are a senior UX researcher evaluating AI agents. You respond only in valid JSON."},
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
            c.border = thin_border(left=True, right=False, top=False, bottom=False)
            ws.row_dimensions[row].height = max(30, min(len(str(value)) // 3, 120)) if value else 20

    ws.row_dimensions[40].height = 37.5
    ws["B40"] = "Tips: Use ALT+H+O+I to autofit columns width"; ws["B40"].font = font(10)

    buf = io.BytesIO(); wb.save(buf); buf.seek(0)
    return buf.read()    