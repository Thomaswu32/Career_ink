"""Agent 1 State — CareerInk Assessment Agent"""
from typing import TypedDict, Optional, Annotated
from langgraph.graph.message import add_messages


class Agent1State(TypedDict):
    # Inputs
    cv_text: str
    assessment_responses: dict  # {question_id: answer (1-5)}

    # CV Parsing outputs
    hard_skills: list
    soft_skills_raw: list
    soft_skills_confirmed: list  # After user chip validation
    experience_years: int
    current_role: str
    education_level: str
    career_goals: list

    # Assessment outputs
    personality_traits: dict   # Big Five: {trait: {score, level}}
    work_style: dict           # Holland Code: {type: {score, level}}
    work_values: dict          # IT Prefs: {pref: {score, level}}

    # Status
    step: str
    error: Optional[str]
