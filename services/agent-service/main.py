# ============================================
# main.py — GETEDIL-OS Enterprise Orchestration
# ============================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import supabase
from deep_translator import GoogleTranslator

from core.Registry import REGISTRY, ROLE_LEVELS
from core.PillarRouter import activatePillar

# 🔹 Initialize FastAPI
app = FastAPI(
    title="GETEDIL-OS Neural Link",
    description="Global orchestration service with governance, AI workflows, audit logging, and multilingual responses",
    version="2.0.0"
)

# 🔹 CORS for international clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# 🔹 Translation utility
def translate_message(message: str, target_locale: str = "en-US") -> str:
    try:
        lang_code = target_locale.split("-")[0]  # e.g. "fr" from "fr-FR"
        return GoogleTranslator(source="auto", target=lang_code).translate(message)
    except Exception as e:
        print("Translation failed:", e)
        return message  # fallback to original

# 🔹 Request model
class ActivationRequest(BaseModel):
    user_id: Optional[str]
    role: str
    command: str
    locale: Optional[str] = "en-US"
    metadata: Optional[Dict[str, Any]] = {}

# 🔹 Response model
class ActivationResponse(BaseModel):
    status: str
    message: str
    pillar: Optional[Dict[str, Any]] = None
    locale: str

# ============================================
# Routes
# ============================================

@app.get("/")
async def root():
    return {
        "system": "GETEDIL-OS",
        "status": "online",
        "locale": "en-US"
    }

@app.post("/activate", response_model=ActivationResponse)
async def activate(request: ActivationRequest):
    # Validate role
    if request.role not in ROLE_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Run activation via PillarRouter
    result = await activatePillar(
        user={"id": request.user_id},
        role=request.role,
        command=request.command
    )

    # Translate message
    translated_message = translate_message(result["message"], request.locale)

    # Audit log insertion
    if result["status"] == "success":
        try:
            await supabase_client.table("audit_log").insert({
                "user_id": request.user_id,
                "role": request.role,
                "pillar": result["pillar"]["name"],
                "action": "activate",
                "category": result["pillar"]["category"],
                "auditable": result["pillar"]["auditable"],
                "metadata": request.metadata,
                "timestamp": supabase_client.functions.now()
            }).execute()
        except Exception as e:
            print("Audit log failed:", e)

    return {
        "status": result["status"],
        "message": translated_message,
        "pillar": result.get("pillar"),
        "locale": request.locale
    }

@app.get("/pillars")
async def list_pillars(role: str, locale: str = "en-US"):
    """Return all accessible pillars for a given role."""
    role_level = ROLE_LEVELS.get(role, 0)
    accessible = [
        p for p in REGISTRY if ROLE_LEVELS[p["permission"]] <= role_level
    ]
    # Translate category names for UI
    for pillar in accessible:
        pillar["category"] = translate_message(pillar["category"], locale)
    return {"role": role, "pillars": accessible, "locale": locale}

@app.get("/audit")
async def audit_logs(limit: int = 50, locale: str = "en-US"):
    """Fetch recent audit logs for governance dashboards."""
    try:
        logs = supabase_client.table("audit_log").select("*").order("timestamp", desc=True).limit(limit).execute()
        return {"logs": logs.data, "locale": locale}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit fetch failed: {e}")
