import os
import sys
import yaml

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.schemas.user_preferences import UserPreferences, HardConstraints, SoftConstraints
from src.recommendation.integrated_package import IntegratedPackageRecommender

def run_integrated_tests():
    print("=====================================================")
    print("--- Testing Integrated GRec_Tr-LLM Pipeline ---")
    print("=====================================================\n")
    
    data_dir = os.path.join(os.path.dirname(__file__), '../data/synthetic')
    
    # Load configurable weights from config.yaml
    config_path = os.path.join(os.path.dirname(__file__), '../config.yaml')
    with open(config_path, 'r') as file:
        config = yaml.safe_load(file)
    weights = config.get('ranking_weights', {'alpha_hgat': 0.25, 'beta_fuzzy': 0.25, 'gamma_mcdm': 0.25, 'delta_nash': 0.25})
    
    recommender = IntegratedPackageRecommender(data_dir=data_dir, weights=weights)
    print(f"[INFO] Initialized Pipeline with Equation Weights: {weights}\n")
    
    # Mocking NLP output for a group of 3 members
    u1 = UserPreferences(
        user_id="U1", raw_text="", flexibility_score=0.5,
        hard_constraints=HardConstraints(max_budget=2500.0, max_travel_time_hours=8.0, required_activities=[]),
        soft_constraints=SoftConstraints(min_hotel_rating=4.0)
    )
    u2 = UserPreferences(
        user_id="U2", raw_text="", flexibility_score=0.8,
        hard_constraints=HardConstraints(max_budget=3000.0, max_travel_time_hours=12.0, required_activities=[]),
        soft_constraints=SoftConstraints(min_hotel_rating=3.0)
    )
    u3 = UserPreferences(
        user_id="U3", raw_text="", flexibility_score=0.4,
        hard_constraints=HardConstraints(max_budget=1500.0, max_travel_time_hours=5.0, required_activities=[]),
        soft_constraints=SoftConstraints(min_hotel_rating=4.5)
    )
    
    group = [u1, u2, u3]
    
    # Generate Top Packages
    top_packages = recommender.recommend(group_prefs=group, top_k=3)
    
    print("--- Final Integrated Travel Packages ---")
    for i, pkg in enumerate(top_packages, 1):
        print(f"[{i}] Destination: {pkg['name']} ({pkg['type']}) | Final Score: {pkg['final_score']}")
        print(f"    - Package : Hotel {pkg['hotel']} (Rating: {pkg['hotel_rating']}), Flight: ${pkg['flight_cost']} ({pkg['flight_time']}h)")
        print(f"    - Activities: {pkg['activities']}")
        print(f"    - Total Est Cost: ${pkg['total_cost']}")
        print(f"    - HGAT Score: {pkg['avg_hgat']:.2f}/5.0 | Fuzzy Sat: {pkg['avg_fuzzy']:.2f}/1.0")
        print(f"    - MCDM Score: {pkg['topsis_score']:.4f} | Nash Fairness: {pkg['norm_nash']:.4f}\n")
        
    print("=====================================================")

if __name__ == "__main__":
    run_integrated_tests()
