"""Agent 2 LangGraph — Career Path Discovery Pipeline"""
from langgraph.graph import StateGraph, END
from agents.agent2.state import Agent2State
from agents.agent2.nodes import match_careers_node, generate_justifications_node

# ── Build the graph ───────────────────────────────────────────────────────────
builder = StateGraph(Agent2State)

builder.add_node("match_careers", match_careers_node)
builder.add_node("generate_justifications", generate_justifications_node)

builder.set_entry_point("match_careers")

builder.add_conditional_edges(
    "match_careers",
    lambda s: "generate_justifications" if not s.get("error") else END,
    {"generate_justifications": "generate_justifications", END: END},
)
builder.add_edge("generate_justifications", END)

agent2_graph = builder.compile()


def run_career_discovery(user_profile: dict) -> dict:
    """Run Agent 2: career matching + justification generation."""
    result = agent2_graph.invoke({
        "user_profile": user_profile,
        "step": "match",
    })
    return result
