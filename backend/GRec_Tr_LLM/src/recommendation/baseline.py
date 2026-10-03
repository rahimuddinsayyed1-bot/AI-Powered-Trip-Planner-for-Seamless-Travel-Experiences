import pandas as pd
import numpy as np
import os
from typing import List, Dict, Any

class BaselineRecommender:
    def __init__(self, data_dir: str):
        """
        Initializes the Baseline Recommender based on traditional GRec_Tr concepts:
        Pearson Correlation CF, Hard Constraints, and standard Group Aggregation.
        """
        self.data_dir = data_dir
        self.destinations = pd.read_csv(os.path.join(data_dir, 'destinations.csv'))
        self.hotels = pd.read_csv(os.path.join(data_dir, 'hotels.csv'))
        self.flights = pd.read_csv(os.path.join(data_dir, 'flights.csv'))
        self.interactions = pd.read_csv(os.path.join(data_dir, 'interactions.csv'))
        
        # Precompute average costs for destinations to facilitate hard constraint filtering
        self.dest_stats = self._compute_dest_stats()
        
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

    def predict_user_rating(self, user_id: str, dest_id: str) -> float:
        """Predicts a user's rating for a destination using User-User Collaborative Filtering."""
        if user_id not in self.user_item_matrix.index or dest_id not in self.user_item_matrix.columns:
            # Cold start fallback: Return destination's global average rating
            dest_row = self.destinations[self.destinations['dest_id'] == dest_id]
            if not dest_row.empty and 'average_rating' in dest_row.columns:
                return dest_row['average_rating'].values[0]
            return 4.0 # Global fallback
            
        user_ratings = self.user_item_matrix.loc[user_id]
        if pd.isna(user_ratings[dest_id]) == False:
            return user_ratings[dest_id] # Already rated
            
        similarities = self.user_similarity[user_id].dropna()
        if similarities.empty:
            return self.destinations[self.destinations['dest_id'] == dest_id]['average_rating'].values[0] if 'average_rating' in self.destinations.columns else 4.0
            
        other_users_ratings = self.user_item_matrix[dest_id].dropna()
        common_users = similarities.index.intersection(other_users_ratings.index)
        
        if len(common_users) == 0:
            return self.destinations[self.destinations['dest_id'] == dest_id]['average_rating'].values[0] if 'average_rating' in self.destinations.columns else 4.0
            
        # Weighted sum based on Pearson similarity
        sim_scores = similarities[common_users]
        ratings = other_users_ratings[common_users]
        
        # Only use positive similarities
        positive_mask = sim_scores > 0
        if not positive_mask.any():
            return self.destinations[self.destinations['dest_id'] == dest_id]['average_rating'].values[0] if 'average_rating' in self.destinations.columns else 4.0
            
        weighted_sum = (sim_scores[positive_mask] * ratings[positive_mask]).sum()
        sum_of_weights = sim_scores[positive_mask].sum()
        
        return weighted_sum / sum_of_weights

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
        2. CF Pearson predictions for valid candidates.
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
                score = self.predict_user_rating(pref.user_id, dest_id)
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
