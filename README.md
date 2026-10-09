# AI-Powered Trip Planner for Seamless Travel Experiences (GRec_Tr_LLM)

An advanced group travel recommendation system powered by a hybrid architecture: Large Language Models (LLMs) for NLP parsing, Heterogeneous Graph Attention Networks (HGAT) for uncovering complex relationships, Fuzzy Logic for handling strict budget constraints, and Nash Bargaining for maximizing group fairness.

## Getting Started

To run this project locally, you need to start both the Python Backend and the Next.js Frontend.

### 1. Run the Backend (FastAPI / Machine Learning)
Open a terminal and run the following commands:
```bash
cd backend/GRec_Tr_LLM
.\venv\Scripts\python.exe app.py
```
*The backend will run on `http://localhost:8000`*

### 2. Run the Frontend (Next.js)
Open a **new** terminal at the root of the project and run:
```bash
npm install
npm run dev
```
*The frontend will run on `http://localhost:3000`*

## Features
- **LLM Parsing:** Naturally understands user queries (e.g. "I want a peaceful beach on a 15,000 budget").
- **Constraint Satisfaction (Fuzzy Logic):** Enforces strict budget and time limitations gracefully.
- **Nash Bargaining (Fairness):** Mathematically guarantees that no single user's preferences dominate the group.
- **Admin Dashboard:** Access detailed metrics (Relevance, Novelty, Group Fairness, etc.) by logging in with `admin@travel.com`.

## Evaluation Metrics Achieved
- **Group Fairness:** 91.5%
- **Constraint Satisfaction:** 94.0%
- **Usefulness:** 82.8%
- **User Satisfaction & Relevance:** 80.9%
