import os
import pandas as pd
import numpy as np
import torch
from torch_geometric.data import HeteroData
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src.schemas.feature_schema import (
    DEST_TYPES, ACT_CATEGORIES, NORM_CONSTANTS
)

class GraphBuilder:
    def __init__(self, data_dir: str):
        """
        Initializes the Heterogeneous Graph Builder.
        Reads tabular CSV data and converts it into a PyTorch Geometric HeteroData structure.
        """
        self.data_dir = data_dir
        
    def build(self) -> HeteroData:
        data = HeteroData()
        
        # 1. Load CSVs
        users = pd.read_csv(os.path.join(self.data_dir, 'users.csv'))
        groups = pd.read_csv(os.path.join(self.data_dir, 'groups.csv'))
        dests = pd.read_csv(os.path.join(self.data_dir, 'destinations.csv'))
        hotels = pd.read_csv(os.path.join(self.data_dir, 'hotels.csv'))
        activities = pd.read_csv(os.path.join(self.data_dir, 'activities.csv'))
        interactions = pd.read_csv(os.path.join(self.data_dir, 'interactions.csv'))

        # 2. Create Mappings (String IDs to Integer Indices)
        self.user_mapping = {uid: i for i, uid in enumerate(users['user_id'])}
        group_mapping = {gid: i for i, gid in enumerate(groups['group_id'])}
        self.dest_mapping = {did: i for i, did in enumerate(dests['dest_id'])}
        hotel_mapping = {hid: i for i, hid in enumerate(hotels['hotel_id'])}
        activity_mapping = {aid: i for i, aid in enumerate(activities['activity_id'])}

        # 3. Create Node Features (Normalized & Encoded)
        
        def one_hot(values, categories):
            matrix = np.zeros((len(values), len(categories)))
            for i, val in enumerate(values):
                if pd.notna(val):
                    val_str = str(val).split(',')
                    for v in val_str:
                        v = v.strip()
                        if v in categories:
                            matrix[i, categories.index(v)] = 1.0
            return torch.tensor(matrix, dtype=torch.float32)

        # Users: [norm_budget, norm_flexibility, one_hot_preferred_type, multi_hot_activities, norm_hotel_budget, norm_act_budget]
        u_budget = torch.tensor(users['budget'].fillna(0).values, dtype=torch.float32).view(-1, 1) / NORM_CONSTANTS['budget_max']
        
        # Flexibility is mapped directly from 0-1, but historical dataset has absolute USD indifference. We normalize it.
        # Max indifference observed is maybe ~100 USD (8300 INR)
        u_flex = torch.tensor(users['flex'].fillna(0).values, dtype=torch.float32).view(-1, 1) / 10000.0
        
        u_type = one_hot(users['preferred_type'].values, DEST_TYPES)
        
        if 'preferred_activities' in users.columns:
            u_acts = one_hot(users['preferred_activities'].values, ACT_CATEGORIES)
        else:
            u_acts = torch.zeros((len(users), len(ACT_CATEGORIES)), dtype=torch.float32)
            
        if 'max_hotel_per_night' in users.columns:
            u_hotel_budget = torch.tensor(users['max_hotel_per_night'].fillna(0).values, dtype=torch.float32).view(-1, 1) / NORM_CONSTANTS['hotel_price_per_night_max']
        else:
            u_hotel_budget = torch.zeros((len(users), 1), dtype=torch.float32)
            
        if 'max_activity_per_day' in users.columns:
            u_act_budget = torch.tensor(users['max_activity_per_day'].fillna(0).values, dtype=torch.float32).view(-1, 1) / NORM_CONSTANTS['activity_price_max']
        else:
            u_act_budget = torch.zeros((len(users), 1), dtype=torch.float32)
            
        data['user'].x = torch.cat([u_budget, u_flex, u_type, u_acts, u_hotel_budget, u_act_budget], dim=-1)
        
        # Groups: [dummy_feature]
        data['group'].x = torch.ones(len(groups), 1, dtype=torch.float32)
        
        # Destinations: [norm_cost, norm_rating, one_hot_type]
        d_cost = torch.tensor(dests['base_cost'].values, dtype=torch.float32).view(-1, 1) / NORM_CONSTANTS['cost_base_max']
        if 'average_rating' in dests.columns:
            d_rating = torch.tensor(dests['average_rating'].values, dtype=torch.float32).view(-1, 1) / NORM_CONSTANTS['rating_max']
        else:
            d_rating = torch.ones((len(dests), 1), dtype=torch.float32) * (4.0 / NORM_CONSTANTS['rating_max'])
        d_type = one_hot(dests['type'].values, DEST_TYPES)
        data['destination'].x = torch.cat([d_cost, d_rating, d_type], dim=-1)
        
        # Hotels: [normalized_price, normalized_rating]
        h_price = torch.tensor(hotels['price_per_night'].values, dtype=torch.float32).view(-1, 1) / NORM_CONSTANTS['hotel_price_per_night_max']
        h_rating = torch.tensor(hotels['rating'].values, dtype=torch.float32).view(-1, 1) / NORM_CONSTANTS['rating_max']
        data['hotel'].x = torch.cat([h_price, h_rating], dim=-1)
        
        # Activities: [normalized_price, normalized_duration, one_hot_category]
        a_price = torch.tensor(activities['price'].values, dtype=torch.float32).view(-1, 1) / NORM_CONSTANTS['activity_price_max']
        a_dur = torch.tensor(activities['duration_hours'].values, dtype=torch.float32).view(-1, 1) / NORM_CONSTANTS['travel_time_max']
        a_cat = one_hot(activities['category'].values, ACT_CATEGORIES)
        data['activity'].x = torch.cat([a_price, a_dur, a_cat], dim=-1)
        
        # 4. Create Edges (User -> Destination Ratings)
        interactions = interactions.dropna(subset=['user_id', 'dest_id', 'rating'])
        u_idx = interactions['user_id'].map(self.user_mapping).values
        d_idx = interactions['dest_id'].map(self.dest_mapping).values
        data['user', 'rated', 'destination'].edge_index = torch.tensor([u_idx, d_idx], dtype=torch.long)
        
        # Store ratings as edge attributes (normalized 0-1)
        edge_weights = torch.tensor(interactions['rating'].values, dtype=torch.float32) / 5.0
        data['user', 'rated', 'destination'].edge_attr = edge_weights.view(-1, 1)
        
        # Destination -> Has -> Hotel
        src_dest_h = [self.dest_mapping[did] for did in hotels['dest_id']]
        dst_hotel = [hotel_mapping[hid] for hid in hotels['hotel_id']]
        data['destination', 'has', 'hotel'].edge_index = torch.tensor([src_dest_h, dst_hotel], dtype=torch.long)
        
        # Destination -> Has -> Activity
        src_dest_a = [self.dest_mapping[did] for did in activities['dest_id']]
        dst_act = [activity_mapping[aid] for aid in activities['activity_id']]
        data['destination', 'has', 'activity'].edge_index = torch.tensor([src_dest_a, dst_act], dtype=torch.long)
        
        # User -> MemberOf -> Group
        u_src = []
        g_dst = []
        for _, row in groups.iterrows():
            gid = row['group_id']
            # Safely split by comma and strip spaces
            members = [m.strip() for m in str(row['members']).split(',') if m.strip()]
            for m in members:
                if m in self.user_mapping:
                    u_src.append(self.user_mapping[m])
                    g_dst.append(group_mapping[gid])
                    
        data['user', 'member_of', 'group'].edge_index = torch.tensor([u_src, g_dst], dtype=torch.long)
        
        return data
