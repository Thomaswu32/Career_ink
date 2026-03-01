"""
Script to parse all 50 career prospect .docx files and produce a Python dict
of enriched content per career profile.

Uses zipfile + regex only (python-docx is NOT available).
"""

import zipfile
import re
import html
from pathlib import Path

SOURCE_DIR = Path(
    "/mnt/efs/spaces/57a688d2-e262-43ed-b1f5-fa8fce0239e6/"
    "828c25c2-915a-4c35-a3f4-0593f0e9a317/careerink/backend/data/career_reports"
)
OUTPUT_FILE = Path(
    "/mnt/efs/spaces/57a688d2-e262-43ed-b1f5-fa8fce0239e6/"
    "828c25c2-915a-4c35-a3f4-0593f0e9a317/careerink/backend/data/career_reports_content.py"
)

# ─── XML extraction ───────────────────────────────────────────────────────────

PARA_RE = re.compile(r"<w:p[ >].*?</w:p>", re.DOTALL)
TEXT_RE = re.compile(r"<w:t[^>]*>(.*?)</w:t>", re.DOTALL)


def extract_paragraphs(docx_path: Path) -> list:
    """Open a .docx file and return a list of plain-text paragraph strings."""
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml").decode("utf-8")

    paragraphs = []
    for para_xml in PARA_RE.findall(xml):
        texts = TEXT_RE.findall(para_xml)
        raw = "".join(texts).strip()
        # Decode HTML/XML entities: &amp; → &, &apos; → ', &quot; → "
        decoded = html.unescape(raw)
        if decoded:
            paragraphs.append(decoded)
    return paragraphs


# ─── Section extraction ───────────────────────────────────────────────────────

SECTION_HEADINGS = {
    "Overview",
    "What the Role Involves",
    "Key Skills Required",
    "What Kind of Person Tends to Succeed",
    "Career Progression",
    "Salary Range & Annual Growth",
    "Data Sources",
}

TABLE_SKIP = {
    "Role Category",
    "Technical",
    "Salary Growth (YoY)",
    "See Salary section below",
    "Remote Friendly",
    "High (majority of roles)",
    "Moderate – some on-site required",
    "Low – primarily on-site",
    "Emerging",
    "Leadership",
    "Hybrid",
    "Engineering",
    "Management",
    "Design",
    "Security",
    "Operations",
    "Architecture",
    "Specialized",
}


def parse_sections(paragraphs: list) -> dict:
    """Walk the paragraph list and bucket body text into named sections."""
    sections: dict = {}
    current: str = None

    for para in paragraphs:
        stripped = para.strip()
        if "IT Workforce Profile" in stripped:
            continue
        if stripped in TABLE_SKIP:
            continue
        if stripped in SECTION_HEADINGS:
            current = stripped
            sections.setdefault(current, [])
            continue
        if current == "Data Sources":
            continue
        if current is not None:
            sections[current].append(stripped)

    return {heading: " ".join(lines) for heading, lines in sections.items()}


# ─── Salary helpers ───────────────────────────────────────────────────────────

# Matches $NNN,NNN  $5M  $1.5M  $250k  and ranges with –
_AMT = r"\$([\d,]+(?:\.\d+)?[kKmM]?)\+?"
DOLLAR_RANGE_RE = re.compile(
    rf"({_AMT})(?:[–\-]({_AMT}))?",
)

# International salary context sentence starters – truncate before these
_INTL_CUTOFF = re.compile(r"\bGlobally,\s", re.IGNORECASE)


def _preprocess_salary_text(text: str) -> str:
    """Remove international/global salary clauses that would pollute US-band extraction."""
    m = _INTL_CUTOFF.search(text)
    if m:
        return text[: m.start()]
    return text


def _parse_amount(raw: str) -> int:
    s = raw.lstrip("$").replace(",", "").rstrip("+")
    if s.lower().endswith("m"):
        return int(float(s[:-1]) * 1_000_000)
    if s.lower().endswith("k"):
        return int(float(s[:-1]) * 1_000)
    try:
        return int(float(s))
    except ValueError:
        return 0


def _fmt_amount(raw: str) -> str:
    """'$120,000' → '120k', '$5M' → '5M'."""
    s = raw.lstrip("$").replace(",", "").rstrip("+")
    if s.lower().endswith("m"):
        val = float(s[:-1])
        return f"{int(val)}M" if val == int(val) else f"{val}M"
    if s.lower().endswith("k"):
        val = float(s[:-1])
        return f"{int(val)}k" if val == int(val) else f"{val}k"
    try:
        val = int(float(s))
    except ValueError:
        return s
    if val >= 1_000_000:
        return f"{val // 1_000_000}M"
    if val >= 1_000:
        return f"{val // 1_000}k"
    return str(val)


