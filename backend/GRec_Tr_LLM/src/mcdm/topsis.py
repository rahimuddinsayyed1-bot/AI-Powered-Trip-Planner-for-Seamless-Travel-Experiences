import numpy as np
from typing import List, Dict

class TOPSIS:
    def __init__(self, criteria_weights: List[float], criteria_types: List[bool]):
        """
        Initializes the TOPSIS Multi-Criteria Decision Making solver.
        
        Args:
            criteria_weights: A list of weights (must sum to 1.0) indicating importance of each criterion.
            criteria_types: A list of booleans where True means 'larger is better' (Benefit criterion)
                            and False means 'smaller is better' (Cost criterion).
        """
        self.weights = np.array(criteria_weights, dtype=float)
        self.is_benefit = np.array(criteria_types)
        
        if len(self.weights) != len(self.is_benefit):
            raise ValueError("Lengths of weights and criteria_types must match.")
            
        # Ensure weights are positive
        if np.any(self.weights < 0):
            raise ValueError("Weights cannot be negative.")
            
        # Normalize weights to sum to 1.0 safely
        w_sum = np.sum(self.weights)
        if w_sum <= 0:
            raise ValueError("Sum of weights must be greater than 0.")
        self.weights = self.weights / w_sum
            
    def rank(self, candidates: List[Dict], criteria_keys: List[str]) -> List[Dict]:
        """
        Evaluates and ranks a list of candidates based on multiple conflicting criteria.
        
        Args:
            candidates: List of dictionaries representing candidate destinations.
            criteria_keys: List of dictionary keys corresponding to the criteria.
            
        Returns:
            List of candidates sorted by TOPSIS score in descending order.
        """
        if not candidates:
            return []
            
        # 1. Build Decision Matrix (m candidates x n criteria)
        matrix = np.array([[c[key] for key in criteria_keys] for c in candidates], dtype=float)
        
        # 2. Vector Normalization
        # Divide each column by the square root of the sum of squared elements
        norm_factors = np.sqrt(np.sum(matrix**2, axis=0))
        norm_factors[norm_factors == 0] = 1e-10 # Prevent division by zero
        norm_matrix = matrix / norm_factors
        
        # 3. Apply Criteria Weights
        weighted_matrix = norm_matrix * self.weights
        
        # 4. Determine Ideal Best (V+) and Ideal Worst (V-)
        ideal_best = np.zeros(len(criteria_keys))
        ideal_worst = np.zeros(len(criteria_keys))
        
        for i in range(len(criteria_keys)):
            if self.is_benefit[i]:
                ideal_best[i] = np.max(weighted_matrix[:, i])
                ideal_worst[i] = np.min(weighted_matrix[:, i])
            else:
                ideal_best[i] = np.min(weighted_matrix[:, i])
                ideal_worst[i] = np.max(weighted_matrix[:, i])
                
        # 5. Calculate Geometric Distances
        # Euclidean distance from the ideal best and ideal worst
        dist_best = np.sqrt(np.sum((weighted_matrix - ideal_best)**2, axis=1))
        dist_worst = np.sqrt(np.sum((weighted_matrix - ideal_worst)**2, axis=1))
        
        # 6. Calculate TOPSIS Score (Similarity to Ideal Solution)
        # Closer to 1.0 means closer to ideal best and further from ideal worst
        scores = dist_worst / (dist_best + dist_worst + 1e-10)
        
        # 7. Append scores to original candidates and sort
        for i, candidate in enumerate(candidates):
            candidate['topsis_score'] = round(float(scores[i]), 4)
            
        ranked_candidates = sorted(candidates, key=lambda x: x['topsis_score'], reverse=True)
        return ranked_candidates
