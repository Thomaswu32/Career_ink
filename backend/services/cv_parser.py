"""CV NLP Parser — Agent 1, Step 1.2
Two-pass extraction:
  Pass 1 (rule-based): Hard skills from HARD_SKILLS taxonomy (excludes Soft Skills category).
  Pass 2 (LLM-assisted): Soft skills + experience metadata via LLM, with rule-based fallback.
Input sanitisation: HTML tag stripping + whitespace normalisation.
"""
import re
import json
import html
import logging
from data.skill_taxonomy import HARD_SKILLS, SOFT_SKILLS, SKILL_ALIASES

logger = logging.getLogger(__name__)

# Maximum characters passed to LLM (spec: 20,000 max)
LLM_MAX_CHARS = 15000


# ─── Input sanitisation ───────────────────────────────────────────────────────

def strip_html(text: str) -> str:
    """Strip HTML/Markdown tags and decode HTML entities."""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = html.unescape(text)
    text = re.sub(r'```[^`]*```', ' ', text, flags=re.DOTALL)
    text = re.sub(r'`[^`]*`', ' ', text)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    return text


def normalize(text: str) -> str:
    return re.sub(r'\s+', ' ', text.lower().strip())


# ─── Pass 1: Rule-based hard skill extraction ─────────────────────────────────

def extract_hard_skills(cv_text: str) -> list[str]:
    """Match CV text against HARD_SKILLS taxonomy only (soft skills excluded)."""
    text_norm = normalize(cv_text)
    found: dict[str, int] = {}

    for skill in HARD_SKILLS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_norm):
            found[skill] = found.get(skill, 0) + 1

    # Check aliases → resolve to canonical hard skill
    for alias, canonical in SKILL_ALIASES.items():
        if re.search(r'\b' + re.escape(alias) + r'\b', text_norm):
            if canonical in HARD_SKILLS:
                found[canonical] = found.get(canonical, 0) + 1

    return list(found.keys())


# ─── Pass 1b: Rule-based soft skill fallback ──────────────────────────────────

def extract_soft_skills_rule_based(cv_text: str, exclude: set[str]) -> list[str]:
    """Match CV text against SOFT_SKILLS taxonomy as fallback when LLM is unavailable."""
    text_norm = normalize(cv_text)
    found: list[str] = []
    for skill in SOFT_SKILLS:
        if skill.lower() in exclude:
            continue
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_norm):
            found.append(skill)
    return found


# ─── Pass 2: LLM-assisted extraction ─────────────────────────────────────────

def parse_cv_with_llm(cv_text: str) -> dict:
    """LLM extraction for soft skills + experience/education metadata."""
    from services.deploy_ai import llm_call

    system = (
        "You are a structured data extractor for a career assessment platform. "
        "Read the following CV text and extract the fields listed below. "
        "Return ONLY a valid JSON object — no prose, no explanation, no markdown."
    )
    prompt = f"""CV Text:
{cv_text[:LLM_MAX_CHARS]}

Extract these fields and return ONLY valid JSON:
{{
  "soft_skills": ["list of soft/interpersonal skills, e.g. 'Stakeholder Management', 'Cross-functional Collaboration'"],
  "experience_years": <integer — total years of professional experience>,
  "current_role": "<most recent job title as written in CV>",
  "education_level": "<one of: High School, Associate, Bachelor, Master, PhD, Bootcamp/Self-taught, Unknown>",
  "career_goals": ["any explicit career aspirations or transition intentions mentioned"]
}}"""

    try:
        raw = llm_call(prompt, system)
        raw = re.sub(r'```(?:json)?', '', raw).strip().strip('`')
        data = json.loads(raw)
        return {
            "soft_skills": data.get("soft_skills", []),
            "experience_years": int(data.get("experience_years", 0) or 0),
            "current_role": str(data.get("current_role", "Not specified")),
            "education_level": str(data.get("education_level", "Unknown")),
            "career_goals": data.get("career_goals", []),
        }
    except Exception as e:
        logger.warning(f"LLM CV parsing fallback used: {e}")
        return {
            "soft_skills": None,  # None = signal to use rule-based fallback
            "experience_years": _estimate_years(cv_text),
            "current_role": "Not specified",
            "education_level": _detect_education(cv_text),
            "career_goals": [],
        }


def _estimate_years(text: str) -> int:
    years = re.findall(r'\b(19[89]\d|20[012]\d)\b', text)
    if len(years) >= 2:
        return max(int(max(years)) - int(min(years)), 0)
    return 0


def _detect_education(text: str) -> str:
    t = text.lower()
    if "phd" in t or "doctorate" in t:
        return "PhD"
    if "master" in t or "msc" in t or "mba" in t:
        return "Master"
    if "bachelor" in t or "bsc" in t or "b.e." in t:
        return "Bachelor"
    if "bootcamp" in t or "self-taught" in t:
        return "Bootcamp/Self-taught"
    return "Unknown"


# ─── Main entry point ─────────────────────────────────────────────────────────

def parse_cv(cv_text: str) -> dict:
    """Full CV parsing pipeline — returns structured profile data."""
    # Sanitise input
    sanitised = strip_html(cv_text)
    sanitised = re.sub(r'\s+', ' ', sanitised).strip()

    # Pass 1: Hard skills (taxonomy, soft-skills category excluded)
    hard_skills = extract_hard_skills(sanitised)
    hard_lower = {s.lower() for s in hard_skills}

    # Pass 2: LLM for soft skills + metadata
    llm_data = parse_cv_with_llm(sanitised)

    if llm_data["soft_skills"] is None:
        # LLM unavailable — use rule-based soft skill detection as fallback
        soft_skills = extract_soft_skills_rule_based(sanitised, exclude=hard_lower)
    else:
        # Deduplicate: drop any soft skills already captured as hard skills
        soft_skills = [
            s for s in llm_data["soft_skills"]
            if s.lower() not in hard_lower
        ]

    return {
        "hard_skills": hard_skills,
        "soft_skills_raw": soft_skills,
        "experience_years": llm_data["experience_years"],
        "current_role": llm_data["current_role"],
        "education_level": llm_data["education_level"],
        "career_goals": llm_data["career_goals"],
    }
