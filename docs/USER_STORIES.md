# User Stories — DataMind BI

Stories are organized by functional module and mapped to requirements from the [PRD](PRD.md).

---

## Module I — Planning and Sampling

### US-01: Variable Classification on Upload
**As a** university student,  
**I want** the system to automatically classify each column of my uploaded spreadsheet as Qualitative Nominal, Qualitative Ordinal, Quantitative Discrete, or Quantitative Continuous,  
**so that** I don't misapply statistical operations to the wrong variable type.

**Acceptance Criteria:**
- [ ] On file upload, every column receives a type classification displayed in the Schema Inspector panel.
- [ ] The user can manually override the auto-detected type.
- [ ] The classification is persisted in the DuckDB session metadata.

**Relates to:** RF01

---

### US-02: Sample Size Calculation
**As a** researcher,  
**I want** to input a population size (N) and a tolerable sampling error (E₀) and receive the corrected sample size (n),  
**so that** I can plan my fieldwork with a statistically valid sample.

**Acceptance Criteria:**
- [ ] A modal or quick-action button triggers the calculator.
- [ ] The system computes `n₀ = 1/(E₀²)` then `n = (N·n₀)/(N+n₀)`.
- [ ] The result is rounded up to the next integer (you cannot survey half a person).
- [ ] A didactic tooltip `(?)` explains each formula step.

**Relates to:** RF02, RNF03

---

### US-03: Simple Random Sampling
**As a** researcher,  
**I want** to provide a population of N elements and have the system randomly select n elements without replacement,  
**so that** I can obtain an unbiased sample.

**Acceptance Criteria:**
- [ ] The system accepts N (population) and n (sample size) as inputs.
- [ ] Output is a sorted list of n unique random indices.
- [ ] The random seed can optionally be set for reproducibility.

**Relates to:** RF03

---

### US-04: Systematic Sampling
**As a** researcher,  
**I want** the system to calculate the sampling interval k, let me choose or randomize a starting point r, and generate the full sampling sequence,  
**so that** I can perform systematic data collection.

**Acceptance Criteria:**
- [ ] Computes `k = floor(N/n)`.
- [ ] Starting point `r` is randomly selected from `[1, k]` or user-provided.
- [ ] Outputs the sequence: `r, r+k, r+2k, ..., r+(n-1)·k`.

**Relates to:** RF04

---

### US-05: Stratified Sampling
**As a** researcher,  
**I want** to divide my population into strata and calculate sub-sample sizes using Uniform or Proportional allocation,  
**so that** each group is fairly represented.

**Acceptance Criteria:**
- [ ] User defines strata names and sizes (Nₕ).
- [ ] **Uniform:** `nₕ = n / m` (equal allocation across m strata).
- [ ] **Proportional:** `nₕ = n · (Nₕ / N)`.
- [ ] Total of all sub-samples equals `n`.

**Relates to:** RF05

---

## Module II — Data Collection and Validation

### US-06: Questionnaire Builder
**As a** student,  
**I want** to build a digital questionnaire supporting open, closed, filter, and intensity question types,  
**so that** I can collect primary data for my research project.

**Acceptance Criteria:**
- [ ] Supports at least 4 question types: open, closed (single/multi-select), filter (conditional), intensity (numeric).
- [ ] Questions can be reordered via drag-and-drop.
- [ ] A preview mode renders the questionnaire as the respondent would see it.

**Relates to:** RF06

---

### US-07: Data Critique on Import
**As a** data analyst,  
**I want** the system to scan my uploaded spreadsheet for inconsistencies, wrong sums, and missing values,  
**so that** I can clean my data before running analyses.

**Acceptance Criteria:**
- [ ] Detects and flags: null/empty cells, duplicate rows, type mismatches within a column.
- [ ] Provides a summary report with row/column references for each issue.
- [ ] The user can dismiss or acknowledge each warning.

**Relates to:** RF07

---

### US-08: IBGE-Compliant Rounding
**As a** student preparing a report,  
**I want** all numbers produced by the system to follow the 1993 IBGE rounding rules,  
**so that** my tables pass academic review.

**Acceptance Criteria:**
- [ ] Digit to discard ≤4 → truncate; ≥5 → round up.
- [ ] **No successive rounding.** `17.3452` rounded to one decimal → `17.3` (not `17.35` → `17.4`).
- [ ] The rounding function is applied globally across all statistical outputs.

**Relates to:** RF08

---

## Module III — Frequency Distribution

### US-09: Rol Generation
**As a** student,  
**I want** to select a column and instantly see the data sorted in ascending or descending order (Rol),  
**so that** I can identify the data range and distribution at a glance.

**Acceptance Criteria:**
- [ ] One-click action from the Schema Inspector or chat.
- [ ] Supports both ascending and descending order.
- [ ] Output rendered in the Generative UI Canvas.

**Relates to:** RF09

---

### US-10: Classless Frequency Distribution (Discrete Variables)
**As a** student,  
**I want** the system to build a frequency table for a discrete variable showing fᵢ, fᵣ, fᵣ%, Fᵢ (cumulative below), and Fⱼ (cumulative above),  
**so that** I can complete my coursework without manual calculation errors.

**Acceptance Criteria:**
- [ ] All five frequency columns are computed automatically.
- [ ] `Σfᵣ = 1.00` and `Σfᵣ% = 100%` exactly (floating-point integrity).
- [ ] Table rendered follows IBGE tabular norms (no vertical borders).
- [ ] A didactic tooltip explains each frequency type.

