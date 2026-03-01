# CareerInk - 48-Question Psychological Assessment
# Big Five (20) + Holland Code RIASEC (18) + IT Work Preferences (10)

QUESTIONS = [
    # ── Big Five ────────────────────────────────────────────────
    # Openness (1-4)
    {"id": 1, "text": "I enjoy exploring new technologies and methodologies, even if they're unproven", "section": "big_five", "trait": "openness", "reverse": False},
    {"id": 2, "text": "I prefer working on innovative projects rather than maintaining existing systems", "section": "big_five", "trait": "openness", "reverse": False},
    {"id": 3, "text": "I like brainstorming creative solutions to complex business problems", "section": "big_five", "trait": "openness", "reverse": False},
    {"id": 4, "text": "I'm comfortable with ambiguous requirements and changing project scope", "section": "big_five", "trait": "openness", "reverse": False},
    # Conscientiousness (5-8)
    {"id": 5, "text": "I naturally create detailed plans and follow them systematically", "section": "big_five", "trait": "conscientiousness", "reverse": False},
    {"id": 6, "text": "I ensure all stakeholders are aligned before moving forward with decisions", "section": "big_five", "trait": "conscientiousness", "reverse": False},
    {"id": 7, "text": "I consistently meet deadlines and deliverables without constant reminders", "section": "big_five", "trait": "conscientiousness", "reverse": False},
    {"id": 8, "text": "I document processes and decisions thoroughly for future reference", "section": "big_five", "trait": "conscientiousness", "reverse": False},
    # Extraversion (9-12)
    {"id": 9, "text": "I energize when facilitating meetings and leading team discussions", "section": "big_five", "trait": "extraversion", "reverse": False},
    {"id": 10, "text": "I prefer collaborative problem-solving over working alone", "section": "big_five", "trait": "extraversion", "reverse": False},
    {"id": 11, "text": "I enjoy presenting ideas to stakeholders and senior management", "section": "big_five", "trait": "extraversion", "reverse": False},
    {"id": 12, "text": "I'm comfortable being the primary point of contact for external clients", "section": "big_five", "trait": "extraversion", "reverse": False},
    # Agreeableness (13-16)
    {"id": 13, "text": "I prioritize team harmony when resolving conflicts between team members", "section": "big_five", "trait": "agreeableness", "reverse": False},
    {"id": 14, "text": "I consider multiple perspectives before making decisions that affect others", "section": "big_five", "trait": "agreeableness", "reverse": False},
    {"id": 15, "text": "I'm willing to compromise on my preferred approach for team consensus", "section": "big_five", "trait": "agreeableness", "reverse": False},
    {"id": 16, "text": "I focus on building trust and rapport with both technical and business stakeholders", "section": "big_five", "trait": "agreeableness", "reverse": False},
    # Neuroticism (17-20) - REVERSE SCORED
    {"id": 17, "text": "I remain calm when projects face unexpected technical or business challenges", "section": "big_five", "trait": "neuroticism", "reverse": True},
    {"id": 18, "text": "I handle criticism of my work or decisions constructively", "section": "big_five", "trait": "neuroticism", "reverse": True},
    {"id": 19, "text": "I maintain focus during high-pressure situations like critical releases", "section": "big_five", "trait": "neuroticism", "reverse": True},
    {"id": 20, "text": "I adapt well when priorities shift due to business or market changes", "section": "big_five", "trait": "neuroticism", "reverse": True},

    # ── Holland Code RIASEC ──────────────────────────────────────
    # Realistic (21-23)
    {"id": 21, "text": "I enjoy hands-on problem-solving with systems, code, or technical infrastructure", "section": "holland", "trait": "realistic", "reverse": False},
    {"id": 22, "text": "I prefer working with concrete data and measurable outcomes", "section": "holland", "trait": "realistic", "reverse": False},
    {"id": 23, "text": "I like building and optimizing tools that others can use effectively", "section": "holland", "trait": "realistic", "reverse": False},
    # Investigative (24-26)
    {"id": 24, "text": "I enjoy analyzing complex problems to understand root causes", "section": "holland", "trait": "investigative", "reverse": False},
    {"id": 25, "text": "I like researching new technologies, market trends, or user behaviors", "section": "holland", "trait": "investigative", "reverse": False},
    {"id": 26, "text": "I'm drawn to roles that require continuous learning and skill development", "section": "holland", "trait": "investigative", "reverse": False},
    # Artistic (27-29)
    {"id": 27, "text": "I enjoy creating user experiences, visual designs, or innovative solutions", "section": "holland", "trait": "artistic", "reverse": False},
    {"id": 28, "text": "I like working on projects where creativity and aesthetics matter", "section": "holland", "trait": "artistic", "reverse": False},
    {"id": 29, "text": "I prefer flexible work environments that encourage experimentation", "section": "holland", "trait": "artistic", "reverse": False},
    # Social (30-32)
    {"id": 30, "text": "I enjoy mentoring team members and helping them grow professionally", "section": "holland", "trait": "social", "reverse": False},
    {"id": 31, "text": "I like facilitating communication between different teams or departments", "section": "holland", "trait": "social", "reverse": False},
    {"id": 32, "text": "I'm motivated by work that directly improves user or customer experiences", "section": "holland", "trait": "social", "reverse": False},
    # Enterprising (33-35)
    {"id": 33, "text": "I enjoy leading initiatives and driving projects from concept to completion", "section": "holland", "trait": "enterprising", "reverse": False},
    {"id": 34, "text": "I like influencing stakeholders and negotiating project requirements", "section": "holland", "trait": "enterprising", "reverse": False},
    {"id": 35, "text": "I'm comfortable making strategic decisions that impact business outcomes", "section": "holland", "trait": "enterprising", "reverse": False},
    # Conventional (36-38)
    {"id": 36, "text": "I enjoy creating structured processes and ensuring compliance with standards", "section": "holland", "trait": "conventional", "reverse": False},
    {"id": 37, "text": "I like organizing information, requirements, or project documentation", "section": "holland", "trait": "conventional", "reverse": False},
    {"id": 38, "text": "I prefer working within established frameworks and methodologies", "section": "holland", "trait": "conventional", "reverse": False},

    # ── IT Work Preferences ──────────────────────────────────────
    # Collaboration Style (39-41)
    {"id": 39, "text": "I prefer working in cross-functional teams rather than specialized technical teams", "section": "it_prefs", "trait": "collaboration", "reverse": False},
    {"id": 40, "text": "I enjoy bridging the gap between technical teams and business stakeholders", "section": "it_prefs", "trait": "collaboration", "reverse": False},
    {"id": 41, "text": "I'm most productive when I can influence both technical and business decisions", "section": "it_prefs", "trait": "collaboration", "reverse": False},
    # Problem-Solving Approach (42-44)
    {"id": 42, "text": "I prefer solving people and process problems over purely technical challenges", "section": "it_prefs", "trait": "problem_solving", "reverse": False},
    {"id": 43, "text": "I enjoy breaking down complex business requirements into actionable tasks", "section": "it_prefs", "trait": "problem_solving", "reverse": False},
    {"id": 44, "text": "I like balancing technical feasibility with business value and user needs", "section": "it_prefs", "trait": "problem_solving", "reverse": False},
    # Career Growth Direction (45-46)
    {"id": 45, "text": "I see myself growing into leadership roles that combine technical and business expertise", "section": "it_prefs", "trait": "leadership_growth", "reverse": False},
    {"id": 46, "text": "I'm more interested in broad business impact than deep technical specialization", "section": "it_prefs", "trait": "leadership_growth", "reverse": False},
    # Work Environment (47-48)
    {"id": 47, "text": "I thrive in dynamic environments where requirements and priorities change frequently", "section": "it_prefs", "trait": "dynamic_environment", "reverse": False},
    {"id": 48, "text": "I prefer roles where I interact with diverse stakeholders (users, developers, executives)", "section": "it_prefs", "trait": "dynamic_environment", "reverse": False},
]


