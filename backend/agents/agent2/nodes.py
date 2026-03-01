"""Agent 2 Nodes — Career matching, justification generation, output assembly"""
import logging
from agents.agent2.state import Agent2State
from services.matcher import match_careers

logger = logging.getLogger(__name__)


def match_careers_node(state: Agent2State) -> Agent2State:
    """Node 2.1 — Run weighted matching algorithm against all 50 career profiles."""
    try:
        user_profile = state.get("user_profile", {})
        matches = match_careers(user_profile)
        return {
            **state,
            "raw_matches": matches,
            "career_matches": matches,
            "step": "generate_justifications",
            "error": None,
        }
    except Exception as e:
        logger.error(f"Career matching error: {e}")
        return {**state, "error": str(e), "step": "error"}


def generate_justifications_node(state: Agent2State) -> Agent2State:
    """Node 2.2 — Generate Claude justification sentence for each career match."""
    try:
        from services.deploy_ai import llm_call
        user_profile = state.get("user_profile", {})
        matches = state.get("career_matches", [])
        enriched = []

        for match in matches:
            try:
                system = (
                    "You are a career advisor writing a brief, personalized justification "
                    "for a career match recommendation. Be specific, data-backed, and direct. "
                    "Write exactly ONE sentence (max 30 words). No fluff, no generic phrases."
                )
                prompt = f"""User profile:
- Current role: {user_profile.get('current_role', 'IT professional')}
- Experience: {user_profile.get('experience_years', 0)} years
- Top skills: {', '.join(user_profile.get('hard_skills', [])[:5])}
- Top personality: {_top_traits(user_profile.get('personality_traits', {}))}

Career match: {match['role_name']} ({match['role_family']})
Match score: {match['final_score']:.0f}%
Matched skills: {', '.join(match.get('matched_skills', [])[:3])}

Write one 20-30 word justification sentence explaining why this is a strong match for this specific user."""

                justification = llm_call(prompt, system)
                # Trim to single sentence
                justification = justification.strip().split('\n')[0].strip('"').strip("'")
                match_with_justification = {**match, "justification": justification}
            except Exception as e:
                logger.warning(f"Justification LLM call failed for {match['role_name']}: {e}")
                match_with_justification = {
                    **match,
                    "justification": match.get("description_summary", "Strong alignment with your technical skills and career interests.")
                }
            enriched.append(match_with_justification)

        return {
            **state,
            "career_matches": enriched,
            "step": "output_ready",
            "error": None,
        }
    except Exception as e:
        logger.error(f"Justification generation error: {e}")
        # Return matches without justifications rather than failing
        return {
            **state,
            "career_matches": [{**m, "justification": m.get("description_summary", "")} for m in state.get("career_matches", [])],
            "step": "output_ready",
            "error": None,
        }


def _top_traits(traits: dict) -> str:
    """Helper to summarize top personality traits."""
    highs = [k for k, v in traits.items() if (v.get("level") if isinstance(v, dict) else v) == "High"]
    return ", ".join(highs[:3]) if highs else "balanced profile"
