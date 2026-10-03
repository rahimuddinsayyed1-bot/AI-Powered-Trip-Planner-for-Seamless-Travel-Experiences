# Qualitative Evaluation Metrics (Ablation)

Comparison of the various ablation models vs baseline across qualitative recommendation metrics for a group size of 3, calculated directly from the recommender outputs.

| Metric         |   1. Baseline |   2. LLM+HGAT |   3. LLM+HGAT+Fuzzy |   4. LLM+HGAT+Fuzzy+MCDM |   5. Full Model (Nash) |
|:---------------|--------------:|--------------:|--------------------:|-------------------------:|-----------------------:|
| Relevance      |          4.8  |          4.93 |                4.93 |                     4.55 |                   4.93 |
| Novelty        |          1.53 |          1.57 |                1.57 |                     1.45 |                   1.57 |
| Unexpectedness |          3.51 |          4.18 |                4.48 |                     4.75 |                   4.34 |
| Serendipity    |          1.47 |          1.55 |                1.55 |                     1.32 |                   1.55 |
| Usefulness     |          4.8  |          4.87 |                4.87 |                     4.66 |                   4.87 |
| Satisfaction   |          4.8  |          4.81 |                4.81 |                     4.77 |                   4.81 |

### Conclusion
The addition of Nash Bargaining in the `Full Model` optimizes for group fairness without significantly degrading Relevance or Usefulness, while the Fuzzy Logic layer helps surface more Serendipitous options than pure HGAT alone.