**Relates to:** RF10, RNF02, RNF03

---

### US-11: Classed Frequency Distribution (Continuous Variables)
**As a** student,  
**I want** the system to automatically group continuous data into classes using the Sturges rule (or √n),  
**so that** I get a correctly structured frequency distribution table.

**Acceptance Criteria:**
- [ ] Computes: `AT = xmax − xmin`, `K ≅ 1 + 3.3·log(n)` (Sturges) or `K = √n`.
- [ ] User can toggle between Sturges and √n methods.
- [ ] Interval width `h = AT / K`.
- [ ] Midpoint `xᵢ = (lᵢ + lₛ) / 2` computed for each class.
- [ ] Default notation: `├` (closed-left, open-right).
- [ ] Data model stores `xᵢ·fᵢ` and `(xᵢ − x̄)²·fᵢ` vectors for future central tendency/dispersion calculations.

**Relates to:** RF11

---

## Module IV — Tabular and Graphical Presentation

### US-12: IBGE-Compliant Table Rendering
**As a** student exporting a report,  
**I want** all tables to follow IBGE tabular norms,  
**so that** my work meets academic and publishing standards.

**Acceptance Criteria:**
- [ ] No external vertical borders.
- [ ] No internal separator lines between data rows.
- [ ] Header isolated by horizontal rules.
- [ ] Mandatory "Source:" footer field.
- [ ] Applies to both on-screen rendering and PDF export.

**Relates to:** RF12

---

### US-13: Smart Chart Selection
**As a** user,  
**I want** the system to automatically select the correct chart type based on my data characteristics,  
**so that** I never produce a methodologically invalid visualization.

**Acceptance Criteria:**
- [ ] Temporal series with >5 periods → Line Chart.
- [ ] Temporal series with ≤5 periods → Column Chart.
- [ ] Long category names or geographic series → Horizontal Bar Chart.
- [ ] Nominal variables with ≤7 categories → Pie Chart allowed.
- [ ] If the user requests an invalid chart type, the system refuses and explains why, citing the UFPA rule.

**Relates to:** RF13

---

## Module V — AI Conversational Engine

### US-14: Secure Data Ingestion
**As a** business user with sensitive data,  
**I want** my uploaded spreadsheet to be processed locally in a DuckDB sandbox, with only the schema sent to the AI,  
**so that** my raw data is never exposed to external services.

**Acceptance Criteria:**
- [ ] File is loaded into DuckDB in-memory.
- [ ] Only column names, types, and 3 sample rows are sent to Gemini.
- [ ] No raw data rows are included in any LLM API call.

**Relates to:** RF14

---

### US-15: Natural Language Querying
**As a** data analyst,  
**I want** to ask business questions in plain Portuguese (e.g., "What was the top-selling product in July?") and get exact answers,  
**so that** I don't need to write SQL manually.

**Acceptance Criteria:**
- [ ] Gemini returns a structured JSON with a SQL query.
- [ ] Backend executes the SQL against DuckDB.
- [ ] AI narrates the result in Portuguese.
- [ ] Response includes the exact numeric value from the database, not an AI estimate.

**Relates to:** RF15, RF16

---

### US-16: Generative UI Responses
**As a** user,  
**I want** the AI's response to dynamically generate charts, tables, or highlight cards in the center canvas,  
**so that** I get visual insights alongside textual explanations.

**Acceptance Criteria:**
- [ ] AI response includes a `ChartSpec` or `TableSpec` JSON.
- [ ] Frontend parses the spec and renders the appropriate Recharts component or IBGE table.
- [ ] Multiple visual elements can coexist on the canvas.

**Relates to:** RF17

---

### US-17: Methodological Guardrail
**As a** student,  
**I want** the AI to warn me when I request a statistically invalid operation,  
**so that** I learn the correct methodology and avoid errors in my work.

**Acceptance Criteria:**
- [ ] Requesting "mean of nominal variable" → polite refusal + suggestion (e.g., Mode).
- [ ] Requesting "line chart for nominal categories" → block + suggest Bar/Column chart.
- [ ] Each refusal cites the specific UFPA/IBGE rule chapter.

**Relates to:** RF18

---

## Cross-Cutting

### US-18: Didactic Tooltips
**As a** student,  
**I want** every formula applied by the system to have a `(?)` icon that explains the concept,  
**so that** I understand what the system is doing, not just the result.

**Acceptance Criteria:**
- [ ] Tooltip contains: formula name, LaTeX-rendered formula, plain-language explanation, textbook chapter reference.
- [ ] Available on sample size calculator, frequency tables, chart selections, and rounding outputs.

**Relates to:** RNF03

### US-19: PDF Report Export
**As a** student,  
**I want** to export the entire analysis session (conversation + tables + charts) as a publication-ready PDF,  
**so that** I can submit it directly for academic evaluation.

**Acceptance Criteria:**
- [ ] Tables follow IBGE norms (no vertical borders).
- [ ] Charts respect golden ratio framing.
- [ ] Mandatory "Source:" footer on every table.
- [ ] PDF is vector-rendered (ReportLab), not a screenshot.

**Relates to:** RF12, RNF01

---

## Related Documents

- [PRD](PRD.md)
- [ADR-001: DuckDB Sandbox](adr/001-duckdb-sandbox.md)
- [ADR-002: IBGE Heuristics](adr/002-ibge-heuristics.md)