def _normalise_range(lo_raw: str, hi_raw: str = None, trailing_plus: bool = False) -> str:
    lo_fmt = _fmt_amount(lo_raw)
    plus_str = "+" if trailing_plus else ""
    if hi_raw:
        hi_fmt = _fmt_amount(hi_raw)
        return f"USD {lo_fmt}–{hi_fmt}{plus_str}"
    return f"USD {lo_fmt}{plus_str}"


def _extract_ordered_ranges(text: str) -> list:
    """
    Return [(lo_value_int, label_str), ...] sorted ascending by lo_value.
    Only includes figures with lo_value >= $30,000.
    """
    seen_vals: set = set()
    results: list = []
    for m in DOLLAR_RANGE_RE.finditer(text):
        lo_raw = m.group(1)
        hi_raw = m.group(3)   # group 3: second capture inside second _AMT occurrence
        lo_val = _parse_amount(lo_raw)
        if lo_val < 30_000:
            continue
        if lo_val in seen_vals:
            continue
        seen_vals.add(lo_val)
        after = text[m.end(): m.end() + 1]
        has_plus = m.group(0).endswith("+") or after == "+"
        label = _normalise_range(lo_raw, hi_raw, trailing_plus=has_plus)
        results.append((lo_val, label))
    results.sort(key=lambda x: x[0])
    return results


_EXEC_KW = re.compile(
    r"director|vp\b|vice\s+president|principal|cto\b|ciso\b|caio\b|coo\b|cpo\b|"
    r"executive|c-suite|c-level|fortune\s+500|caio\b",
    re.IGNORECASE,
)


def parse_compensation_bands(compensation_text: str) -> dict:
    """
    Map salary figures to Entry / Mid / Senior / Lead bands.

    Algorithm
    ---------
    1. Pre-process: remove international salary clauses.
    2. Extract all distinct dollar ranges in ascending order (lo-value sorted).
    3. Assign positionally based on count:
       - 4+ figures: Entry=fig[0], Mid=fig[1], Senior=fig[2], Lead=fig[3]
       - 3 figures:  Entry=fig[0], Mid=fig[1], Senior=fig[2], Lead=Senior+'+'
       - 2 figures (exec role): Entry=N/A, Mid=fig[0], Senior=fig[1], Lead=Senior+'+'
       - 2 figures (non-exec):  Entry=fig[0], Mid=fig[1], Senior=Mid+'+', Lead=N/A
       - 1 figure:   Entry=fig[0], Mid=fig[0]+'+', Senior=N/A, Lead=N/A
    """
    BANDS = ["Entry", "Mid", "Senior", "Lead"]

    clean_text = _preprocess_salary_text(compensation_text)
    ordered = _extract_ordered_ranges(clean_text)
    n = len(ordered)

    if n == 0:
        return {b: "N/A" for b in BANDS}

    vals = [label for _, label in ordered]

    def _derive_plus(label: str) -> str:
        """Turn 'USD 250k' or 'USD 120k–150k' into 'USD 250k+' / 'USD 150k+'."""
        # Extract the highest figure in the label
        nums = re.findall(r"(\d+(?:\.\d+)?[kKmM]?)", label)
        if not nums:
            return label + "+"
        last = nums[-1]
        return f"USD {last}+"

    if n >= 4:
        bands = dict(zip(BANDS, vals[:4]))
    elif n == 3:
        bands = {
            "Entry":  vals[0],
            "Mid":    vals[1],
            "Senior": vals[2],
            "Lead":   _derive_plus(vals[2]),
        }
    elif n == 2:
        if _EXEC_KW.search(compensation_text):
            # Exec-skewed: two figures are Mid and Lead tiers
            bands = {
                "Entry": "N/A",
                "Mid":    vals[0],
                "Senior": vals[1],
                "Lead":   _derive_plus(vals[1]),
            }
        else:
            bands = {
                "Entry":  vals[0],
                "Mid":    vals[1],
                "Senior": _derive_plus(vals[1]),
                "Lead":   "N/A",
            }
    else:  # n == 1
        bands = {
            "Entry":  vals[0],
            "Mid":    _derive_plus(vals[0]),
            "Senior": "N/A",
            "Lead":   "N/A",
        }

    return bands


# ─── Career progression extraction ───────────────────────────────────────────

LEVEL_ONLY_RE = re.compile(
    r"^(?:I{1,3}|IV|V|[1-5]|Jr\.?|Sr\.?|Junior|Senior|Staff|Principal|"
    r"Distinguished|Lead|Fellow|Researcher|Postdoc|PhD)$",
    re.IGNORECASE,
)


