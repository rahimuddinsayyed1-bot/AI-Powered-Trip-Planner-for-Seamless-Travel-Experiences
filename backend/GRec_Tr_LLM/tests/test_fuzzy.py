import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.fuzzy.constraint_satisfaction import FuzzyConstraintEvaluator

def run_fuzzy_tests():
    print("==================================================")
    print("--- Testing Fuzzy Constraint Satisfaction ---")
    print("==================================================\n")
    
    evaluator = FuzzyConstraintEvaluator(default_tolerance=0.2)
    
    # Test Scenario: 
    # User's Hard Constraint: Max Budget = $1000
    # In Phase 3 (Rigid), a trip costing $1050 is instantly rejected (Score = 0.0).
    # Let's see how Phase 4 (Fuzzy) handles it.
    
    target_budget = 1000.0
    flexibility = 0.5 # Normal flexibility
    
    test_cases = [
        ("Perfectly on budget", 800.0),
        ("Exactly at limit", 1000.0),
        ("Slightly over limit (+$50)", 1050.0),
        ("Moderately over (+$200)", 1200.0),
        ("Way over (+$500)", 1500.0)
    ]
    
    print(f"Goal: Max Budget = ${target_budget} | Base Tolerance (Sigma) = ${target_budget * 0.2}\n")
    
    for name, cost in test_cases:
        # We'll just isolate budget for this printout
        score = evaluator.evaluate_budget(actual_cost=cost, max_budget=target_budget, flexibility=flexibility)
        
        # Print results clearly
        print(f"[{name}]")
        print(f"  Actual Cost: ${cost}")
        print(f"  Rigid Score: {1.0 if cost <= target_budget else 0.0}")
        print(f"  Fuzzy Score: {score:.4f}\n")
        
    print("--------------------------------------------------")
    print("Test Comprehensive Scoring Matrix:")
    
    res = evaluator.get_satisfaction_scores(
        actual_cost=1100, max_budget=1000,   # slightly over budget
        actual_time=5.0, max_time=6.0,       # under time (perfect)
        actual_rating=3.8, min_rating=4.0,   # slightly under rating
        flexibility=0.5
    )
    
    for k, v in res.items():
        print(f"  {k}: {v}")
        
    print("\n==================================================")

if __name__ == "__main__":
    run_fuzzy_tests()
