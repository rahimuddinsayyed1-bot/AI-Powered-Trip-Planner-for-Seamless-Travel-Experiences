# Base System (GRec_Tr) vs. Proposed System (GRec_Tr-LLM)

This document provides a detailed comparison between the original base paper "A Group Travel Recommender System Based on Group Approximate Constraint Satisfaction" and the proposed extended system.

## 1. Overview and Core Philosophy

### Base System: GRec_Tr
* **Focus:** Generating group travel recommendations by attempting to satisfy hard constraints and relaxing them (approximate satisfaction) when an exact match isn't possible.
* **Limitations:** Not specified in the source paper in full detail, but typically, these systems struggle with conversational nuance, treat constraints rigidly or in step-wise relaxations, and often prioritize average group utility over fairness.

### Proposed System: GRec_Tr-LLM
* **Focus:** An LLM-enhanced pipeline that bridges natural language and deterministic constraint satisfaction. It incorporates Heterogeneous Graph Attention Networks (HGAT) for embeddings, Gaussian Fuzzy Logic for soft constraints, TOPSIS for ranking, and Nash Bargaining for fairness.

## 2. Input and Preference Parsing
* **GRec_Tr:** Uses structured, form-based explicit inputs (e.g., categorical dropdowns, hard numerical limits).
* **GRec_Tr-LLM:** Employs an LLM strictly as a semantic preference parser. It converts conversational group discussions into structured Pydantic/JSON models capturing exact parameters, hard constraints, and soft constraints.

## 3. Representation and Candidate Generation
* **GRec_Tr:** Relies on Collaborative Filtering (CF) and Pearson Correlation to find similarities between users and candidate destinations.
* **GRec_Tr-LLM:** Constructs a Heterogeneous Graph containing Users, Groups, Destinations, Hotels, Activities, and Transport. It uses HGAT to capture complex higher-order relationships. Also includes a strategy for cold-start users by mapping parsed preferences directly to graph node features (see `docs/cold_start.md`).

## 4. Constraint Satisfaction Mechanism
* **GRec_Tr:** Group Approximate Constraint Satisfaction. If a group constraint (e.g., Budget < $1000) is violated, the system attempts to relax it incrementally until a feasible set of destinations is found.
* **GRec_Tr-LLM:** Fuzzy Constraint Satisfaction. Constraints are modeled using continuous Gaussian membership functions: $\mu(x) = \exp(-(x-c)^2 / (2\sigma^2))$. This treats constraint satisfaction as a continuous utility rather than a binary pass/fail or step-wise relaxation.

## 5. Candidate Ranking
* **GRec_Tr:** Likely ranks candidates using a simple aggregate utility or weighted sum of satisfaction scores (specific formulation not specified in the source paper).
* **GRec_Tr-LLM:** Multi-Criteria Decision Making (MCDM) using TOPSIS. Candidates are ranked based on their geometric distance to an ideal solution and negative-ideal solution across multiple criteria (budget, activities, time, ratings).

## 6. Group Consensus and Fairness
* **GRec_Tr:** Standard aggregation functions such as Average Utility, Weighted Average, or Least Misery.
* **GRec_Tr-LLM:** Nash Bargaining. Resolves conflicts by maximizing the product of individual utility gains over a disagreement point ($d_i$): $\max \prod_i (u_i - d_i)$. This guarantees mathematically fair compromises rather than marginalizing minority preferences.

## 7. Output Format
* **GRec_Tr:** Recommends a single travel destination or a ranked list of destinations.
* **GRec_Tr-LLM:** Integrated Travel Package. Combines the chosen Destination with the optimal Flight, Hotel, and Activities into a cohesive itinerary, evaluating total cost and satisfaction for the entire package.
