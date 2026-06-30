# ADR-002: IBGE/UFPA Statistical Heuristics as AI Guardrails

**Status:** Accepted  
**Date:** 2026-06-28  
**Decision Makers:** Anderson (Tech Lead)  

---

## Context

DataMind BI is designed for users who may not have formal statistical training. The system must prevent them from producing methodologically invalid outputs — wrong chart types, improper rounding, arithmetic on categorical data — even when they explicitly request them.

The normative source is the **UFPA Statistics curriculum** (Chapters 1–7+12), which codifies rules from the **IBGE (Brazilian Institute of Geography and Statistics)**, including the 1993 Tabular Presentation Norms.

## Decision

We will **hardcode** the UFPA/IBGE statistical rules into two enforcement layers:

1. **Backend Heuristics Module (`heuristics.py`):** Deterministic Python functions that classify variables, validate chart eligibility, apply rounding, and enforce table formatting rules. These run *before* and *after* any AI interaction.

2. **AI Prompt Injection (`prompt_factory.py`):** The IBGE rules are injected into Gemini's system prompt as explicit constraints. The AI is instructed to refuse invalid requests and cite the specific textbook chapter.

This dual-layer approach ensures that even if the AI ignores a prompt instruction, the backend heuristics will catch the violation.

## Codified Rules

### R1 — Variable Classification (Ch. 1.15)

Every column must be classified into one of four types:

| Type | Examples | Allowed Operations |
|------|----------|--------------------|
| **Qualitative Nominal** | Gender, City, Product Code | Count, Mode, Frequency |
| **Qualitative Ordinal** | Education Level, Rating (Low/Med/High) | Count, Mode, Median, Frequency |
| **Quantitative Discrete** | Number of children, Defect count | All arithmetic, Classless frequency distribution |
| **Quantitative Continuous** | Height, Revenue, Temperature | All arithmetic, Classed frequency distribution (Sturges) |

**Enforcement:** The backend auto-classifies columns on upload. The AI prompt includes the classification so Gemini knows which operations are valid.

### R2 — Forbidden Operations on Qualitative Variables (Ch. 4.2, 4.3)

- **Nominal:** No mean, median, sum, standard deviation. Only count, mode, and frequency.
- **Ordinal:** No mean, sum, standard deviation. Mode and median are allowed.

**Enforcement:** `guardrails.py` intercepts user prompts requesting invalid operations and returns a pedagogical refusal.

### R3 — IBGE Rounding Rules (Ch. 5.7, 1993 Norm)

```
if digit_to_discard <= 4:  keep unchanged
if digit_to_discard >= 5:  add 1 to preceding digit
```

**Critical constraint:** Successive rounding is **strictly prohibited**.  
- ✅ `17.3452` → `17.3` (direct to 1 decimal)  
- ❌ `17.3452` → `17.35` → `17.4` (successive — forbidden)  

**Enforcement:** A dedicated `ibge_round()` function operates on the original value at the target precision. It is never called twice on the same value.

### R4 — Tabular Presentation Norms (Ch. 5.1)

| Rule | Description |
|------|-------------|
| No vertical borders | External and internal vertical lines are forbidden |
| No internal horizontal separators | Only header and footer get horizontal rules |
| Mandatory "Source:" footer | Every table must cite its data source |
| Null convention | `0` for true zero; `-` for data not applicable; `..` for data not available |

**Enforcement:** The `IBGETableSpec` Pydantic schema enforces these rules at serialization time. The frontend `IBGETable.tsx` component renders accordingly. The PDF generator (`reportlab`) draws only horizontal rules.

### R5 — Smart Chart Selection (Ch. 6.5, 6.6, 6.9, 6.11)

```
IF series_type == "temporal" AND periods > 5:
    chart = "LINE"
ELIF series_type == "temporal" AND periods <= 5:
    chart = "COLUMN"
ELIF has_long_labels OR series_type == "geographic":
    chart = "HORIZONTAL_BAR"
ELIF variable_type == "NOMINAL" AND categories <= 7:
    chart = "PIE"  # allowed, not forced
ELSE:
    chart = "COLUMN"  # safe default
```

