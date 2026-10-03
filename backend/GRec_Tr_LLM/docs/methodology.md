# GRec_Tr-LLM: Methodology and Algorithms

This document outlines the core algorithms used in the GRec_Tr-LLM pipeline.

## 1. LLM Preference Parsing
* **Problem:** Extracting precise constraints from natural language without allowing the LLM to hallucinate recommendations.
* **Input:** Natural language text (e.g., "I want a beach destination under $500").
* **Output:** Structured JSON matching predefined Pydantic schemas.
* **Algorithm Steps:**
  1. Inject system prompt with strictly defined JSON schema.
  2. Parse user text via LLM API.
  3. Validate output against Pydantic models; retry if malformed.
* **Difference from Base:** Base uses explicit form-based inputs.

*(Note: Future sections for HGAT, Fuzzy Logic, MCDM, and Nash Bargaining will be added in subsequent phases.)*
