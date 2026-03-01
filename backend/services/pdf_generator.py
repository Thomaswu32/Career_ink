"""PDF Career Recommendations Report Generator
Format: A4 portrait | Font: Inter/Helvetica | CareerInk brand palette
"""
import io
import os
import re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ── Brand Colors ──────────────────────────────────────────────────────────────
NAVY = colors.HexColor("#0A0F1E")
BLUE = colors.HexColor("#1E90FF")
CYAN = colors.HexColor("#00BFFF")
WHITE = colors.HexColor("#F4F6F8")
SILVER = colors.HexColor("#A8B4C8")
SUCCESS = colors.HexColor("#22C55E")
WARNING = colors.HexColor("#F59E0B")
SURFACE = colors.white
SUBTLE = colors.HexColor("#F1F5F9")
MUTED = colors.HexColor("#64748B")
BORDER = colors.HexColor("#E2E8F0")
TEXT_PRIMARY = colors.HexColor("#0A0F1E")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm


def _styles():
    base = getSampleStyleSheet()
    s = {}
    s["h1"] = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=28, textColor=WHITE,
                             spaceAfter=8, alignment=TA_LEFT, leading=34)
    s["h2"] = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=18, textColor=TEXT_PRIMARY,
                             spaceAfter=6, spaceBefore=12, leading=22)
    s["h3"] = ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=14, textColor=TEXT_PRIMARY,
                             spaceAfter=4, spaceBefore=8, leading=18)
    s["h4"] = ParagraphStyle("h4", fontName="Helvetica-Bold", fontSize=12, textColor=BLUE,
                             spaceAfter=4, spaceBefore=6, leading=15)
    s["body"] = ParagraphStyle("body", fontName="Helvetica", fontSize=11, textColor=TEXT_PRIMARY,
                               spaceAfter=4, leading=16)
    s["small"] = ParagraphStyle("small", fontName="Helvetica", fontSize=9, textColor=MUTED,
                                spaceAfter=2, leading=12)
    s["label"] = ParagraphStyle("label", fontName="Helvetica-Bold", fontSize=9, textColor=MUTED,
                                spaceAfter=2, leading=12)
    s["tagline"] = ParagraphStyle("tagline", fontName="Helvetica-Oblique", fontSize=13,
                                  textColor=SILVER, spaceAfter=6, leading=18)
    s["quote"] = ParagraphStyle("quote", fontName="Helvetica-Oblique", fontSize=11,
                                textColor=MUTED, spaceAfter=4, leading=15,
                                leftIndent=12, borderPad=4)
    s["cover_sub"] = ParagraphStyle("cover_sub", fontName="Helvetica", fontSize=13,
                                    textColor=SILVER, spaceAfter=4, leading=18)
    s["match_pct"] = ParagraphStyle("match_pct", fontName="Helvetica-Bold", fontSize=24,
                                    textColor=BLUE, spaceAfter=2, leading=28)
    return s


def _header_footer(canvas, doc):
    """Header/footer on every page except cover (page 1)."""
    canvas.saveState()
    if doc.page > 1:
        # Header
        canvas.setFillColor(NAVY)
        canvas.rect(0, PAGE_H - 12 * mm, PAGE_W, 12 * mm, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 9)
        canvas.drawString(MARGIN, PAGE_H - 8 * mm, "CareerInk")
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 8 * mm, "AI-Powered Career Recommendations")
        # Footer
        canvas.setFillColor(SUBTLE)
        canvas.rect(0, 0, PAGE_W, 10 * mm, fill=1, stroke=0)
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 8)
        canvas.drawString(MARGIN, 3.5 * mm, "Powered by CareerInk AI  ·  careerink.io")
        canvas.drawRightString(PAGE_W - MARGIN, 3.5 * mm, f"Page {doc.page}")
        # Top blue line
        canvas.setStrokeColor(BLUE)
        canvas.setLineWidth(2)
        canvas.line(0, PAGE_H - 12 * mm, PAGE_W, PAGE_H - 12 * mm)
    canvas.restoreState()


