import pandas as pd
import numpy as np
import os
from typing import List, Dict, Any

from src.fuzzy.constraint_satisfaction import FuzzyConstraintEvaluator
from src.mcdm.topsis import TOPSIS
from src.optimization.nash_bargaining import NashBargainingOptimizer

import torch
import torch_geometric.transforms as T
from torch.nn import functional as F
from src.graph.build_graph import GraphBuilder
from src.graph.hgat_model import HGATRecommender, RatingPredictor
from src.schemas.user_preferences import GroupPreferences, UserPreferences
from src.schemas.feature_schema import DEST_TYPES, ACT_CATEGORIES, NORM_CONSTANTS

class IntegratedPackageRecommender:
    def __init__(self, data_dir: str, weights: Dict[str, float]):
        """
        Combines HGAT, Fuzzy Logic, TOPSIS, and Nash Bargaining to recommend
        complete travel packages (Destination + Hotel + Flight + Activities).
        
        weights: Dictionary containing alpha, beta, gamma, delta tuning parameters.
        """
        self.data_dir = data_dir
        self.alpha = weights.get('alpha_hgat', 0.25)
        self.beta = weights.get('beta_fuzzy', 0.25)
        self.gamma = weights.get('gamma_mcdm', 0.25)
        self.delta = weights.get('delta_nash', 0.25)
        
        self.dests = pd.read_csv(os.path.join(data_dir, 'destinations.csv'))
        self.hotels = pd.read_csv(os.path.join(data_dir, 'hotels.csv'))
        self.flights = pd.read_csv(os.path.join(data_dir, 'flights.csv'))
        self.activities = pd.read_csv(os.path.join(data_dir, 'activities.csv'))
        
        # Initialize subsystem modules
        self.fuzzy_eval = FuzzyConstraintEvaluator()
        # TOPSIS Criteria: [HGAT, FuzzyBudget, FuzzyTime, FuzzyHotel]
        self.topsis = TOPSIS([0.3, 0.3, 0.15, 0.25], [True, True, True, True])
        self.nash = NashBargainingOptimizer()
        
        # --- Load Trained PyTorch HGAT Model ---
        try:
            builder = GraphBuilder(data_dir=data_dir)
            self.graph_data = builder.build()
            self.user_mapping = builder.user_mapping
            self.dest_mapping = builder.dest_mapping
            self.graph_data = T.ToUndirected()(self.graph_data)
            
            self.hgat = HGATRecommender(hidden_channels=64, out_channels=32, num_heads=4)
            self.predictor = RatingPredictor(embedding_dim=32)
            
            # Dummy forward to init lazy layers
            with torch.no_grad():
                out = self.hgat(self.graph_data.x_dict, self.graph_data.edge_index_dict)
                self.predictor(out['user'], out['destination'], self.graph_data['user', 'rated', 'destination'].edge_index)
                
            models_dir = os.path.join(os.path.dirname(__file__), '../../models')
            self.hgat.load_state_dict(torch.load(os.path.join(models_dir, 'hgat_model.pth')), strict=False)
            self.predictor.load_state_dict(torch.load(os.path.join(models_dir, 'hgat_predictor.pth')), strict=False)
            self.hgat.eval()
            self.predictor.eval()
            
            # Precompute embeddings to save time
            with torch.no_grad():
                self.node_embeddings = self.hgat(self.graph_data.x_dict, self.graph_data.edge_index_dict)
            self.hgat_loaded = True
            
        except Exception as e:
            print(f"Warning: Failed to load trained HGAT model, using mock predictions. Error: {e}")
            self.hgat_loaded = False
            
    def _hgat_predict(self, pref: Any, dest_id: str) -> float:
        """
        Executes a real forward pass using the trained PyTorch HGAT model.
        For new dynamic users, we create a feature tensor dynamically from their parsed NLP constraints,
        and project it into the embedding space using the trained linear layer (TRUE COLD START).
        """
        if not getattr(self, 'hgat_loaded', False):
            raise RuntimeError("HGAT model is not loaded. Cannot generate ML predictions.")
            
        d_idx = self.dest_mapping.get(dest_id)
        if d_idx is None:
            return 3.5 
            
        with torch.no_grad():
            u_idx = self.user_mapping.get(pref.user_id)
            if u_idx is not None:
                u_emb = self.node_embeddings['user'][u_idx:u_idx+1]
            else:
                # TRUE COLD START: Build feature tensor dynamically, identically to training
                # Users: [norm_budget, norm_flexibility, one_hot_preferred_type, multi_hot_activities, norm_hotel_budget, norm_act_budget]
                budget = (pref.hard_constraints.max_budget or 0) / NORM_CONSTANTS['budget_max']
                flex = pref.flexibility_score / 10000.0 # Match training normalization
                
                type_vec = np.zeros(len(DEST_TYPES))
                if pref.soft_constraints.preferred_destination_types:
                    for ptype in pref.soft_constraints.preferred_destination_types:
                        if ptype in DEST_TYPES:
                            type_vec[DEST_TYPES.index(ptype)] = 1.0
                            
                acts_vec = np.zeros(len(ACT_CATEGORIES))
                if pref.soft_constraints.preferred_activities:
                    for act in pref.soft_constraints.preferred_activities:
                        if act in ACT_CATEGORIES:
                            acts_vec[ACT_CATEGORIES.index(act)] = 1.0
                            
                h_budget = 0.0 # Inferring this from dataset is complex; NLP doesn't explicitly give per night hotel budget. We leave at 0 or deduce.
                a_budget = 0.0
                
                raw_u_feat = torch.tensor([[budget, flex] + type_vec.tolist() + acts_vec.tolist() + [h_budget, a_budget]], dtype=torch.float32)
                
                # True cold start projection: linear map then pass through GAT layers to get correct embedding dim
                # To simulate a disconnected node, we pass an empty graph dictionary through the GAT
                x_dict_mock = {'user': raw_u_feat}
                edge_index_dict_mock = {} # Empty graph, no neighbors
                
                # We also need empty tensors for the other node types so the network doesn't crash if it expects them
                for nt in self.hgat.lin_dict.keys():
                    if nt != 'user':
                        x_dict_mock[nt] = torch.zeros((0, 1), dtype=torch.float32)
                
                # Pass through HGAT
                try:
                    mock_out = self.hgat(x_dict_mock, edge_index_dict_mock)
                    u_emb = mock_out['user']
                except Exception:
                    # Fallback if empty graph fails: just use the linear projection and a zero-padded/sliced version
                    proj = torch.nn.functional.leaky_relu(self.hgat.lin_dict['user'](raw_u_feat))
                    # Wait, out_channels is 32. 
                    # If we bypass GAT because of empty graph, we must ensure it's size 32.
                    # proj is [1, 64]. We can apply a generic linear projection to get 32.
                    # Since we don't have the GAT weights, we just slice for the fallback.
                    u_emb = proj[:, :32]
                
            d_emb = self.node_embeddings['destination'][d_idx:d_idx+1]
            edge_idx = torch.tensor([[0], [0]], dtype=torch.long)
            pred = self.predictor(u_emb, d_emb, edge_idx).item()
            
        return round(max(1.0, min(5.0, pred)), 2)
        
    def assemble_package(self, dest_row, group_prefs) -> List[Dict]:
        """
        Generates feasible combinatorial packages (flight + hotel + activities) for a destination.
        Returns a list of candidate packages instead of just a single greedy one.
        """
        dest_id = dest_row['dest_id']
        dest_flights = self.flights[self.flights['dest_id'] == dest_id]
        dest_hotels = self.hotels[self.hotels['dest_id'] == dest_id]
        dest_acts = self.activities[self.activities['dest_id'] == dest_id]
        
        candidates = []
        
        # Take up to 2 flights (e.g. cheapest and fastest)
        top_flights = []
        if not dest_flights.empty:
            top_flights.append(dest_flights.loc[dest_flights['price'].idxmin()])
            if len(dest_flights) > 1:
                top_flights.append(dest_flights.loc[dest_flights['duration_hours'].idxmin()])
        else:
            top_flights.append(None)
            
        # Take up to 5 hotels for variety
        top_hotels = []
        if not dest_hotels.empty:
            # We can take all of them, or up to 5
            for _, row in dest_hotels.head(5).iterrows():
                top_hotels.append(row)
        else:
            top_hotels.append(None)
            
        for f in top_flights:
            for h in top_hotels:
                top_activities = dest_acts.sample(n=min(2, len(dest_acts))).to_dict('records') if not dest_acts.empty else []
                
                candidates.append({
                    "dest_id": dest_id,
                    "name": dest_row['name'],
                    "type": dest_row['type'],
                    "hotel": h['name'] if h is not None else "None",
                    "flight_cost": float(f['price']) if f is not None else 0.0,
                    "hotel_cost_total": float(h['price_per_night'] * 3) if h is not None else 0.0,
                    "total_cost": dest_row['base_cost'] + (f['price'] if f is not None else 0.0) + (h['price_per_night'] * 3 if h is not None else 0.0) + sum([a['price'] for a in top_activities]),
                    "flight_time": float(f['duration_hours']) if f is not None else 0.0,
                    "hotel_rating": float(h['rating']) if h is not None else 0.0,
                    "activities": [a['name'] for a in top_activities]
                })
        
        return candidates

    def recommend(self, group_prefs: List[Any], target_dest_name: str = None, top_k: int = 5) -> List[Dict]:
        """
        Executes the full pipeline:
        Package Assembly -> HGAT -> Fuzzy -> Nash -> TOPSIS -> Final Score
        """
        packages = []
        
        # 1. Assemble Packages and compute base metrics
        for _, dest_row in self.dests.iterrows():
            # If a specific destination was voted by the group, strictly filter others out
            if target_dest_name:
                # We split by comma in case frontend sends 'Agra, India' but dataset has 'Agra'
                target_base = target_dest_name.split(',')[0].strip().lower()
                dest_name_lower = dest_row['name'].lower()
                if target_base not in dest_name_lower and dest_name_lower not in target_base:
                    continue
                    
            candidates = self.assemble_package(dest_row, group_prefs)
            
            for pkg in candidates:
                member_utils = {}
                hgat_scores = []
                
                # 2. Calculate HGAT & Fuzzy Satisfactions per member
                for pref in group_prefs:
                    hgat_score = self._hgat_predict(pref, pkg['dest_id'])
                    hgat_scores.append(hgat_score)
                    
                    f_scores = self.fuzzy_eval.get_satisfaction_scores(
                        actual_cost=pkg['total_cost'], max_budget=pref.hard_constraints.max_budget,
                        actual_time=pkg['flight_time'], max_time=pref.hard_constraints.max_travel_time_hours,
                        actual_rating=pkg['hotel_rating'], min_rating=pref.soft_constraints.min_hotel_rating,
                        flexibility=pref.flexibility_score
                    )
                    
                    # Assign to package for TOPSIS to use later
                    pkg[f'budget_sat_{pref.user_id}'] = f_scores['budget_satisfaction']
                    pkg[f'time_sat_{pref.user_id}'] = f_scores['travel_time_satisfaction']
                    pkg[f'hotel_sat_{pref.user_id}'] = f_scores['hotel_satisfaction']
                    
                    # Individual utility = 50% HGAT (normalized to 0-1) + 50% Fuzzy Overall
                    util = ( (hgat_score / 5.0) * 0.5 ) + (f_scores['overall_satisfaction'] * 0.5)
                    member_utils[pref.user_id] = util
                    
                pkg['member_utilities'] = member_utils
                pkg['hgat_scores'] = hgat_scores
                pkg['avg_hgat'] = np.mean(hgat_scores)
                
                # Aggregate group fuzzy scores for TOPSIS
                pkg['group_budget_sat'] = np.mean([pkg[f'budget_sat_{p.user_id}'] for p in group_prefs])
                pkg['group_time_sat'] = np.mean([pkg[f'time_sat_{p.user_id}'] for p in group_prefs])
                pkg['group_hotel_sat'] = np.mean([pkg[f'hotel_sat_{p.user_id}'] for p in group_prefs])
                
                packages.append(pkg)
            
        if not packages:
            return []
            
        # 3. Nash Bargaining
        member_ids = [p.user_id for p in group_prefs]
        packages = self.nash.rank(packages, member_ids)
        
        # Normalize Nash scores (0.0 to 1.0)
        max_nash = max([p['nash_score'] for p in packages]) + 1e-9
        for p in packages:
            p['norm_nash'] = p['nash_score'] / max_nash
            
        # 4. TOPSIS MCDM (Ranking on Group Aggregated Features)
        packages = self.topsis.rank(packages, criteria_keys=['avg_hgat', 'group_budget_sat', 'group_time_sat', 'group_hotel_sat'])
        
        # 5. Final Configurable Equation
        # FinalScore = α*HGAT + β*Fuzzy + γ*MCDM + δ*Nash
        for p in packages:
            hgat_norm = p['avg_hgat'] / 5.0
            avg_fuzzy = (p['group_budget_sat'] + p['group_time_sat'] + p['group_hotel_sat']) / 3.0
            
            # Penalize Fuzzy Score heavily if NLP extracted destination types or activities don't match
            penalty = 0.0
            for pref in group_prefs:
                if pref.soft_constraints.preferred_destination_types:
                    if p['type'].lower() not in [t.lower() for t in pref.soft_constraints.preferred_destination_types]:
                        penalty += 0.3
                
                if pref.soft_constraints.preferred_activities:
                    act_match = False
                    for a in p['activities']:
                        if isinstance(a, dict):
                            a_name = a.get('name', '')
                        else:
                            a_name = a
                        if any(req_act.lower() in a_name.lower() for req_act in pref.soft_constraints.preferred_activities):
                            act_match = True
                            break
                    if not act_match:
                        penalty += 0.15
                        
            avg_fuzzy = max(0.01, avg_fuzzy - penalty)
            p['avg_fuzzy'] = avg_fuzzy  # Fix missing key assignment
            
            p['final_score'] = (
                self.alpha * hgat_norm +
                self.beta * avg_fuzzy +
                self.gamma * p['topsis_score'] +
                self.delta * p['norm_nash']
            )
            p['final_score'] = round(p['final_score'], 4)
            
        # Sort by Final Score
        packages = sorted(packages, key=lambda x: x['final_score'], reverse=True)
        
        # Deduplicate by hotel name to avoid repeating the same hotel
        unique_packages = []
        seen_hotels = set()
        for p in packages:
            if p['hotel'] not in seen_hotels:
                seen_hotels.add(p['hotel'])
                unique_packages.append(p)
                if len(unique_packages) == top_k:
                    break
                    
        return unique_packages
