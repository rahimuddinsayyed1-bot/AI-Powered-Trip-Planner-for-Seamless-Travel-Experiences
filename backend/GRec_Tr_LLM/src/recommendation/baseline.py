import pandas as pd
import numpy as np
import os
from typing import List, Dict, Any, Optional

class BaselineRecommender:
    def __init__(self, data_dir: str):
        """
        Initializes the Baseline Recommender based on traditional GRec_Tr concepts:
        Pearson Correlation CF, Hard Constraints, and standard Group Aggregation.
        Also loads destination activities and precalculates true historical ratings.
        """
        self.data_dir = data_dir
        self.destinations = pd.read_csv(os.path.join(data_dir, 'destinations.csv'))
        self.hotels = pd.read_csv(os.path.join(data_dir, 'hotels.csv'))
        self.flights = pd.read_csv(os.path.join(data_dir, 'flights.csv'))
        self.interactions = pd.read_csv(os.path.join(data_dir, 'interactions.csv'))
        
        activities_path = os.path.join(data_dir, 'activities.csv')
        self.activities = pd.read_csv(activities_path) if os.path.exists(activities_path) else pd.DataFrame()
        
        # Precompute destination-level stats
        self.dest_stats = self._compute_dest_stats()
        self.dest_avg_ratings = self.interactions.groupby('dest_id')['rating'].mean().to_dict()
        
        if not self.activities.empty and 'dest_id' in self.activities.columns and 'category' in self.activities.columns:
            self.dest_activity_categories = self.activities.groupby('dest_id')['category'].apply(lambda x: set(x.astype(str).str.lower())).to_dict()
        else:
            self.dest_activity_categories = {}
        
        # Precompute Pearson similarity matrix
        self.user_item_matrix = self.interactions.pivot(index='user_id', columns='dest_id', values='rating')
        self.user_similarity = self.user_item_matrix.T.corr(method='pearson')

    def _compute_dest_stats(self) -> pd.DataFrame:
        """Aggregates minimum/average costs for flights and hotels per destination."""
        avg_hotels = self.hotels.groupby('dest_id')['price_per_night'].mean().reset_index()
        avg_flights = self.flights.groupby('dest_id').agg(
            avg_flight_cost=('price', 'mean'),
            avg_duration=('duration_hours', 'mean')
        ).reset_index()
        
        stats = pd.merge(self.destinations, avg_hotels, on='dest_id', how='left')
        stats = pd.merge(stats, avg_flights, on='dest_id', how='left')
        # Total estimated baseline cost: Base cost + avg flight + 3 nights hotel
        stats['estimated_total_cost'] = stats['base_cost'] + stats['avg_flight_cost'] + (stats['price_per_night'] * 3)
        return stats

    def predict_user_rating(self, user_id: str, dest_id: str, user_pref: Optional[Any] = None) -> float:
        """
        Predicts a user's rating for a destination using User-User Collaborative Filtering.
        For cold-start users (e.g. dynamic web users u_0, u_1, ...), combines historical
        destination ratings with standard content preference alignment (dest type & activities).
        """
        # 1. Warm-start: If user exists in historical interaction matrix, apply standard Pearson CF
        if user_id in self.user_item_matrix.index and dest_id in self.user_item_matrix.columns:
            user_ratings = self.user_item_matrix.loc[user_id]
            if pd.isna(user_ratings[dest_id]) == False:
                return float(user_ratings[dest_id])
                
            similarities = self.user_similarity[user_id].dropna()
            if not similarities.empty:
                other_users_ratings = self.user_item_matrix[dest_id].dropna()
                common_users = similarities.index.intersection(other_users_ratings.index)
                if len(common_users) > 0:
                    sim_scores = similarities[common_users]
                    ratings = other_users_ratings[common_users]
                    positive_mask = sim_scores > 0
                    if positive_mask.any():
                        weighted_sum = (sim_scores[positive_mask] * ratings[positive_mask]).sum()
                        sum_of_weights = sim_scores[positive_mask].sum()
                        if sum_of_weights > 0:
                            return float(round(weighted_sum / sum_of_weights, 2))

        # 2. Cold-start fallback (e.g. dynamic web users)
        # Base rating derived from real historical interaction logs
        base_rating = float(self.dest_avg_ratings.get(dest_id, 3.8))
        
        # Apply standard content-based preference alignment if user preference metadata is provided
        if user_pref is not None:
            sc = getattr(user_pref, 'soft_constraints', None)
            if sc:
                # A. Destination Type Match (Beach, Mountain, Historic, City, Nature)
                dest_row = self.destinations[self.destinations['dest_id'] == dest_id]
                dest_type = str(dest_row['type'].values[0]).lower() if (not dest_row.empty and 'type' in dest_row.columns) else ''
                pref_types = [t.lower() for t in (getattr(sc, 'preferred_destination_types', []) or [])]
                
                if pref_types:
                    if any(pt in dest_type or dest_type in pt for pt in pref_types):
                        base_rating += 0.7  # Category alignment bonus
                    else:
                        base_rating -= 0.4  # Preference divergence penalty
                
                # B. Activity Match
                pref_acts = [a.lower() for a in (getattr(sc, 'preferred_activities', []) or [])]
                dest_acts = self.dest_activity_categories.get(dest_id, set())
                if pref_acts and dest_acts:
                    matches = sum(1 for a in pref_acts if any(a in da or da in a for da in dest_acts))
                    base_rating += min(0.5, matches * 0.15)
                    
        return float(np.clip(round(base_rating, 2), 1.0, 5.0))

    def filter_candidates(self, members_prefs: List[Any]) -> pd.DataFrame:
        """
        Applies rigid hard constraints (intersection logic).
        If a destination violates ANY member's hard constraint, it is discarded.
        """
        valid_dests = self.dest_stats.copy()
        
        for pref in members_prefs:
            hc = pref.hard_constraints
            if hc.max_budget:
                valid_dests = valid_dests[valid_dests['estimated_total_cost'] <= hc.max_budget]
            if hc.max_travel_time_hours:
                valid_dests = valid_dests[valid_dests['avg_duration'] <= hc.max_travel_time_hours]
                
        return valid_dests

    def recommend_for_group(self, group_id: str, members_prefs: List[Any], strategy: str = 'average', top_k: int = 5) -> List[Dict]:
        """
        End-to-end baseline recommendation.
        1. Rigid hard constraint filtering.
        2. CF Pearson / Cold-start predictions for valid candidates.
        3. Aggregation via Average or Least Misery strategy.
        """
        # 1. Filter
        candidates = self.filter_candidates(members_prefs)
        if candidates.empty:
            return [] # Constraint violation failure
            
        results = []
        # 2. Predict & 3. Aggregate
        for _, row in candidates.iterrows():
            dest_id = row['dest_id']
            individual_scores = []
            
            for pref in members_prefs:
                score = self.predict_user_rating(pref.user_id, dest_id, user_pref=pref)
                individual_scores.append(score)
                
            if strategy == 'average':
                group_score = np.mean(individual_scores)
            elif strategy == 'least_misery':
                group_score = np.min(individual_scores)
            else:
                raise ValueError(f"Unknown aggregation strategy: {strategy}")
                
            results.append({
                'dest_id': dest_id,
                'name': row['name'],
                'type': row['type'],
                'estimated_cost': round(row['estimated_total_cost'], 2),
                'individual_predictions': [round(s, 2) for s in individual_scores],
                'group_score': round(group_score, 2)
            })
            
        # 4. Rank
        results.sort(key=lambda x: x['group_score'], reverse=True)
        return results[:top_k]
