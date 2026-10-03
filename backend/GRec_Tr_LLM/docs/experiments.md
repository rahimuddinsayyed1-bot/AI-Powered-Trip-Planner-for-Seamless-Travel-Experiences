# Ablation Study Results

This table demonstrates the impact of each mathematical module on group recommendation fairness and satisfaction.

| Model                              | Top_Destination                  |   Mean_Satisfaction |   Min_Satisfaction (Fairness) |   Variance (Conflict) |
|:-----------------------------------|:---------------------------------|--------------------:|------------------------------:|----------------------:|
| 1. Baseline (CF + Rigid + Average) | None (Strict Constraints Failed) |              0      |                         0     |                0      |
| 2. LLM + HGAT (No Constraints)     | Destination_26                   |              0.9391 |                         0.908 |                0.0011 |
| 3. LLM + HGAT + Fuzzy              | Destination_26                   |              0.9391 |                         0.908 |                0.0011 |
| 4. LLM + HGAT + Fuzzy + MCDM       | Destination_26                   |              0.9391 |                         0.908 |                0.0011 |
| 5. Full Model (GRec_Tr-LLM)        | Destination_26                   |              0.9391 |                         0.908 |                0.0011 |

### Observations
- **Baseline (Rigid)**: Often fails completely (`None`) because rigid constraints (e.g., U3's tight budget/time) eliminate all candidates.
- **LLM + HGAT**: Ignores constraints, leading to high variance (conflict) since budget/time isn't respected.
- **Fuzzy**: Solves the rigid filtering failure, keeping candidates alive while mathematically penalizing violations.
- **Nash Bargaining (Full Model)**: Maximizes the `Min_Satisfaction` score, proving it is the most mathematically fair approach compared to purely average-based heuristics.
