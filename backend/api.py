from fastapi import FastAPI
from fastapi.responses import Response
import json
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from main import evaluate_response, parse_conversation
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SingleRequest(BaseModel):
    prompt: str
    response: str
    language: str = "en"
    user_comment: Optional[str] = ""
    image_b64: Optional[List[str]] = None
    api_key: Optional[str] = None

class MultiRequest(BaseModel):
    conversation: str
    language: str = "en"
    user_comment: Optional[str] = ""
    image_b64: Optional[List[str]] = None
    api_key: Optional[str] = None

@app.post("/evaluate/single")
def evaluate_single(req: SingleRequest):
    # Use user's api_key if provided, otherwise fall back to .env
    if req.api_key:
        os.environ["MISTRAL_API_KEY"] = req.api_key
    result = evaluate_response(
        req.prompt,
        req.response,
        language=req.language,
        mode="single",
        image_b64=req.image_b64,
        user_comment=req.user_comment or ""
    )
    return {"result": result}

@app.post("/evaluate/multi")
def evaluate_multi(req: MultiRequest):
    if req.api_key:
        os.environ["MISTRAL_API_KEY"] = req.api_key
    result = evaluate_response(
        "", "",
        language=req.language,
        mode="multi",
        conversation_raw=req.conversation,
        image_b64=req.image_b64,
        user_comment=req.user_comment or ""
    )
    return {"result": result}

@app.get("/health")
def health():
    return {"status": "ok"}



class ExportRequest(BaseModel):
    result: dict
    title: Optional[str] = "Exchange 1"

@app.post("/export")
def export_excel(req: ExportRequest):
    from main import generate_export_xlsx
    data = generate_export_xlsx(req.result, req.title)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="eval-results.xlsx"'}
    )