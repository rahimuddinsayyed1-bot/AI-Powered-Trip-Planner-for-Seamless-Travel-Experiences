import numpy as np
from typing import List, Dict

def ndcg_at_k(recommended_scores: List[float], k: int) -> float:
    """
    Calculates Normalized Discounted Cumulative Gain at K.
    Measures the quality of ranking.
    """
    if not recommended_scores or k <= 0:
        return 0.0
    
    scores = np.array(recommended_scores[:k])
    # Relevance is derived from the score
    gains = 2 ** scores - 1
    discounts = np.log2(np.arange(len(scores)) + 2)
    dcg = np.sum(gains / discounts)
    
    # Ideal DCG (sorted in descending order)
    ideal_scores = np.sort(scores)[::-1]
    ideal_gains = 2 ** ideal_scores - 1
    idcg = np.sum(ideal_gains / discounts)
    
    return dcg / idcg if idcg > 0 else 0.0

def hit_rate_at_k(recommended_ids: List[str], actual_id: str, k: int) -> float:
    """Calculates Hit Rate at K."""
    return 1.0 if actual_id in recommended_ids[:k] else 0.0
    
def group_fairness_metrics(utilities: List[float]) -> Dict[str, float]:
    """
    Calculates fairness based on the distribution of individual utilities within a group.
    Crucial for comparing Nash Bargaining vs. Average/Least Misery baselines.
    """
    if not utilities:
        return {}
    
    mean_u = np.mean(utilities)
    min_u = np.min(utilities)
    max_u = np.max(utilities)
    variance = np.var(utilities)
    
    return {
        "mean_satisfaction": float(mean_u),
        "min_satisfaction": float(min_u),
        "satisfaction_gap": float(max_u - min_u), # Lower is fairer
        "variance": float(variance)               # Lower is fairer
    }
