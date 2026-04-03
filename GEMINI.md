# GEMINI.md - SleepRescue2 Project AI Operational Mandates

This document defines the foundational rules and safety protocols for the Gemini CLI agent within the SleepRescue2 project. These instructions take absolute precedence over general defaults.

## 1. AI Safety & Reliability Protocols

### 1.1 Anti-Hallucination & Empirical Grounding
- **Strict Grounding:** Never generate sleep advice or health insights without explicit grounding in the project's data models (`lifelog`, `sleep_hours`, `caffeine`, etc.).
- **Evidence-Based:** When proposing code changes for AI features, reference specific files like `llm_service.py` or `ml_service.py`.
- **"I Don't Know" Clause:** If a technical path or health correlation is ambiguous, state the uncertainty instead of guessing.

### 1.2 Bias & Fairness Mitigation
- **Demographic Neutrality:** Ensure sleep coaching logic does not make biased assumptions based on age, gender, or occupation unless explicitly supported by clinical datasets.
- **Data Representative:** Review ML models (`Sleep_XGBoost`) for potential bias in training data distributions.

### 1.3 Preventing Overconfidence & Reasoning Gap
- **Uncertainty Quantification:** AI-generated coaching must include a "confidence note" (as implemented in `llm_service.py`).
- **Plan-Act Alignment:** Every code modification must be preceded by a clear reasoning step. If the execution deviates from the plan, a re-evaluation turn is mandatory.

### 1.4 Data Staleness (Staleness) Management
- **Temporal Context:** Always check timestamps of user lifelogs. If data is older than 36 hours, the AI must trigger a "Staleness Warning" before providing coaching.
- **Real-time Sync:** Prioritize APIs that verify the current state of the database over cached values.

### 1.5 Security & Prompt Integrity
- **Injection Defense:** All user inputs passed to the LLM must be sanitized via the `sanitize_input` filter in `llm_service.py`.
- **System Message Protection:** Never expose or allow modification of the `SYSTEM_PROMPT` through user-facing APIs.

### 1.6 Risk & Goal Alignment
- **Medical Disclaimer:** The goal of SleepRescue2 is "Coaching," not "Medical Diagnosis." Always maintain this distinction.
- **Risk Blindness Prevention:** If user data indicates extreme sleep deprivation (<4h) or high caffeine (>400mg), prioritize "Risk Flags" over general optimization tips.

## 2. Technical Standards

### 2.1 Architecture
- **Frontend:** React (Vite) + Vanilla CSS/Styled Components.
- **Backend (Orchestration):** Node.js/Express for auth, DB management, and UI logic.
- **Backend (Intelligence):** FastAPI/Python for ML (XGBoost), CV (YOLO), and LLM (LangChain) services.

### 2.2 Documentation
- All AI-related functions must have docstrings explaining the reasoning logic and safety checks.
- Maintain a clear separation between "Deterministic Logic" (Node.js) and "Probabilistic Logic" (FastAPI/AI).
