import pandas as pd
import numpy as np
import os
import random
import yaml
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src.schemas.feature_schema import USD_TO_INR, DEST_TYPES, ACT_CATEGORIES

def process_dataset(excel_path: str, output_dir: str):
    """
    Parses the wide-format India dataset and converts it to the relational CSV schema
    expected by the HGAT and MCDM pipelines.
    """
    os.makedirs(output_dir, exist_ok=True)
    print(f"Loading {excel_path}...")
    df = pd.read_excel(excel_path, sheet_name='India Dataset')
    
    # 1. USERS
    print("Processing users...")
    # Need columns: user_id, age, gender, budget, flex, plus detailed budgets
    users_df = df[['Traveler_ID', 'Age_Group', 'Gender', 'Max_Hotel_Budget_USD_Per_Night', 
                   'Hotel_Indifference_USD', 'Preferred_Destination', 'Accommodation_Type',
                   'Activity_Budget_USD_Per_Day', 'Attraction_Preference']].copy()
    users_df.rename(columns={
        'Traveler_ID': 'user_id',
        'Age_Group': 'age',
        'Gender': 'gender',
        'Hotel_Indifference_USD': 'flex',
        'Preferred_Destination': 'preferred_type',
        'Accommodation_Type': 'preferred_accommodation',
        'Attraction_Preference': 'preferred_activities'
    }, inplace=True)
    
    # Calculate budgets in INR
    users_df['max_hotel_per_night'] = users_df['Max_Hotel_Budget_USD_Per_Night'] * USD_TO_INR
    users_df['max_activity_per_day'] = users_df['Activity_Budget_USD_Per_Day'] * USD_TO_INR
    # Assuming 3-day trip and a 5000 INR static flight allowance per day (15000 total) for total budget estimation
    users_df['budget'] = (users_df['max_hotel_per_night'] * 3) + (users_df['max_activity_per_day'] * 3) + 15000.0
    # Ensure IDs are strings and prefixed properly
    users_df['user_id'] = users_df['user_id'].astype(str)
    
    # Optional: Fill missing values for budget and flex
    users_df['budget'] = users_df['budget'].fillna(users_df['budget'].mean())
    users_df['flex'] = users_df['flex'].fillna(20.0) # default flex
    # Ensure preferred_type matches DEST_TYPES
    # In Excel, Preferred_Destination might be city names. Let's just map it using the same heuristic or a random type if not found.
    
    users_df.to_csv(os.path.join(output_dir, 'users.csv'), index=False)
    
    # 2. GROUPS
    print("Processing groups...")
    # Group_ID and Traveler_ID. Need group_id and members (comma separated)
    groups = df.groupby('Group_ID')['Traveler_ID'].apply(lambda x: ','.join(x.astype(str))).reset_index()
    groups.rename(columns={'Group_ID': 'group_id', 'Traveler_ID': 'members'}, inplace=True)
    groups.to_csv(os.path.join(output_dir, 'groups.csv'), index=False)
    
    # 3. DESTINATIONS
    print("Processing destinations...")
    rating_cols = [c for c in df.columns if c.startswith('Rating_')]
    dest_names = [c.replace('Rating_', '') for c in rating_cols]
    
    # Create a heuristic for destination types
    def get_dest_type(name):
        name_lower = str(name).lower()
        if any(x in name_lower for x in ['goa', 'andaman', 'lakshadweep', 'pondicherry', 'gokarna', 'puri', 'visakhapatnam']):
            return 'Beach'
        elif any(x in name_lower for x in ['manali', 'shimla', 'leh', 'srinagar', 'darjeeling', 'sikkim', 'ooty', 'munnar', 'wayanad', 'kodaikanal']):
            return 'Mountain'
        elif any(x in name_lower for x in ['ranthambore', 'corbett', 'kaziranga', 'kutch', 'meghalaya']):
            return 'Nature'
        elif any(x in name_lower for x in ['agra', 'hampi', 'ajanta', 'khajuraho', 'bodh', 'jaipur', 'udaipur', 'jodhpur', 'jaisalmer', 'mysuru']):
            return 'Historic'
        else:
            return 'City'
            
    def map_activities(pref):
        pref_str = str(pref).lower()
        res = []
        if 'nature' in pref_str or 'wildlife' in pref_str: res.append('Hiking')
        if 'history' in pref_str or 'culture' in pref_str: res.append('Museum')
        if 'adventure' in pref_str or 'water' in pref_str: res.append('Water Sports')
        if 'food' in pref_str: res.append('Food Tour')
        if not res: res.append('Sightseeing')
        return ','.join(res)

    # Map preferred type for users
    users_df['preferred_type'] = users_df['preferred_type'].apply(get_dest_type)
    users_df['preferred_activities'] = users_df['preferred_activities'].apply(map_activities)
    users_df.to_csv(os.path.join(output_dir, 'users.csv'), index=False)
    
    # 2. GROUPS

    dests_df = pd.DataFrame({'dest_id': dest_names, 'name': dest_names})
    dests_df['type'] = dests_df['name'].apply(get_dest_type)
    # Assign a realistic base cost for Indian destinations (in INR)
    np.random.seed(42)
    dests_df['base_cost'] = np.random.uniform(2000, 10000, size=len(dests_df)).round(2)
    dests_df.to_csv(os.path.join(output_dir, 'destinations.csv'), index=False)
    
    # 4. INTERACTIONS (Ratings)
    print("Processing interactions...")
    # Melt the dataframe
    melted = df.melt(id_vars=['Traveler_ID'], value_vars=rating_cols, var_name='dest', value_name='rating')
    melted['dest_id'] = melted['dest'].str.replace('Rating_', '')
    melted.rename(columns={'Traveler_ID': 'user_id'}, inplace=True)
    melted = melted[['user_id', 'dest_id', 'rating']]
    # Filter out missing ratings
    melted = melted.dropna(subset=['rating'])
    melted['user_id'] = melted['user_id'].astype(str)
    melted.to_csv(os.path.join(output_dir, 'interactions.csv'), index=False)
    
    # 5. HOTELS, FLIGHTS, ACTIVITIES (Auto-generation)
    print("Generating hotels, flights, and activities...")
    hotels = []
    flights = []
    activities = []
    
    for _, dest in dests_df.iterrows():
        did = dest['dest_id']
        base_cost = dest['base_cost']
        
        # 3 Hotels per destination
        for i in range(3):
            # Budget, Mid-range, Luxury
            multiplier = 0.5 if i == 0 else (1.0 if i == 1 else 2.5)
            h_cost = round(base_cost * multiplier * random.uniform(0.8, 1.2), 2)
            h_rating = round(random.uniform(3.0 + i*0.5, 4.0 + i*0.5), 1)
            h_rating = min(5.0, h_rating)
            hotels.append({
                'hotel_id': f"{did}_H{i}",
                'dest_id': did,
                'name': f"{did} Hotel {i}",
                'price_per_night': h_cost,
                'rating': h_rating
            })
            
        # 2 Flights per destination
        for i in range(2):
            f_cost = round(random.uniform(2000, 15000), 2)
            f_dur = round(random.uniform(1.0, 5.0), 1)
            flights.append({
                'flight_id': f"{did}_F{i}",
                'dest_id': did,
                'airline': f"Airline_{i}",
                'price': f_cost,
                'duration_hours': f_dur
            })
            
        # 4 Activities per destination
        for i in range(4):
            a_cost = round(random.uniform(500, 5000), 2)
            a_dur = round(random.uniform(1.0, 4.0), 1)
            a_cat = random.choice(ACT_CATEGORIES)
            activities.append({
                'activity_id': f"{did}_A{i}",
                'dest_id': did,
                'name': f"{did} Activity {i}",
                'price': a_cost,
                'duration_hours': a_dur,
                'category': a_cat
            })
            
    pd.DataFrame(hotels).to_csv(os.path.join(output_dir, 'hotels.csv'), index=False)
    pd.DataFrame(flights).to_csv(os.path.join(output_dir, 'flights.csv'), index=False)
    pd.DataFrame(activities).to_csv(os.path.join(output_dir, 'activities.csv'), index=False)
    
    print("Done! All CSVs generated in:", output_dir)
    
    # Generate a schema summary to inform config changes
    types = dests_df['type'].unique().tolist()
    print("Discovered destination types:", types)

if __name__ == "__main__":
    DATA_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data'))
    excel_path = os.path.join(DATA_ROOT, 'india_group_travel_recommender_dataset_updated.xlsx')
    output_dir = os.path.join(DATA_ROOT, 'synthetic')
    process_dataset(excel_path, output_dir)