def generate_pdf(user_profile: dict, career_matches: list, user_name: str = "Professional") -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=MARGIN + 12 * mm, bottomMargin=MARGIN + 10 * mm,
        leftMargin=MARGIN, rightMargin=MARGIN,
        title=f"CareerInk Career Report — {user_name}",
        author="CareerInk AI",
    )
    S = _styles()
    story = []
    today = datetime.now().strftime("%B %d, %Y")
    file_date = datetime.now().strftime("%Y%m%d")

    # ── PAGE 1: COVER ─────────────────────────────────────────────
    story.append(Spacer(1, 30 * mm))
    story.append(Paragraph("CareerInk", ParagraphStyle("brand", fontName="Helvetica-Bold",
                            fontSize=36, textColor=BLUE, leading=42)))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Career Recommendations Report", ParagraphStyle("cover_title",
                            fontName="Helvetica-Bold", fontSize=22, textColor=WHITE, leading=28)))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(f"Prepared for: {user_name}", S["cover_sub"]))
    story.append(Paragraph(f"Generated: {today}", S["cover_sub"]))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph('"From Career Confusion to Clear Career Direction in 30–45 Minutes"',
                            S["tagline"]))
    story.append(Spacer(1, 20 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "CONFIDENTIAL — This report is generated exclusively for the named individual "
        "and is intended solely for personal career planning purposes.",
        ParagraphStyle("disclaimer", fontName="Helvetica-Oblique", fontSize=9,
                       textColor=SILVER, leading=13)
    ))
    story.append(PageBreak())

    # ── PAGE 2: PROFESSIONAL PROFILE SUMMARY ─────────────────────
    story.append(Paragraph("Professional Profile Summary", S["h2"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 4 * mm))

    # Current role + experience
    story.append(Paragraph(f"<b>Current Role:</b> {user_profile.get('current_role', 'Not specified')}", S["body"]))
    story.append(Paragraph(f"<b>Experience:</b> {user_profile.get('experience_years', 0)} years", S["body"]))
    story.append(Paragraph(f"<b>Education:</b> {user_profile.get('education_level', 'Not specified')}", S["body"]))
    story.append(Spacer(1, 4 * mm))

    # Technical Skills
    hard_skills = user_profile.get("hard_skills", [])
    if hard_skills:
        story.append(Paragraph("Technical Skills", S["h4"]))
        skills_text = "  ·  ".join(hard_skills[:20])
        story.append(Paragraph(skills_text, S["body"]))
        story.append(Spacer(1, 3 * mm))

    # Soft Skills
    soft_skills = user_profile.get("soft_skills_confirmed", [])
    if soft_skills:
        story.append(Paragraph("Soft Skills", S["h4"]))
        story.append(Paragraph("  ·  ".join(soft_skills[:10]), S["body"]))
        story.append(Spacer(1, 3 * mm))

    # Big Five
    personality = user_profile.get("personality_traits", {})
    if personality:
        story.append(Paragraph("Personality Profile (Big Five)", S["h4"]))
        trait_data = [["Trait", "Level", "Score"]]
        trait_labels = {
            "openness": "Openness to Experience",
            "conscientiousness": "Conscientiousness",
            "extraversion": "Extraversion",
            "agreeableness": "Agreeableness",
            "neuroticism": "Emotional Stability"
        }
        for key, label in trait_labels.items():
            val = personality.get(key, {})
            level = val.get("level", "—") if isinstance(val, dict) else val
            score = val.get("score", "—") if isinstance(val, dict) else "—"
            trait_data.append([label, level, str(score)])
        t = Table(trait_data, colWidths=[90 * mm, 40 * mm, 30 * mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, SUBTLE]),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(t)
        story.append(Spacer(1, 3 * mm))

    # Holland Code
    work_style = user_profile.get("work_style", {})
    if work_style:
        story.append(Paragraph("Career Interests (Holland Code RIASEC)", S["h4"]))
        riasec_labels = {
            "realistic": "Realistic (R)",
            "investigative": "Investigative (I)",
            "artistic": "Artistic (A)",
            "social": "Social (S)",
            "enterprising": "Enterprising (E)",
            "conventional": "Conventional (C)",
        }
        riasec_data = [["Type", "Level"]]
        sorted_riasec = sorted(work_style.items(),
                               key=lambda x: {"High": 3, "Moderate": 2, "Low": 1}.get(
                                   x[1].get("level", "Low") if isinstance(x[1], dict) else x[1], 1),
                               reverse=True)
        for key, val in sorted_riasec[:3]:
            level = val.get("level", "—") if isinstance(val, dict) else val
            riasec_data.append([riasec_labels.get(key, key.title()), level])
        t2 = Table(riasec_data, colWidths=[100 * mm, 60 * mm])
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, SUBTLE]),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(t2)

    story.append(PageBreak())

    # ── PAGE 3: CAREER MATCHES OVERVIEW ──────────────────────────
    story.append(Paragraph("Career Matches Overview", S["h2"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 4 * mm))

    overview_data = [["Rank", "Role", "Family", "Match %", "Ramp-Up", "Salary Range (USD)"]]
    for i, m in enumerate(career_matches):
        sal = m.get("salary_range", {})
        sal_str = f"${sal.get('min', 0):,} – ${sal.get('max', 0):,}" if sal else "N/A"
        overview_data.append([
            f"#{i + 1}",
            m["role_name"],
            m["role_family"],
            f"{m['final_score']:.0f}%",
            f"{m['avg_ramp_up_months']} mo",
            sal_str,
        ])

    col_widths = [15 * mm, 55 * mm, 28 * mm, 20 * mm, 20 * mm, 42 * mm]
    overview_table = Table(overview_data, colWidths=col_widths, repeatRows=1)
    overview_style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, SUBTLE]),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    # Highlight #1 row
    if len(career_matches) > 0:
        overview_style.append(("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#EFF6FF")))
        overview_style.append(("LEFTPADDING", (0, 1), (0, 1), 3))
    overview_table.setStyle(TableStyle(overview_style))
    story.append(overview_table)
    story.append(PageBreak())

    # ── PAGES 4–8: CAREER DETAIL CARDS ───────────────────────────
    for i, match in enumerate(career_matches):
        story.append(Paragraph(f"#{i + 1} — {match['role_name']}", S["h2"]))
        story.append(Paragraph(f"Role Family: {match['role_family']}  ·  Seniority: {match.get('seniority_level', 'Mid')}", S["small"]))
        story.append(HRFlowable(width="100%", thickness=2, color=BLUE))
        story.append(Spacer(1, 3 * mm))

        # Match score row
        sal = match.get("salary_range", {})
        sal_str = f"${sal.get('min', 0):,} – ${sal.get('max', 0):,}" if sal else "N/A"
        metrics_data = [
            ["Match Score", "Ramp-Up", "Salary Range (USD)", "Annual Growth", "Growth Trajectory"],
            [
                f"{match['final_score']:.0f}%",
                f"{match['avg_ramp_up_months']} months",
                sal_str,
                match.get("salary_growth_yoy", "N/A"),
                match.get("growth_trajectory", "Medium"),
            ]
        ]
        mt = Table(metrics_data, colWidths=[35 * mm, 28 * mm, 50 * mm, 28 * mm, 35 * mm])
        mt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), SUBTLE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 1), (0, 1), BLUE),
            ("FONTNAME", (0, 1), (0, 1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 1), (0, 1), 16),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("PADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        story.append(mt)
        story.append(Spacer(1, 4 * mm))

        # Justification
        justification = match.get("justification", match.get("description_summary", ""))
        if justification:
            story.append(Paragraph(f'"{justification}"', S["quote"]))
            story.append(Spacer(1, 3 * mm))

        # Matched & Gap Skills
        matched = match.get("matched_skills", [])
        gap = match.get("gap_skills", [])
        if matched or gap:
            skills_data = [["Matched Skills ✓", "Gap Skills ▲"]]
            max_rows = max(len(matched), len(gap), 1)
            for j in range(max_rows):
                m_skill = matched[j] if j < len(matched) else ""
                g_skill = gap[j] if j < len(gap) else ""
                skills_data.append([m_skill, g_skill])
            st_table = Table(skills_data, colWidths=[85 * mm, 85 * mm])
            st_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#DCFCE7")),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FEF3C7")),
                ("TEXTCOLOR", (0, 0), (0, 0), colors.HexColor("#15803D")),
                ("TEXTCOLOR", (1, 0), (1, 0), colors.HexColor("#B45309")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, SUBTLE]),
                ("PADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(st_table)
            story.append(Spacer(1, 4 * mm))

        # ── Structured Career Report Sections ────────────────────────────────

        bullet_style = ParagraphStyle(
            "bullet", fontName="Helvetica", fontSize=9,
            textColor=TEXT_PRIMARY, spaceAfter=3, leading=13,
            leftIndent=10, firstLineIndent=-10
        )

        # Role Overview
        role_overview = match.get("role_overview", "")
        if role_overview:
            story.append(Paragraph("Role Overview", S["h4"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
            story.append(Spacer(1, 2 * mm))
            story.append(Paragraph(role_overview, S["body"]))
            story.append(Spacer(1, 4 * mm))

        # Key Responsibilities
        responsibilities = match.get("responsibilities", "")
        if responsibilities:
            story.append(Paragraph("Key Responsibilities", S["h4"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
            story.append(Spacer(1, 2 * mm))
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', responsibilities) if s.strip()]
            for sentence in sentences:
                story.append(Paragraph(f"\u2022  {sentence}", bullet_style))
            story.append(Spacer(1, 4 * mm))

        # Required Skills & Technologies
        required_skills = match.get("required_skills", [])
        if required_skills:
            story.append(Paragraph("Required Skills &amp; Technologies", S["h4"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
            story.append(Spacer(1, 2 * mm))
            story.append(Paragraph("  \u00b7  ".join(required_skills), S["body"]))
            story.append(Spacer(1, 4 * mm))

        # Career Progression
        career_progression = match.get("career_progression", [])
        if career_progression:
            story.append(Paragraph("Career Progression", S["h4"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
            story.append(Spacer(1, 2 * mm))
            story.append(Paragraph("  \u2192  ".join(career_progression), S["body"]))
            story.append(Spacer(1, 4 * mm))

        # Compensation
        compensation_bands = match.get("compensation_bands", {})
        if compensation_bands:
            story.append(Paragraph("Compensation", S["h4"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
            story.append(Spacer(1, 2 * mm))
            comp_data = [["Seniority", "Compensation"]]
            for band in ["Entry", "Mid", "Senior", "Lead"]:
                if compensation_bands.get(band):
                    comp_data.append([band, compensation_bands[band]])
            if len(comp_data) > 1:
                comp_table = Table(comp_data, colWidths=[40 * mm, 130 * mm])
                comp_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, SUBTLE]),
                    ("PADDING", (0, 0), (-1, -1), 5),
                ]))
                story.append(comp_table)
            story.append(Spacer(1, 4 * mm))

        # What Makes a Great [Role Name]
        what_makes_great = match.get("what_makes_great", "")
        if what_makes_great:
            story.append(Paragraph(f"What Makes a Great {match['role_name']}", S["h4"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
            story.append(Spacer(1, 2 * mm))
            story.append(Paragraph(what_makes_great, S["body"]))
            story.append(Spacer(1, 3 * mm))

        if i < len(career_matches) - 1:
            story.append(PageBreak())

    story.append(PageBreak())

    # ── LAST PAGE: NEXT STEPS ─────────────────────────────────────
    story.append(Paragraph("Your Next Steps", S["h2"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 4 * mm))

    next_steps = [
        ("1. Deep-dive into your #1 match",
         "Review the full role overview above. Research 3 companies currently hiring for this role."),
        ("2. Close your top 3 skill gaps",
         "Identify one learning resource per gap skill. Allocate 2 hours/week minimum."),
        ("3. Build your transition narrative",
         "Prepare a 2-minute story that bridges your current experience to your target role."),
    ]
    for title, desc in next_steps:
        story.append(Paragraph(title, S["h4"]))
        story.append(Paragraph(desc, S["body"]))
        story.append(Spacer(1, 3 * mm))

    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "Skills Gap Analysis & Learning Roadmap — Coming Soon",
        ParagraphStyle("coming_soon", fontName="Helvetica-Bold", fontSize=12,
                       textColor=BLUE, leading=16)
    ))
    story.append(Paragraph(
        "Sign up to be notified when Phase 2 launches: a personalized learning roadmap "
        "with curated courses and certifications for your target role.",
        S["body"]
    ))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(
        "Disclaimer: Career matches and salary data are based on aggregated market information "
        "as of 2024–2025. Results are indicative and not a guarantee of employment outcomes. "
        "Always validate recommendations with current job market research.",
        S["small"]
    ))

    # ── Build with navy cover background ─────────────────────────
    def cover_bg(canvas, doc):
        if doc.page == 1:
            canvas.saveState()
            canvas.setFillColor(NAVY)
            canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
            # Blue accent bar
            canvas.setFillColor(BLUE)
            canvas.rect(0, PAGE_H - 6 * mm, PAGE_W, 6 * mm, fill=1, stroke=0)
            canvas.restoreState()
        _header_footer(canvas, doc)

    doc.build(story, onFirstPage=cover_bg, onLaterPages=_header_footer)
    return buf.getvalue()