def _clean_first_part(part: str) -> str:
    """
    Remove introductory prose before the actual title in the first arrow-chain part.
    'Typical paths: Security Analyst'   → 'Security Analyst'
    '...management ladder (Engineering Manager'  → 'Engineering Manager'
    """
    part = part.strip()
    for pattern in [
        r".*\bfrom\s+(.+)$",
        r".*\bvia\s+(.+)$",
        r".*:\s+(.+)$",
    ]:
        m = re.match(pattern, part, re.DOTALL | re.IGNORECASE)
        if m:
            part = m.group(1).strip()
            break
    # If there's an unclosed '(', take from the last '('
    if "(" in part and not part.endswith(")"):
        last_paren = part.rfind("(")
        part = part[last_paren + 1 :].strip()
    return part.strip(" ().,;:")


def _clean_last_part(part: str) -> str:
    """
    Remove trailing sentence noise from the last arrow-chain part.
    'VP of AI) usually opens around the Staff level.' → 'VP of AI'
    """
    part = part.strip()
    # ') followed by space + lowercase word' = trailing sentence noise
    part = re.sub(r"\)\s+[a-z].*$", "", part, flags=re.DOTALL)
    return part.rstrip(".),;: ")


def parse_career_progression(progression_text: str) -> list:
    """
    Extract 3–6 job-title steps from the career progression section.

    Priority:
    1. Arrow-separated chain (→) – use sentence with the most arrows.
    2. Capitalised title-pattern regex (with lookahead to prevent lazy truncation).
    3. Comma/semicolon-delimited fragment fallback.
    """

    # ── Strategy 1: arrow chain ──────────────────────────────────────────────
    if "→" in progression_text:
        arrow_sents = sorted(
            [(s.count("→"), s)
             for s in re.split(r"(?<=[.!?])\s+", progression_text)
             if "→" in s],
            reverse=True,
        )
        if arrow_sents:
            best_sent = arrow_sents[0][1]
            raw_parts = best_sent.split("→")
            cleaned: list = []

            for i, part in enumerate(raw_parts):
                part = part.strip()
                if i == 0:
                    part = _clean_first_part(part)
                elif i == len(raw_parts) - 1:
                    part = _clean_last_part(part)
                else:
                    part = part.strip(" ().,;:")

                if not part or len(part) < 2:
                    continue

                # Expand shorthand level tokens like 'II', 'Senior', 'Staff'
                if LEVEL_ONLY_RE.match(part) and cleaned:
                    base = re.sub(
                        r"\s+(?:I{1,3}|IV|V|[1-5])\s*$", "", cleaned[0]
                    ).strip()
                    part = f"{base} {part}"

                cleaned.append(part)

            if len(cleaned) >= 2:
                return cleaned[:6]

    # ── Strategy 2: capitalised title patterns ───────────────────────────────
    # Use a lookahead on the title-end alternatives to prevent lazy truncation.
    title_re = re.compile(
        r"(?:"
        # Prefix + title: require word boundary / punctuation at end
        r"(?:Junior|Associate|Entry[\-\s]Level?|Jr\.?)\s+(?:[A-Z][A-Za-z/&]+\s*)+?"
        r"(?=[,.\n]|\band\b|\bor\b|$)"
        r"|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:I{1,3}|IV|V|1|2|3)\b"
        r"|(?:Senior|Staff|Principal|Distinguished|Lead|Chief|Head\s+of|"
        r"Director(?:\s+of)?|VP(?:\s+of)?|Vice\s+President(?:\s+of)?|Fellow|"
        r"SVP(?:\s+of)?|EVP(?:\s+of)?)\s+(?:[A-Z][A-Za-z/&]+\s*)+?"
        r"(?=[,.\n]|\band\b|\bor\b|$)"
        r"|Engineering\s+Manager"
        r"|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+"
        r"(?:Manager|Architect|Engineer(?:\s+[A-Z])?|Scientist|Developer|"
        r"Analyst|Lead|Director|Specialist|Officer|Writer|Consultant)\b"
        r"|C[A-Z]{1,3}O\b"
        r")",
        re.UNICODE,
    )

    matches = title_re.findall(progression_text)
    seen: set = set()
    unique: list = []
    for m in matches:
        m = m.strip().rstrip(".,; ")
        key = m.lower()
        if key not in seen and len(m) > 3:
            seen.add(key)
            unique.append(m)

    if len(unique) >= 2:
        return unique[:6]

    # ── Strategy 3: fragment fallback ────────────────────────────────────────
    delimiters = re.compile(r"[,;]|\band\b|\bthen\b|\bbefore\b", re.IGNORECASE)
    fragments = delimiters.split(progression_text)
    titles: list = []
    for frag in fragments:
        frag = frag.strip()
        if re.match(r"^[A-Z]", frag) and 5 < len(frag) < 60:
            titles.append(frag)
    if len(titles) >= 2:
        return titles[:6]

    return [progression_text[:80].strip()]


