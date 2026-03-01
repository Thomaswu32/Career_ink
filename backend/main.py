"""CareerInk Backend — FastAPI Application
Agent 1 (CV Analysis + Assessment) + Agent 2 (Career Discovery + PDF)
"""
import sys
import os
import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_DIR = Path(os.getenv(
    "LOG_DIR",
    "/mnt/efs/spaces/57a688d2-e262-43ed-b1f5-fa8fce0239e6/828c25c2-915a-4c35-a3f4-0593f0e9a317/logs"
))
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_DIR / "backend.log"),
    ],
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="CareerInk API",
    description="AI-Powered IT Career Assessment Platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ─────────────────────────────────────────────────

class CVAnalysisRequest(BaseModel):
    cv_text: str

class SkillsConfirmRequest(BaseModel):
    hard_skills: list
    soft_skills: list
    cv_metadata: dict  # experience_years, current_role, education_level, career_goals

class AssessmentScoreRequest(BaseModel):
    responses: dict  # {question_id (str): answer (int 1-5)}
    user_profile_so_far: dict  # From CV analysis + skills confirmation

class CareerMatchRequest(BaseModel):
    user_profile: dict  # Complete Agent 1 output

class PDFRequest(BaseModel):
    user_profile: dict
    career_matches: list
    user_name: Optional[str] = "Professional"

class OptInRequest(BaseModel):
    email: str
    user_name: Optional[str] = ""


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "CareerInk API", "version": "2.0.0"}


# ── Agent 1 Routes ────────────────────────────────────────────────────────────

@app.post("/api/agent1/analyze-cv")
def analyze_cv(req: CVAnalysisRequest):
    """Step 1.1–1.2: Validate CV + extract skills via NLP."""
    logger.info(f"CV analysis request: {len(req.cv_text)} chars")
    if len(req.cv_text) < 500:
        raise HTTPException(400, detail="CV must be at least 500 characters")

    try:
        from agents.agent1.nodes import validate_cv_node, parse_cv_node
        state = validate_cv_node({"cv_text": req.cv_text, "step": "validate"})
        if state.get("error"):
            raise HTTPException(400, detail=state["error"])
        state = parse_cv_node(state)
        if state.get("error"):
            raise HTTPException(500, detail=state["error"])

        return {
            "hard_skills": state.get("hard_skills", []),
            # Fixed: renamed from soft_skills_raw to soft_skills for frontend consistency
            "soft_skills": state.get("soft_skills_raw", []),
            "experience_years": state.get("experience_years", 0),
            "current_role": state.get("current_role", "Not specified"),
            "education_level": state.get("education_level", "Unknown"),
            "career_goals": state.get("career_goals", []),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CV analysis error: {e}", exc_info=True)
        raise HTTPException(500, detail=str(e))


@app.post("/api/agent1/score-assessment")
def score_assessment(req: AssessmentScoreRequest):
    """Step 1.3–1.5: Score 48-question assessment + assemble profile."""
    logger.info(f"Assessment scoring: {len(req.responses)} responses")
    try:
        from agents.agent1.nodes import score_assessment_node, assemble_profile_node
        state = {
            **req.user_profile_so_far,
            "assessment_responses": req.responses,
            "step": "score",
        }
        state = score_assessment_node(state)
        if state.get("error"):
            raise HTTPException(500, detail=state["error"])
        state = assemble_profile_node(state)

        return {
            "personality_traits": state.get("personality_traits", {}),
            "work_style": state.get("work_style", {}),
            "work_values": state.get("work_values", {}),
            "user_profile": {
                "hard_skills": state.get("hard_skills", []),
                "soft_skills_confirmed": state.get("soft_skills_confirmed", state.get("soft_skills_raw", [])),
                "experience_years": state.get("experience_years", 0),
                "current_role": state.get("current_role", ""),
                "education_level": state.get("education_level", ""),
                "career_goals": state.get("career_goals", []),
                "personality_traits": state.get("personality_traits", {}),
                "work_style": state.get("work_style", {}),
                "work_values": state.get("work_values", {}),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Assessment scoring error: {e}", exc_info=True)
        raise HTTPException(500, detail=str(e))


# ── Agent 2 Routes ────────────────────────────────────────────────────────────

@app.post("/api/agent2/match-careers")
def match_careers(req: CareerMatchRequest):
    """Step 2.1: Career matching algorithm + LLM justification generation."""
    logger.info("Career matching request received")
    try:
        from agents.agent2.graph import run_career_discovery
        result = run_career_discovery(req.user_profile)
        matches = result.get("career_matches", [])
        return {"career_matches": matches}
    except Exception as e:
        logger.error(f"Career matching error: {e}", exc_info=True)
        raise HTTPException(500, detail=str(e))


@app.post("/api/pdf/generate")
def generate_pdf(req: PDFRequest):
    """Step 2.2: Generate PDF Career Recommendations Report."""
    logger.info(f"PDF generation request for: {req.user_name}")
    try:
        from services.pdf_generator import generate_pdf as gen_pdf
        pdf_bytes = gen_pdf(req.user_profile, req.career_matches, req.user_name)
        filename = f"CareerInk_Career_Report_{req.user_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"PDF generation error: {e}", exc_info=True)
        raise HTTPException(500, detail=str(e))


@app.post("/api/optin")
def capture_optin(req: OptInRequest):
    """Capture post-MVP opt-in email for Skills Gap Analysis notification."""
    logger.info(f"Opt-in captured: {req.email}")
    optin_log = LOG_DIR / "optins.jsonl"
    with open(optin_log, "a") as f:
        f.write(json.dumps({
            "email": req.email,
            "name": req.user_name,
            "timestamp": datetime.now().isoformat()
        }) + "\n")
    return {"status": "captured", "message": "We'll notify you when the Skills Gap Analysis feature launches!"}


@app.get("/api/questions")
def get_questions():
    """Return all 48 assessment questions."""
    from data.questions import QUESTIONS
    return {"questions": QUESTIONS}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