**Enforcement:** `prompt_factory.py` injects these rules into the Gemini system prompt. `guardrails.py` validates the `ChartSpec` returned by the AI before forwarding to the frontend.

### R6 — Chart Aspect Ratio (Ch. 6.5)

The chart frame (bounding rectangle) must maintain a width-to-height ratio between **1:0.57** and **1:0.80**.

- Recommended ratios: **5:4** (1:0.80) or **7:4** (1:0.57).
- This is enforced on the frontend via CSS container constraints.

### R7 — Frequency Distribution: Classless (Ch. 7.3)

For **discrete** variables, the table must include:
- `fᵢ` — Absolute frequency  
- `fᵣ` — Relative frequency (`fᵢ / n`)  
- `fᵣ%` — Relative percentage (`fᵣ × 100`)  
- `Fᵢ` — Cumulative frequency below (ascending)  
- `Fⱼ` — Cumulative frequency above (descending)  

**Integrity constraint:** `Σfᵣ` must equal exactly `1.00` and `Σfᵣ%` must equal exactly `100%`.

### R8 — Frequency Distribution: Classed / Sturges (Ch. 7.3)

For **continuous** variables:
1. Total Amplitude: `AT = xmax − xmin`
2. Number of classes: `K ≅ 1 + 3.3 · log₁₀(n)` (Sturges) or `K = √n` (Square Root)
3. Interval width: `h = AT / K`
4. Class limits: closed-left, open-right notation `├`
5. Midpoint: `xᵢ = (lower_limit + upper_limit) / 2`

**Future-proofing:** The data model stores `xᵢ · fᵢ` and `(xᵢ − x̄)² · fᵢ` vectors to support mean, variance, and standard deviation calculations from grouped data (Chapters 8–10).

### R9 — Sampling Formulas (Ch. 2)

| Method | Formula |
|--------|---------|
| First approximation | `n₀ = 1 / (E₀²)` |
| Corrected sample size | `n = (N · n₀) / (N + n₀)` |
| Systematic interval | `k = floor(N / n)` |
| Stratified Uniform | `nₕ = n / m` |
| Stratified Proportional | `nₕ = n · (Nₕ / N)` |

## Alternatives Considered

### Alternative A: Let the AI Decide

Trust Gemini to apply statistical rules based on its training data.

**Rejected.** LLMs have no guaranteed adherence to specific academic norms. They may know "general statistics" but not the exact IBGE 1993 rounding rule or the UFPA-specific chart restrictions.

### Alternative B: Client-Side Only Validation

Enforce rules only in the React frontend.

**Rejected.** This can be bypassed via direct API calls. Rules must be enforced at the backend level.

### Alternative C: Configuration-Driven Rules (YAML/JSON)

Store rules in a config file rather than code.

**Partially accepted for future iterations.** For the MVP, rules are hardcoded in `heuristics.py` for clarity and testability. A rule engine could be introduced later if multi-institution support is needed (e.g., different universities with different textbook norms).

## Consequences

### Positive
- **Academic compliance:** Every output is traceable to a specific textbook chapter.
- **Pedagogical value:** Error messages teach users *why* their request was wrong, not just *that* it was wrong.
- **Dual-layer safety:** Even if the AI hallucates a bad chart type, the backend catches it.
- **Testability:** Every rule is a pure function with deterministic input/output — ideal for unit testing.

### Negative
- **Rigidity:** Rules are UFPA-specific. Supporting other institutions' curricula would require refactoring.
- **Maintenance:** If the UFPA textbook is updated, rules must be manually synchronized.

## Related Documents

- [PRD — RF01, RF08, RF12, RF13, RF18, RNF01–RNF03](../PRD.md)
- [US-08: IBGE-Compliant Rounding](../USER_STORIES.md)
- [US-13: Smart Chart Selection](../USER_STORIES.md)
- [US-17: Methodological Guardrail](../USER_STORIES.md)
- [ADR-001: DuckDB Sandbox](001-duckdb-sandbox.md)
