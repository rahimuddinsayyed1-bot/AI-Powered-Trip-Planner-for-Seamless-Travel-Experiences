import os
import sys

# Add project root to sys.path so modules can be resolved
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.schemas.user_preferences import UserPreferences, HardConstraints, SoftConstraints
from src.recommendation.baseline import BaselineRecommender

def run_baseline_tests():
    print("=====================================================")
    print("--- Testing Baseline Recommender (GRec_Tr Style) ---")
    print("=====================================================\n")
    
    data_dir = os.path.join(os.path.dirname(__file__), '../data/synthetic')
    baseline = BaselineRecommender(data_dir=data_dir)
    print("[SUCCESS] Successfully initialized CF Matrix and computed Destination Stats.")
    
    # Mocking two users in a group
    user1 = UserPreferences(
        user_id="U0001",
        raw_text="I need something under $2000.",
        hard_constraints=HardConstraints(max_budget=2000.0, max_travel_time_hours=10.0, required_activities=[]),
        soft_constraints=SoftConstraints(preferred_destination_types=["Beach"]),
        flexibility_score=0.5
    )
    
    user2 = UserPreferences(
        user_id="U0002",
        raw_text="I can go up to $2500, but max 6 hours flight.",
        hard_constraints=HardConstraints(max_budget=2500.0, max_travel_time_hours=6.0, required_activities=[]),
        soft_constraints=SoftConstraints(preferred_destination_types=["City"]),
        flexibility_score=0.5
    )
    
    group_prefs = [user1, user2]
    
    print("\n[Group Constraints - Intersection]")
    print(f"- User 1: Max Budget = {user1.hard_constraints.max_budget}, Max Time = {user1.hard_constraints.max_travel_time_hours}")
    print(f"- User 2: Max Budget = {user2.hard_constraints.max_budget}, Max Time = {user2.hard_constraints.max_travel_time_hours}")
    
    print("\n--> Testing 'Average' Aggregation Strategy:")
    avg_recs = baseline.recommend_for_group(group_id="G_TEST", members_prefs=group_prefs, strategy="average", top_k=3)
    
    for rank, rec in enumerate(avg_recs, 1):
        print(f"Rank {rank}: {rec['name']} (Type: {rec['type']})")
        print(f"  Cost: ${rec['estimated_cost']}")
        print(f"  Individual Predictions: {rec['individual_predictions']}")
        print(f"  Group Score (Average): {rec['group_score']}")
        
    print("\n--> Testing 'Least Misery' Aggregation Strategy:")
    lm_recs = baseline.recommend_for_group(group_id="G_TEST", members_prefs=group_prefs, strategy="least_misery", top_k=3)
    
    for rank, rec in enumerate(lm_recs, 1):
        print(f"Rank {rank}: {rec['name']} (Type: {rec['type']})")
        print(f"  Cost: ${rec['estimated_cost']}")
        print(f"  Individual Predictions: {rec['individual_predictions']}")
        print(f"  Group Score (Minimum): {rec['group_score']}")
        
    print("\n=====================================================")

if __name__ == "__main__":
    run_baseline_tests()
