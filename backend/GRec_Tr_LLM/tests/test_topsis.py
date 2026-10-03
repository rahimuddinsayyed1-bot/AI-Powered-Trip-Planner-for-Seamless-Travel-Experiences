import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.mcdm.topsis import TOPSIS

def run_topsis_test():
    print("==================================================")
    print("--- Testing MCDM (TOPSIS) Ranking ---")
    print("==================================================\n")
    
    # Mock candidates that survived hard filtering.
    # We now evaluate them on multiple conflicting fuzzy scores + HGAT predicted ratings.
    # Note: All criteria here are "Larger is Better" (Satisfactions & Ratings)
    candidates = [
        {"dest_id": "D1", "name": "Luxury Beach", "hgat": 4.8, "budget_sat": 0.40, "time_sat": 0.90, "hotel_sat": 0.95},
        {"dest_id": "D2", "name": "Cheap City",   "hgat": 3.5, "budget_sat": 0.99, "time_sat": 0.80, "hotel_sat": 0.60},
        {"dest_id": "D3", "name": "Balanced Mtn", "hgat": 4.2, "budget_sat": 0.85, "time_sat": 0.85, "hotel_sat": 0.80},
        {"dest_id": "D4", "name": "Faraway Isle", "hgat": 4.9, "budget_sat": 0.50, "time_sat": 0.10, "hotel_sat": 0.99}
    ]
    
    keys = ["hgat", "budget_sat", "time_sat", "hotel_sat"]
    
    # Criteria Weights: We configure how important each factor is to the group.
    # HGAT Rating (30%), Budget (30%), Time (15%), Hotel Quality (25%)
    weights = [0.3, 0.3, 0.15, 0.25]
    
    # All are benefit criteria (True = Larger is better)
    is_benefit = [True, True, True, True]
    
    print("[INFO] Initializing TOPSIS with:")
    print(f"       Criteria: {keys}")
    print(f"       Weights : {weights}")
    print("       (All criteria set as Benefit/Maximization)\n")
    
    topsis = TOPSIS(criteria_weights=weights, criteria_types=is_benefit)
    ranked = topsis.rank(candidates, criteria_keys=keys)
    
    print("--- Final TOPSIS Ranking Results ---")
    for i, c in enumerate(ranked, 1):
        print(f"Rank {i}. {c['name']:<15} | TOPSIS Score: {c['topsis_score']:.4f}")
        print(f"         [HGAT: {c['hgat']:.1f}, Budget Sat: {c['budget_sat']:.2f}, Time Sat: {c['time_sat']:.2f}, Hotel Sat: {c['hotel_sat']:.2f}]\n")

    print("Observation:")
    print(" - 'Balanced Mtn' wins because it has strong scores across ALL criteria (Ideal Solution).")
    print(" - 'Faraway Isle' loses despite the highest HGAT (4.9) due to terrible Time satisfaction (0.1).")
    
    print("==================================================")

if __name__ == "__main__":
    run_topsis_test()
