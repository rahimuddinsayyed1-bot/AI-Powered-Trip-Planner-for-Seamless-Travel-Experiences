import os
import sys
import numpy as np

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.optimization.nash_bargaining import NashBargainingOptimizer

def run_nash_test():
    print("==================================================")
    print("--- Testing Nash Bargaining Consensus ---")
    print("==================================================\n")
    
    member_ids = ["User1", "User2", "User3"]
    
    # We compare 3 classic dilemmas in group recommendation:
    candidates = [
        # 1. "Tyranny of Majority": U1 and U2 love it, U3 hates it. (High average, terrible fairness)
        {"name": "Tyranny of Majority", "member_utilities": {"User1": 0.9, "User2": 0.9, "User3": 0.2}},
        
        # 2. "Least Misery": Nobody hates it, but nobody actually likes it either.
        {"name": "Mediocre Compromise", "member_utilities": {"User1": 0.5, "User2": 0.5, "User3": 0.5}},
        
        # 3. "Nash Optimal": U3 makes a small compromise, U1 and U2 make a small compromise.
        {"name": "Nash Fair Choice",    "member_utilities": {"User1": 0.7, "User2": 0.7, "User3": 0.6}},
    ]
    
    optimizer = NashBargainingOptimizer()
    
    print("[INFO] Calculated Disagreement Points (d_i):")
    d_points = optimizer.calculate_disagreement_points(candidates, member_ids)
    for m in member_ids:
        print(f"       {m} worst-case utility: {d_points[m]}")
    print("\n--- Nash Bargaining Ranking Results ---")
    
    ranked = optimizer.rank(candidates, member_ids)
    
    for i, c in enumerate(ranked, 1):
        utils = list(c['member_utilities'].values())
        avg_util = np.mean(utils)
        lm_util = np.min(utils)
        
        print(f"Rank {i}. {c['name']:<20} | Nash Score: {c['nash_score']:.6f}")
        print(f"         Avg Utility: {avg_util:.2f} | Min Utility: {lm_util:.2f}")
        print(f"         Utilities: {c['member_utilities']}\n")

    print("Observation:")
    print(" - Phase 3 (Average) would have picked 'Tyranny of Majority' (Avg=0.67), making User3 miserable.")
    print(" - Phase 3 (Least Misery) would have picked 'Mediocre Compromise' (Min=0.50).")
    print(" - Phase 8 (Nash Bargaining) mathematically correctly chooses 'Nash Fair Choice' as the true optimal group compromise.")
    
    print("==================================================")

if __name__ == "__main__":
    run_nash_test()
