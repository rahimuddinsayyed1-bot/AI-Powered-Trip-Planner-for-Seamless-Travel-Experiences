import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.fuzzy.gaussian_membership import (
    gaussian_less_than_or_equal,
    gaussian_greater_than_or_equal
)

class FuzzyConstraintEvaluator:
    def __init__(self, default_tolerance: float = 0.2):
        """
        default_tolerance: The base percentage of the constraint value used as sigma (standard deviation).
        For a $1000 budget, a 0.2 tolerance means sigma is $200.
        """
        self.default_tolerance = default_tolerance

    def evaluate_budget(self, actual_cost: float, max_budget: float, flexibility: float = 0.5) -> float:
        if max_budget is None or max_budget <= 0:
            return 1.0
            
        # Sigma (tolerance) scales with the user's inferred flexibility score
        base_sigma = max_budget * self.default_tolerance
        sigma = base_sigma * (flexibility * 2) 
        
        # We want cost to be <= max_budget. If it exceeds, it decays fuzzily.
        return gaussian_less_than_or_equal(actual_cost, max_budget, sigma)

    def evaluate_travel_time(self, actual_time: float, max_time: float, flexibility: float = 0.5) -> float:
        if max_time is None or max_time <= 0:
            return 1.0
            
        base_sigma = max_time * self.default_tolerance
        sigma = base_sigma * (flexibility * 2)
        
        return gaussian_less_than_or_equal(actual_time, max_time, sigma)
        
    def evaluate_hotel_rating(self, actual_rating: float, min_rating: float, flexibility: float = 0.5) -> float:
        if min_rating is None:
            return 1.0
            
        # Ratings are on a 5-point scale. Default base sigma is 0.5 stars.
        base_sigma = 0.5
        sigma = base_sigma * (flexibility * 2)
        
        return gaussian_greater_than_or_equal(actual_rating, min_rating, sigma)
        
    def get_satisfaction_scores(self, 
                                actual_cost: float, max_budget: float, 
                                actual_time: float, max_time: float,
                                actual_rating: float, min_rating: float,
                                flexibility: float = 0.5) -> dict:
        """
        Computes individual fuzzy satisfactions and returns a dictionary.
        This provides the continuous [0.0, 1.0] scoring used downstream by MCDM.
        """
        b_sat = self.evaluate_budget(actual_cost, max_budget, flexibility)
        t_sat = self.evaluate_travel_time(actual_time, max_time, flexibility)
        h_sat = self.evaluate_hotel_rating(actual_rating, min_rating, flexibility)
        
        # Simple average for overall constraint satisfaction at this stage. 
        # Weighted aggregation will happen in the MCDM/TOPSIS phase.
        overall = (b_sat + t_sat + h_sat) / 3.0
        
        return {
            "budget_satisfaction": round(b_sat, 4),
            "travel_time_satisfaction": round(t_sat, 4),
            "hotel_satisfaction": round(h_sat, 4),
            "overall_satisfaction": round(overall, 4)
        }