def score_level(score: int, min_val: int, max_val: int) -> str:
    """Convert a raw score to Low/Moderate/High"""
    range_size = max_val - min_val
    low_cutoff = min_val + range_size * 0.4
    high_cutoff = min_val + range_size * 0.7
    if score <= low_cutoff:
        return "Low"
    elif score <= high_cutoff:
        return "Moderate"
    return "High"


def score_assessment(responses: dict) -> dict:
    """
    responses: {question_id (int): answer (1-5)}
    Returns full User Profile psychological scores.
    """
    # ── Big Five ──────────────────────────────────────────────────
    big_five_traits = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
    big_five_scores = {t: 0 for t in big_five_traits}
    for q in QUESTIONS:
        if q["section"] != "big_five":
            continue
        ans = responses.get(q["id"], 3)
        val = (6 - ans) if q["reverse"] else ans
        big_five_scores[q["trait"]] += val

    big_five_results = {}
    for trait, score in big_five_scores.items():
        big_five_results[trait] = {
            "score": score,
            "level": score_level(score, 4, 20)
        }

    # ── Holland Code ──────────────────────────────────────────────
    holland_traits = ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"]
    holland_scores = {t: 0 for t in holland_traits}
    for q in QUESTIONS:
        if q["section"] != "holland":
            continue
        ans = responses.get(q["id"], 3)
        holland_scores[q["trait"]] += ans

    # Rank: top 3 = High, next 2 = Moderate, last 1 = Low
    ranked = sorted(holland_scores.items(), key=lambda x: x[1], reverse=True)
    holland_results = {}
    for i, (trait, score) in enumerate(ranked):
        if i < 3:
            level = "High"
        elif i < 5:
            level = "Moderate"
        else:
            level = "Low"
        holland_results[trait] = {"score": score, "level": level}

    # ── IT Work Preferences ──────────────────────────────────────
    pref_scores = {"collaboration": 0, "problem_solving": 0, "leadership_growth": 0, "dynamic_environment": 0}
    for q in QUESTIONS:
        if q["section"] != "it_prefs":
            continue
        pref_scores[q["trait"]] += responses.get(q["id"], 3)

    it_pref_results = {
        "collaboration": {"score": pref_scores["collaboration"], "level": score_level(pref_scores["collaboration"], 3, 15)},
        "problem_solving": {"score": pref_scores["problem_solving"], "level": score_level(pref_scores["problem_solving"], 3, 15)},
        "leadership_growth": {"score": pref_scores["leadership_growth"], "level": score_level(pref_scores["leadership_growth"], 2, 10)},
        "dynamic_environment": {"score": pref_scores["dynamic_environment"], "level": score_level(pref_scores["dynamic_environment"], 2, 10)},
    }

    return {
        "personality_traits": big_five_results,
        "work_style": holland_results,
        "work_values": it_pref_results,
    }
