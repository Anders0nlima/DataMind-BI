# Product Requirements Document — DataMind BI

**Version:** 1.0  
**Date:** 2026-06-28  
**Status:** Draft  

---

## 1. Vision

DataMind BI is a web-based Business Intelligence platform that allows users to upload raw spreadsheets, have a natural-language conversation with an AI analyst, and receive statistically rigorous outputs — all without the AI performing any mathematical computation itself.

**Core Promise:** *"Chat with your raw spreadsheets, get mathematically exact answers, and auto-generate dashboards shielded against methodological errors."*

## 2. Problem Statement

| Problem | Who Suffers | Current Workaround |
|---------|-------------|--------------------|
| LLMs hallucinate numbers when doing math | Data analysts, students | Manually verify every AI output |
| Users create invalid chart types for their data | UFPA students, report authors | Professor/reviewer catches errors after submission |
| Statistical tables don't follow IBGE norms | Government analysts, academics | Manual formatting in Word/Excel |
| Sample size calculation uses folk rules ("10% of population") | Researchers | Spreadsheet templates with hidden formulas |
| Raw data gets sent to external AI APIs | Companies with sensitive data | Avoid using AI altogether |

## 3. Solution Architecture

The system employs a **Code Interpreter pattern**: the AI writes SQL queries that the backend executes deterministically against a local DuckDB sandbox. Raw data never leaves the server. Statistical rules from the UFPA/IBGE curriculum are injected into the AI prompt as guardrails.

See [ADR-001: DuckDB Sandbox](adr/001-duckdb-sandbox.md) and [ADR-002: IBGE Heuristics](adr/002-ibge-heuristics.md) for detailed architectural rationale.

## 4. Target Audience

| Persona | Use Case |
|---------|----------|
| **University Student (UFPA)** | Generate frequency distribution tables, sample calculations, and IBGE-compliant reports for coursework |
| **Data Analyst (SMB)** | Upload sales CSVs, ask business questions in natural language, get exact answers with auto-generated charts |
| **Researcher** | Calculate sample sizes, perform stratified sampling, export publication-ready tables |

## 5. Functional Requirements

### Module I — Planning and Sampling (Chapters 1–2)

| ID | Requirement | Source |
|----|-------------|--------|
| **RF01** | **Variable Typification.** The system must classify each imported column as *Qualitative Nominal*, *Qualitative Ordinal*, *Quantitative Discrete*, or *Quantitative Continuous*. | Ch. 1.15 |
| **RF02** | **Sample Size Calculator.** Given population size `N` and tolerable error `E₀`, compute `n₀ = 1/(E₀²)` then `n = (N·n₀)/(N+n₀)`. | Ch. 2 |
| **RF03** | **Simple Random Sampling (SRS).** Accept a numbered list from 1 to N and draw n elements without replacement. | Ch. 2 |
| **RF04** | **Systematic Sampling (SS).** Compute interval `k = N/n`, accept or draw starting point `r`, generate sequence `r, r+k, r+2k, ...`. | Ch. 2 |
| **RF05** | **Stratified Sampling (StS).** Partition population into strata and compute sub-samples via *Uniform* (`nₕ = n/m`) or *Proportional* (`nₕ = n·(Nₕ/N)`) allocation. | Ch. 2 |

### Module II — Data Collection and Validation (Chapters 3–4)

| ID | Requirement | Source |
|----|-------------|--------|
| **RF06** | **Questionnaire Builder.** Support open, closed, filter, and intensity question types. | Ch. 4.6 |
| **RF07** | **Internal Data Critique.** On spreadsheet import, scan for inconsistencies, incorrect sums, and missing entries. | Ch. 3 |
| **RF08** | **Official IBGE Rounding (1993).** If the digit to discard is ≤4, truncate; if ≥5, round up. **Successive rounding is strictly forbidden** (e.g., 17.3452 → 17.3, not 17.35 → 17.4). | Ch. 5.7 |

### Module III — Frequency Distribution (Chapter 7)

