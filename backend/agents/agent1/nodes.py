"""Agent 1 Nodes — CV parsing, skill extraction, psychological scoring"""
import logging
from agents.agent1.state import Agent1State
from services.cv_parser import parse_cv
from data.questions import score_assessment

logger = logging.getLogger(__name__)


def validate_cv_node(state: Agent1State) -> Agent1State:
    """Node 1.1 — Validate CV text meets minimum threshold."""
    cv_text = state.get("cv_text", "")
    if len(cv_text) < 500:
        return {**state, "error": "CV must be at least 500 characters", "step": "error"}
    return {**state, "step": "parse_cv", "error": None}


def parse_cv_node(state: Agent1State) -> Agent1State:
    """Node 1.2 — NLP CV parsing (rule-based + LLM extraction)."""
    try:
        cv_data = parse_cv(state["cv_text"])
        return {
            **state,
            "hard_skills": cv_data["hard_skills"],
            "soft_skills_raw": cv_data["soft_skills_raw"],
            "soft_skills_confirmed": cv_data["soft_skills_raw"],  # Pre-confirmation default
            "experience_years": cv_data["experience_years"],
            "current_role": cv_data["current_role"],
            "education_level": cv_data["education_level"],
            "career_goals": cv_data["career_goals"],
            "step": "skills_validation",
            "error": None,
        }
    except Exception as e:
        logger.error(f"CV parse error: {e}")
        return {**state, "error": str(e), "step": "error"}


def score_assessment_node(state: Agent1State) -> Agent1State:
    """Node 1.4 — Score 48-question psychological assessment."""
    try:
        responses = state.get("assessment_responses", {})
        # Convert string keys to int if needed
        int_responses = {int(k): v for k, v in responses.items()}
        scores = score_assessment(int_responses)
        return {
            **state,
            "personality_traits": scores["personality_traits"],
            "work_style": scores["work_style"],
            "work_values": scores["work_values"],
            "step": "profile_complete",
            "error": None,
        }
    except Exception as e:
        logger.error(f"Assessment scoring error: {e}")
        return {**state, "error": str(e), "step": "error"}


def assemble_profile_node(state: Agent1State) -> Agent1State:
    """Node 1.5 — Assemble the final User Profile for handoff to Agent 2."""
    return {
        **state,
        "step": "handoff_ready",
        "error": None,
    }


def should_continue(state: Agent1State) -> str:
    """Conditional edge — route based on current step."""
    if state.get("error"):
        return "error"
    step = state.get("step", "")
    if step == "parse_cv":
        return "parse_cv"
    if step == "skills_validation":
        return "skills_validation"
    if step == "profile_complete":
        return "assemble"
    if step == "handoff_ready":
        return "done"
    return "done"
