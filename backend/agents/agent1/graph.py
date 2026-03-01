"""Agent 1 LangGraph — CV Analysis & Psychological Assessment Pipeline"""
from langgraph.graph import StateGraph, END
from agents.agent1.state import Agent1State
from agents.agent1.nodes import (
    validate_cv_node,
    parse_cv_node,
    score_assessment_node,
    assemble_profile_node,
)

# ── Build the graph ───────────────────────────────────────────────────────────
builder = StateGraph(Agent1State)

builder.add_node("validate_cv", validate_cv_node)
builder.add_node("parse_cv", parse_cv_node)
builder.add_node("score_assessment", score_assessment_node)
builder.add_node("assemble_profile", assemble_profile_node)

builder.set_entry_point("validate_cv")

builder.add_conditional_edges(
    "validate_cv",
    lambda s: "parse_cv" if not s.get("error") else END,
    {"parse_cv": "parse_cv", END: END},
)
builder.add_edge("parse_cv", END)  # CV parsing completes step 1.2 — skills validated via API

# Assessment subgraph (invoked separately after skills confirmation)
builder.add_conditional_edges(
    "score_assessment",
    lambda s: "assemble_profile" if not s.get("error") else END,
    {"assemble_profile": "assemble_profile", END: END},
)
builder.add_edge("assemble_profile", END)

agent1_graph = builder.compile()


def run_cv_analysis(cv_text: str) -> dict:
    """Run Agent 1 Step 1.1–1.2: CV validation + skill extraction."""
    result = agent1_graph.invoke({"cv_text": cv_text, "step": "validate"})
    return result


def run_assessment_scoring(state: dict, responses: dict) -> dict:
    """Run Agent 1 Step 1.3–1.5: psychological scoring + profile assembly."""
    input_state = {**state, "assessment_responses": responses}
    result = agent1_graph.invoke({**input_state, "step": "score_assessment"})
    # Invoke scoring directly since graph starts at validate_cv
    from agents.agent1.nodes import score_assessment_node, assemble_profile_node
    scored = score_assessment_node({**input_state})
    assembled = assemble_profile_node(scored)
    return assembled