| ID | Requirement | Source |
|----|-------------|--------|
| **RF09** | **Rol Generation.** Sort raw data in ascending or descending order. | Ch. 7.3 |
| **RF10** | **Classless Distribution (Discrete).** Compute `fᵢ` (absolute), `fᵣ` (relative), `fᵣ%` (percentage), `Fᵢ` (cumulative below), `Fⱼ` (cumulative above). | Ch. 7.3 |
| **RF11** | **Classed Distribution (Continuous).** Automate: (1) Total Amplitude `AT = xmax − xmin`, (2) Number of classes via √n or **Sturges** `K ≅ 1 + 3.3·log(n)`, (3) Interval width `h = AT/K`, (4) Midpoint `xᵢ = (lᵢ+lₛ)/2`, (5) Default `├` notation (closed-left, open-right). | Ch. 7.3 |

### Module IV — Tabular and Graphical Presentation (Chapters 5–6)

| ID | Requirement | Source |
|----|-------------|--------|
| **RF12** | **IBGE Tabular Renderer.** Tables must have **no external vertical borders and no internal separator lines**. Header delimited by horizontal rules. Mandatory "Source" footer. | Ch. 5.1 |
| **RF13** | **Smart Chart Selector.** Enforce chart type based on data characteristics: | Ch. 6 |
| | — Long temporal series (>5 periods): **Line Chart** | Ch. 6.6 |
| | — Short temporal series (≤5 periods): **Column Chart** | Ch. 6.5 |
| | — Long category names or geographic series: **Horizontal Bar Chart** | Ch. 6.9 |
| | — Nominal variables with ≤7 parcels: **Pie Chart** | Ch. 6.11 |

### Module V — AI Conversational Engine (Core Product)

| ID | Requirement | Source |
|----|-------------|--------|
| **RF14** | **Tabular Ingestion via DuckDB Sandbox.** On file upload, convert to in-memory DuckDB. Send only schema (column names, types, 3 sample rows) to the LLM. **Never send raw data rows.** | Architecture |
| **RF15** | **Text-to-Query Engine.** Gemini receives the schema and returns a strict JSON containing a SQL query. | Architecture |
| **RF16** | **Deterministic Execution.** Backend executes AI-generated SQL on local DuckDB, extracts exact values, and feeds them back to the AI. **The AI never performs math — it only programs the calculator.** | Architecture |
| **RF17** | **Multimodal Response & Generative UI.** AI returns interpreted Portuguese text + a visual command (ChartSpec or TableSpec) that the frontend renders dynamically. | Architecture |
| **RF18** | **Preventive Methodological Intervention.** If the user requests an operation that violates statistical rules (e.g., "calculate mean of product codes"), the AI must refuse politely and suggest the correct alternative. | Ch. 1.15, 4.2 |

## 6. Non-Functional Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| **RNF01** | **Golden Ratio Chart Framing.** Chart aspect ratio must fall between **1:0.57 and 1:0.80** (recommended 5:4 or 7:4). | Ch. 6.5 |
| **RNF02** | **Floating-Point Integrity.** The frequency calculation engine must ensure `Σfᵣ = 1.00` and `Σfᵣ% = 100%` exactly. | Internal |
| **RNF03** | **Didactic Mode (Tooltips).** Every formula applied by the system must have a `(?)` icon that reveals the theoretical definition and the corresponding statistical rule. | Internal |

## 7. Traceability Matrix

| # | Feature | Textbook Concept | User Pain Point Resolved |
|---|---------|------------------|--------------------------|
| 1 | Sample Error Alert | Ch. 2 — Sample Formula | Debunks the myth that samples must be "10% of the population" |
| 2 | Line Chart Block | Ch. 6.6 — Curve Graphs | Prevents users from connecting dots between "Male" and "Female" |
| 3 | Auto-Sturges | Ch. 7.3 — K Calculation | Prevents tables with 25 rows or only 2 classes |
| 4 | Table Validator | Ch. 5.1 — Tabular Norms | Ensures reports don't fail formatting requirements |

## 8. Future Scope (Chapters 8–12)

The UFPA textbook indicates that Chapters 8–12 cover *Measures of Central Tendency (Mean, Mode, Median), Dispersion (Standard Deviation), Asymmetry, Kurtosis, and Linear Regression*. The frequency table data model must be designed to store vectors `xᵢ·fᵢ` and `(xᵢ − x̄)²·fᵢ` from day one.

## 9. Related Documents

- [User Stories](USER_STORIES.md)
- [ADR-001: DuckDB Sandbox](adr/001-duckdb-sandbox.md)
- [ADR-002: IBGE Heuristics](adr/002-ibge-heuristics.md)
