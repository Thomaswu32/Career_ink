"""Agent 2 State — CareerInk Career Path Discovery Agent"""
from typing import TypedDict, Optional


class Agent2State(TypedDict):
    # Input — full user profile from Agent 1
    user_profile: dict  # Complete profile object

    # Processing
    raw_matches: list           # All viable matches before diversity filter
    career_matches: list        # Final 3-5 ranked + enriched matches (with justifications)

    # Status
    step: str
    error: Optional[str]
