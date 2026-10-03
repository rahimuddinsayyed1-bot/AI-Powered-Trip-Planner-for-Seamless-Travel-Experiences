import os
import pandas as pd
import numpy as np
import yaml
import random

# Load config
config_path = os.path.join(os.path.dirname(__file__), '../../config.yaml')
with open(config_path, 'r') as file:
    config = yaml.safe_load(file)

seed = config['dataset']['random_seed']
np.random.seed(seed)
random.seed(seed)

SYNTHETIC_DIR = os.path.join(os.path.dirname(__file__), '../../data/synthetic/')
os.makedirs(SYNTHETIC_DIR, exist_ok=True)

DEST_TYPES = ['Beach', 'Mountain', 'City', 'Historic', 'Adventure']
ACT_CATEGORIES = ['Sightseeing', 'Water Sports', 'Hiking', 'Food Tour', 'Museum']

def generate_destinations(n):
    data = {
        'dest_id': [f'D{i:03d}' for i in range(n)],
        'name': [f'Destination_{i}' for i in range(n)],
        'type': np.random.choice(DEST_TYPES, n),
        'base_cost': np.round(np.random.uniform(100, 1000, n), 2),
        'average_rating': np.round(np.random.uniform(3.0, 5.0, n), 1)
    }
    return pd.DataFrame(data)

def generate_hotels(n, dest_ids):
    data = {
        'hotel_id': [f'H{i:04d}' for i in range(n)],
        'dest_id': np.random.choice(dest_ids, n),
        'name': [f'Hotel_{i}' for i in range(n)],
        'price_per_night': np.round(np.random.uniform(50, 500, n), 2),
        'rating': np.round(np.random.uniform(2.5, 5.0, n), 1)
    }
    return pd.DataFrame(data)

def generate_activities(n, dest_ids):
    data = {
        'activity_id': [f'A{i:04d}' for i in range(n)],
        'dest_id': np.random.choice(dest_ids, n),
        'name': [f'Activity_{i}' for i in range(n)],
        'cost': np.round(np.random.uniform(0, 200, n), 2),
        'duration_hours': np.round(np.random.uniform(1, 8, n), 1),
        'category': np.random.choice(ACT_CATEGORIES, n)
    }
    return pd.DataFrame(data)

def generate_flights(n, dest_ids):
    data = {
        'flight_id': [f'F{i:04d}' for i in range(n)],
        'dest_id': np.random.choice(dest_ids, n),
        'cost': np.round(np.random.uniform(100, 1500, n), 2),
        'duration_hours': np.round(np.random.uniform(1, 15, n), 1)
    }
    return pd.DataFrame(data)

def generate_users_and_groups(n_users, n_groups):
    # Map users to T-series to align with standard dataset structures, but note that 
    # the frontend uses U-series dynamically.
    users = pd.DataFrame({
        'user_id': [f'T{i:04d}' for i in range(n_users)],
        'name': [f'User_{i}' for i in range(n_users)],
        'preferred_budget': np.round(np.random.uniform(500, 3000, n_users), 2),
        'preferred_type': np.random.choice(DEST_TYPES, n_users),
        'flexibility': np.round(np.random.uniform(0.1, 1.0, n_users), 2)
    })
    
    groups_data = []
    user_ids = users['user_id'].tolist()
    for i in range(n_groups):
        group_size = random.randint(2, 5)
        members = random.sample(user_ids, group_size)
        groups_data.append({
            'group_id': f'G{i:03d}',
            'members': ",".join(members)
        })
    groups = pd.DataFrame(groups_data)
    
    return users, groups

def generate_meaningful_interactions(users, destinations, density=0.05):
    """
    Generate meaningful ratings based on relationships.
    Users rate destinations highly if their preferred_budget roughly matches
    the base cost and if their preferred_type matches the dest type.
    """
    interactions = []
    num_users = len(users)
    num_dests = len(destinations)
    num_possible = num_users * num_dests
    num_actual = int(num_possible * density)
    
    # Generate random user-dest pairs to rate
    pairs = set()
    while len(pairs) < num_actual:
        u_idx = random.randint(0, num_users - 1)
        d_idx = random.randint(0, num_dests - 1)
        pairs.add((u_idx, d_idx))
        
    users_list = users.to_dict('records')
    dests_list = destinations.to_dict('records')
    
    for u_idx, d_idx in pairs:
        u = users_list[u_idx]
        d = dests_list[d_idx]
        
        # Base rating 3.0
        score = 3.0
        
        # Type match bonus
        if u['preferred_type'] == d['type']:
            score += 1.5
        else:
            score -= 0.5
            
        # Budget match penalty
        cost_diff = abs(u['preferred_budget'] - (d['base_cost'] * 2)) # Approx total cost
        if cost_diff > u['preferred_budget'] * 0.5:
            score -= 1.5
        elif cost_diff < u['preferred_budget'] * 0.2:
            score += 1.0
            
        # Add gaussian noise
        score += np.random.normal(0, 0.5)
        
        # Clip to 1-5
        rating = int(np.clip(round(score), 1, 5))
        
        interactions.append({
            'user_id': u['user_id'],
            'dest_id': d['dest_id'],
            'rating': rating
        })
        
    return pd.DataFrame(interactions)

if __name__ == "__main__":
    print("Generating Meaningful Relational Synthetic Dataset...")
    
    dests = generate_destinations(config['dataset']['num_destinations'])
    dest_ids = dests['dest_id'].tolist()
    
    hotels = generate_hotels(config['dataset']['num_hotels'], dest_ids)
    acts = generate_activities(config['dataset']['num_activities'], dest_ids)
    flights = generate_flights(config['dataset']['num_flights'], dest_ids)
    
    users, groups = generate_users_and_groups(config['dataset']['num_users'], config['dataset']['num_groups'])
    
    interactions = generate_meaningful_interactions(users, dests, density=0.03)
    
    # Save CSVs
    dests.to_csv(os.path.join(SYNTHETIC_DIR, 'destinations.csv'), index=False)
    hotels.to_csv(os.path.join(SYNTHETIC_DIR, 'hotels.csv'), index=False)
    acts.to_csv(os.path.join(SYNTHETIC_DIR, 'activities.csv'), index=False)
    flights.to_csv(os.path.join(SYNTHETIC_DIR, 'flights.csv'), index=False)
    users.to_csv(os.path.join(SYNTHETIC_DIR, 'users.csv'), index=False)
    groups.to_csv(os.path.join(SYNTHETIC_DIR, 'groups.csv'), index=False)
    interactions.to_csv(os.path.join(SYNTHETIC_DIR, 'interactions.csv'), index=False)
    
    print(f"Generated {len(interactions)} meaningful interactions for {len(users)} users. Dataset generated successfully in data/synthetic/")
