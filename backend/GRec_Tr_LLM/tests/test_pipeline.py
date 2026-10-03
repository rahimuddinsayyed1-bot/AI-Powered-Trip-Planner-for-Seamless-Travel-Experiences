import os
import sys
import pytest
import numpy as np

# Ensure modules can be resolved
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.nlp.preference_parser import PreferenceParser
from src.fuzzy.constraint_satisfaction import FuzzyConstraintEvaluator
from src.mcdm.topsis import TOPSIS
from src.optimization.nash_bargaining import NashBargainingOptimizer
from src.recommendation.integrated_package import IntegratedPackageRecommender
from src.schemas.user_preferences import UserPreferences, HardConstraints, SoftConstraints
from src.schemas.feature_schema import USD_TO_INR, EUR_TO_INR

# --- 1. NLP Parser Tests ---
def test_nlp_parser_mock_currencies():
    parser = PreferenceParser(use_mock=True)
    
    prefs_inr = parser.parse_preferences("budget of ₹30,000", "U1")
    assert prefs_inr.hard_constraints.max_budget == 30000.0
    
    prefs_usd = parser.parse_preferences("budget of $1,000", "U2")
    assert prefs_usd.hard_constraints.max_budget == 1000.0 * USD_TO_INR
    
    prefs_eur = parser.parse_preferences("budget of €500", "U3")
    assert prefs_eur.hard_constraints.max_budget == 500.0 * EUR_TO_INR

def test_nlp_parser_mock_activities():
    parser = PreferenceParser(use_mock=True)
    prefs = parser.parse_preferences("I want luxury hotel and no long flight, maybe water sports", "U1")
    
    assert prefs.hard_constraints.max_travel_time_hours == 6.0 # LONG_FLIGHT_HOURS_THRESHOLD
    assert prefs.soft_constraints.min_hotel_rating == 4.5      # LUXURY_HOTEL_RATING_THRESHOLD
    assert "water sports" in prefs.soft_constraints.preferred_activities

# --- 2. Fuzzy Logic Strict Constraints Tests ---
def test_fuzzy_strict_budget():
    evaluator = FuzzyConstraintEvaluator()
    # 1000 limit, 1200 cost -> STRICT FAIL -> 0.0
    score = evaluator.evaluate_budget(actual_cost=1200, max_budget=1000, flexibility=0.5)
    assert score == 0.0
    
    # 1000 limit, 800 cost -> Pass
    score2 = evaluator.evaluate_budget(actual_cost=800, max_budget=1000, flexibility=0.5)
    assert score2 == 1.0

def test_fuzzy_strict_travel_time():
    evaluator = FuzzyConstraintEvaluator()
    # 5.0 hours limit, 6.0 cost -> STRICT FAIL -> 0.0
    score = evaluator.evaluate_travel_time(actual_time=6.0, max_time=5.0, flexibility=0.5)
    assert score == 0.0
    
    score2 = evaluator.evaluate_travel_time(actual_time=4.0, max_time=5.0, flexibility=0.5)
    assert score2 == 1.0

# --- 3. MCDM (TOPSIS) Benefit vs Cost Tests ---
def test_topsis_cost_vs_benefit():
    # c1 = cost (False), c2 = benefit (True)
    topsis = TOPSIS([0.5, 0.5], [False, True])
    candidates = [
        {"id": "Expensive_Good", "c1": 100.0, "c2": 5.0},
        {"id": "Cheap_Bad", "c1": 10.0, "c2": 1.0},
        {"id": "Cheap_Good", "c1": 15.0, "c2": 4.5} # Should win
    ]
    ranked = topsis.rank(candidates, ['c1', 'c2'])
    assert ranked[0]['id'] == "Cheap_Good"

# --- 4. Nash Bargaining Dynamic Reference Tests ---
def test_nash_bargaining_dynamic_reference():
    nash = NashBargainingOptimizer(epsilon=1e-5)
    # Both are feasible
    candidates = [
        {"id": "A", "feasible": True, "member_utilities": {"U1": 0.8, "U2": 0.5}},
        {"id": "B", "feasible": True, "member_utilities": {"U1": 0.3, "U2": 0.9}}
    ]
    
    d_points = nash.calculate_disagreement_points(candidates, ["U1", "U2"])
    
    # Worst case for U1 is candidate B (0.3). d_point = max(0, 0.3 - 0.1) = 0.2
    assert np.isclose(d_points["U1"], 0.2)
    # Worst case for U2 is candidate A (0.5). d_point = max(0, 0.5 - 0.1) = 0.4
    assert np.isclose(d_points["U2"], 0.4)

# --- 5. E2E Integrated Pipeline Tests ---
def test_end_to_end_inference():
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/synthetic'))
    weights = {'alpha_hgat': 0.25, 'beta_fuzzy': 0.25, 'gamma_mcdm': 0.25, 'delta_nash': 0.25}
    
    try:
        recommender = IntegratedPackageRecommender(data_dir, weights)
    except RuntimeError:
        pytest.skip("Models not trained yet.")
        
    u1 = UserPreferences(
        user_id="U1", raw_text="I want a luxury beach holiday with budget $500", flexibility_score=0.5,
        hard_constraints=HardConstraints(max_budget=500*USD_TO_INR), 
        soft_constraints=SoftConstraints(preferred_destination_types=["Beach"], min_hotel_rating=4.5)
    )
    
    u2 = UserPreferences(
        user_id="U2", raw_text="I want nature and hiking, budget ₹50,000", flexibility_score=0.8,
        hard_constraints=HardConstraints(max_budget=50000.0), 
        soft_constraints=SoftConstraints(preferred_destination_types=["Nature"], preferred_activities=["Hiking"])
    )
    
    # 1. Test Package Assembly
    dest_row = recommender.dests.iloc[0]
    packages = recommender.assemble_package(dest_row, [u1, u2])
    
    assert isinstance(packages, list)
    assert len(packages) > 0
    
    # 2. Test End-to-End Evaluation
    # Evaluate candidates
    final_candidates = recommender.recommend([u1, u2])
    
    if len(final_candidates) > 0:
        top_cand = final_candidates[0]
        assert 'nash_score' in top_cand
        assert 'member_utilities' in top_cand
        assert 'topsis_score' in top_cand
        assert 'hgat_scores' in top_cand
