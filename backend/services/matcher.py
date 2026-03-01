"""Agent 2 — Career Matching Algorithm
Weights: Hard Skills 40% | Personality 25% | Work Style & Values 20% | Experience 15%
Filters: Skills Score >= 35 AND Final Score >= 50
Diversity: max 2 per role family
Output: top 3-5 ranked career cards
"""
import logging
from data.career_profiles import get_all_profiles
from data.career_reports_content import CAREER_REPORTS_CONTENT

logger = logging.getLogger(__name__)

LEVEL_MAP = {"Low": 1, "Moderate": 2, "High": 3}


def level_distance(user_level: str, role_level: str) -> float:
    """Returns a similarity score 0-1 based on level alignment."""
    u = LEVEL_MAP.get(user_level, 2)
    r = LEVEL_MAP.get(role_level, 2)
    diff = abs(u - r)
    if diff == 0:
        return 1.0
    elif diff == 1:
        return 0.6
    return 0.2


def score_hard_skills(user_skills: list, role_skills: list) -> tuple[float, list, list]:
    """Returns (score 0-100, matched_skills, gap_skills)"""
    if not role_skills:
        return 50.0, [], []
    user_lower = {s.lower() for s in user_skills}
    matched = []
    gap = []
    for skill in role_skills:
        if skill.lower() in user_lower:
            matched.append(skill)
        else:
            gap.append(skill)
    score = (len(matched) / len(role_skills)) * 100
    return round(score, 1), matched[:5], gap[:5]


def score_personality(user_traits: dict, role_traits: dict) -> float:
    """Returns score 0-100 based on Big Five alignment."""
    if not user_traits or not role_traits:
        return 50.0
    scores = []
    for trait in ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]:
        u = user_traits.get(trait, {})
        r = role_traits.get(trait, "Moderate")
        user_level = u.get("level", "Moderate") if isinstance(u, dict) else u
        scores.append(level_distance(user_level, r))
    return round((sum(scores) / len(scores)) * 100, 1)


def score_work_style_values(user_ws: dict, user_wv: dict, role_ws: dict, role_wv: dict) -> float:
    """Returns score 0-100 based on Holland Code + IT Work Preferences alignment."""
    all_scores = []
    # Holland Code (work style)
    for dim in ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"]:
        u = user_ws.get(dim, {})
        r = role_ws.get(dim, "Moderate")
        user_level = u.get("level", "Moderate") if isinstance(u, dict) else u
        all_scores.append(level_distance(user_level, r))
    # IT Work Preferences (work values)
    for dim in ["collaboration", "problem_solving", "leadership_growth", "dynamic_environment"]:
        u = user_wv.get(dim, {})
        r = role_wv.get(dim, "Moderate")
        user_level = u.get("level", "Moderate") if isinstance(u, dict) else u
        all_scores.append(level_distance(user_level, r))
    return round((sum(all_scores) / len(all_scores)) * 100, 1)


def score_experience(user_years: int, role_seniority: str) -> float:
    """Returns score 0-100 based on experience vs. seniority fit."""
    seniority_ranges = {
        "Entry": (0, 2),
        "Mid": (2, 6),
        "Senior": (5, 12),
        "Lead": (8, 30),
    }
    lo, hi = seniority_ranges.get(role_seniority, (0, 30))
    if lo <= user_years <= hi:
        return 100.0
    elif user_years < lo:
        gap = lo - user_years
        return max(100.0 - gap * 15, 20.0)
    else:
        return 85.0  # Over-qualified — still viable


def match_careers(user_profile: dict) -> list:
    """Main matching function. Returns ranked list of career match objects."""
    hard_skills = user_profile.get("hard_skills", [])
    soft_skills = user_profile.get("soft_skills_confirmed", [])
    all_user_skills = hard_skills + soft_skills
    experience_years = user_profile.get("experience_years", 0)
    personality = user_profile.get("personality_traits", {})
    work_style = user_profile.get("work_style", {})
    work_values = user_profile.get("work_values", {})

    profiles = get_all_profiles()
    results = []

    for profile in profiles:
        # ── Component Scores ─────────────────────────────────────
        skills_score, matched_skills, gap_skills = score_hard_skills(
            all_user_skills, profile.get("required_hard_skills", [])
        )
        personality_score = score_personality(personality, profile.get("required_traits", {}))
        wsv_score = score_work_style_values(
            work_style, work_values,
            profile.get("work_style", {}), profile.get("work_values", {})
        )
        experience_score = score_experience(experience_years, profile.get("seniority_level", "Mid"))

        # ── Weighted Final Score ─────────────────────────────────
        final_score = round(
            skills_score * 0.40
            + personality_score * 0.25
            + wsv_score * 0.20
            + experience_score * 0.15,
            1
        )

        # ── Viability Filter ─────────────────────────────────────
        if skills_score < 35 or final_score < 50:
            continue

        # ── Enrich with structured content from career reports ───────
        career_id = profile["career_id"]
        report = CAREER_REPORTS_CONTENT.get(career_id, {})

        results.append({
            "career_id": career_id,
            "role_name": profile["role_name"],
            "role_family": profile["role_family"],
            "final_score": final_score,
            "skills_score": skills_score,
            "personality_score": personality_score,
            "wsv_score": wsv_score,
            "experience_score": experience_score,
            "matched_skills": matched_skills[:3],
            "gap_skills": gap_skills[:3],
            "avg_ramp_up_months": profile.get("avg_ramp_up_months", 12),
            "salary_range": profile.get("salary_range", {}),
            "salary_growth_yoy": profile.get("salary_growth_yoy", "N/A"),
            "growth_trajectory": profile.get("growth_trajectory", "Medium"),
            "description_summary": profile.get("description_summary", ""),
            "full_content": profile.get("full_content", ""),
            "seniority_level": profile.get("seniority_level", "Mid"),
            # ── Structured Zone B fields ──────────────────────────────
            "role_overview": report.get("role_overview", ""),
            "responsibilities": report.get("responsibilities", ""),
            "required_skills": profile.get("required_hard_skills", []),
            "career_progression": report.get("career_progression", []),
            "compensation_bands": report.get("compensation_bands", {}),
            "what_makes_great": report.get("what_makes_great", ""),
        })

    # ── Sort by final score ───────────────────────────────────────
    results.sort(key=lambda x: x["final_score"], reverse=True)

    # ── Diversity constraint: max 2 per role family ───────────────
    family_count: dict[str, int] = {}
    diverse_results = []
    for r in results:
        fam = r["role_family"]
        if family_count.get(fam, 0) < 2:
            diverse_results.append(r)
            family_count[fam] = family_count.get(fam, 0) + 1
        if len(diverse_results) >= 5:
            break

    # Ensure at least 3
    if len(diverse_results) < 3:
        for r in results:
            if r not in diverse_results:
                diverse_results.append(r)
            if len(diverse_results) >= 3:
                break

    return diverse_results[:5]