# ─── Main parsing loop ────────────────────────────────────────────────────────

def process_all_files() -> dict:
    career_data: dict = {}
    docx_files = sorted(SOURCE_DIR.glob("*.docx"))
    print(f"Found {len(docx_files)} .docx files\n")

    for docx_path in docx_files:
        m = re.match(r"^(\d+)_", docx_path.name)
        if not m:
            print(f"  WARNING: Cannot extract ID from {docx_path.name}, skipping.")
            continue
        career_id = m.group(1)

        try:
            paragraphs = extract_paragraphs(docx_path)
            sections = parse_sections(paragraphs)
        except Exception as exc:
            print(f"  ERROR processing {docx_path.name}: {exc}")
            continue

        role_overview            = sections.get("Overview", "")
        responsibilities         = sections.get("What the Role Involves", "")
        skills_content           = sections.get("Key Skills Required", "")
        what_makes_great         = sections.get("What Kind of Person Tends to Succeed", "")
        career_progression_text  = sections.get("Career Progression", "")
        compensation_text        = sections.get("Salary Range & Annual Growth", "")

        compensation_bands = parse_compensation_bands(compensation_text)
        career_progression = parse_career_progression(career_progression_text)

        career_data[career_id] = {
            "role_overview":           role_overview,
            "responsibilities":        responsibilities,
            "skills_content":          skills_content,
            "what_makes_great":        what_makes_great,
            "career_progression_text": career_progression_text,
            "compensation_text":       compensation_text,
            "career_progression":      career_progression,
            "compensation_bands":      compensation_bands,
        }
        print(f"  Parsed {career_id}: {docx_path.name}")

    return career_data


# ─── Output writer ────────────────────────────────────────────────────────────

def _py_str(s: str) -> str:
    """Return a valid Python double-quoted string literal."""
    s = s.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'


def write_output(career_data: dict, output_path: Path) -> None:
    lines = [
        "# Auto-generated from career report .docx files",
        "CAREER_REPORTS_CONTENT = {",
    ]

    for career_id in sorted(career_data.keys(), key=lambda x: int(x)):
        entry = career_data[career_id]
        lines.append(f'    "{career_id}": {{')

        for field in [
            "role_overview",
            "responsibilities",
            "skills_content",
            "what_makes_great",
            "career_progression_text",
            "compensation_text",
        ]:
            val = entry.get(field, "")
            lines.append(f"        {field!r}: {_py_str(val)},")

        prog = entry.get("career_progression", [])
        prog_repr = "[" + ", ".join(_py_str(s) for s in prog) + "]"
        lines.append(f"        'career_progression': {prog_repr},")

        bands = entry.get("compensation_bands", {})
        bands_inner = ", ".join(f"{k!r}: {_py_str(v)}" for k, v in bands.items())
        lines.append(f"        'compensation_bands': {{{bands_inner}}},")

        lines.append("    },")

    lines.append("}")
    lines.append("")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nOutput written to: {output_path}")


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Parsing career report .docx files ===\n")
    career_data = process_all_files()
    print(f"\nTotal careers parsed: {len(career_data)}")
    write_output(career_data, OUTPUT_FILE)

    print("\n=== SAMPLE: First 2 entries ===\n")
    for cid in sorted(career_data.keys(), key=lambda x: int(x))[:2]:
        entry = career_data[cid]
        print(f"career_id: {cid!r}")
        print(f"  role_overview        : {entry['role_overview'][:120]!r}...")
        print(f"  responsibilities     : {entry['responsibilities'][:120]!r}...")
        print(f"  skills_content       : {entry['skills_content'][:120]!r}...")
        print(f"  what_makes_great     : {entry['what_makes_great'][:120]!r}...")
        print(f"  career_progression   : {entry['career_progression']}")
        print(f"  compensation_bands   : {entry['compensation_bands']}")
        print()

    print("=== Spot checks ===\n")
    for cid in ["05", "08", "11", "29", "32", "39", "42", "48"]:
        entry = career_data.get(cid, {})
        print(f"career_id: {cid!r}")
        print(f"  career_progression   : {entry.get('career_progression', [])}")
        print(f"  compensation_bands   : {entry.get('compensation_bands', {})}")
        print()
