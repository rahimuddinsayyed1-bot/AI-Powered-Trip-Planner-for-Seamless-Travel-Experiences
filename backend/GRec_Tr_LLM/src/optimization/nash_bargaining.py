from typing import List, Dict
import math

class NashBargainingOptimizer:
    def __init__(self, epsilon: float = 1e-5):
        """
        Initializes the Nash Bargaining Optimizer.
        
        Args:
            epsilon: A small constant to ensure (u_i - d_i) > 0.
                     This prevents the Nash product from collapsing to 0 if a member 
                     receives exactly their disagreement utility.
        """
        self.epsilon = epsilon
        
    def calculate_disagreement_points(self, candidates: List[Dict], member_ids: List[str]) -> Dict[str, float]:
        """
        Calculates the disagreement point (d_i) for each group member.
        In this implementation, d_i is defined as a strict 0.0 utility baseline.
        This guarantees that the Nash product maximizes absolute utility gains 
        rather than artificially shrinking gains if all candidates are excellent.
        """
        d_points = {}
        for member_id in member_ids:
            # Find the minimum utility this member gets across all FEASIBLE candidates
            # (If no candidates or all 0, default to 0.0)
            utilities = [c['member_utilities'].get(member_id, 0.0) for c in candidates if c.get('feasible', True)]
            min_u = min(utilities) if utilities else 0.0
            
            # We set the disagreement point slightly below their worst feasible outcome
            d_points[member_id] = max(0.0, min_u - 0.1)
        return d_points
        
    def rank(self, candidates: List[Dict], member_ids: List[str]) -> List[Dict]:
        """
        Ranks candidate destinations based on the Nash Bargaining solution.
        Objective: maximize the product of individual utility gains over the disagreement point.
        Implemented using numerically stable Sum of Log Gains.
        Formula: max \\sum_i log(u_i - d_i)
        
        Args:
            candidates: List of candidate dictionaries, containing a 'member_utilities' dict.
            member_ids: List of group member IDs.
            
        Returns:
            List of candidates sorted by Nash Score in descending order.
        """
        if not candidates or not member_ids:
            return candidates
            
        # 1. Calculate disagreement points d_i
        d_points = self.calculate_disagreement_points(candidates, member_ids)
        
        # 2. Calculate Nash Product (Sum of Logs) for each candidate
        for candidate in candidates:
            sum_log_gains = 0.0
            for member_id in member_ids:
                u_i = candidate['member_utilities'][member_id]
                d_i = d_points[member_id]
                
                # Gain = (Utility - Disagreement Point)
                # Ensure gain is strictly positive using epsilon
                gain = max(0.0, u_i - d_i) + self.epsilon
                sum_log_gains += math.log(gain)
                
            candidate['nash_score'] = round(sum_log_gains, 6)
            
        # 3. Sort by Nash Score (descending)
        ranked = sorted(candidates, key=lambda x: x['nash_score'], reverse=True)
        return ranked
