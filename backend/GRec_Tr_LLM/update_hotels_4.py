import pandas as pd
import random

# Load datasets
google_hotels_df = pd.read_csv(r'F:\travel website\google_hotel_data_clean_v2.csv')
dests_df = pd.read_csv(r'F:\travel website\backend\GRec_Tr_LLM\data\synthetic\destinations.csv')

# Preprocess google hotels to make city matching easier
google_hotels_df['City_lower'] = google_hotels_df['City'].str.lower().str.strip()

hotels_by_city = {}
for city, group in google_hotels_df.groupby('City_lower'):
    hotels_by_city[city] = group.to_dict('records')

all_real_hotels = google_hotels_df.to_dict('records')

hardcoded_fallback_hotels = {
    'delhi': [
        {'name': 'The Taj Mahal Hotel, New Delhi', 'price': 20000, 'rating': 4.8},
        {'name': 'The Leela Palace New Delhi', 'price': 25000, 'rating': 4.9},
        {'name': 'ITC Maurya, a Luxury Collection Hotel', 'price': 18000, 'rating': 4.7},
        {'name': 'The Oberoi, New Delhi', 'price': 28000, 'rating': 4.9}
    ],
    'mumbai': [
        {'name': 'The Taj Mahal Palace', 'price': 35000, 'rating': 4.9},
        {'name': 'The Oberoi Mumbai', 'price': 25000, 'rating': 4.8},
        {'name': 'Trident Nariman Point', 'price': 15000, 'rating': 4.6},
        {'name': 'ITC Maratha', 'price': 14000, 'rating': 4.5}
    ],
    'goa': [
        {'name': 'Taj Exotica Resort & Spa, Goa', 'price': 22000, 'rating': 4.8},
        {'name': 'The Leela Goa', 'price': 28000, 'rating': 4.7},
        {'name': 'W Goa', 'price': 18000, 'rating': 4.6},
        {'name': 'ITC Grand Goa Resort & Spa', 'price': 16000, 'rating': 4.7}
    ],
    'kerala': [
        {'name': 'Taj Malabar Resort & Spa, Cochin', 'price': 15000, 'rating': 4.7},
        {'name': 'Kumarakom Lake Resort', 'price': 20000, 'rating': 4.8},
        {'name': 'The Leela Ashtamudi, A Raviz Hotel', 'price': 18000, 'rating': 4.6},
        {'name': 'Grand Hyatt Kochi Bolgatty', 'price': 14000, 'rating': 4.8}
    ],
    'kolkata': [
        {'name': 'Taj Bengal, Kolkata', 'price': 12000, 'rating': 4.6},
        {'name': 'The Oberoi Grand, Kolkata', 'price': 16000, 'rating': 4.8},
        {'name': 'ITC Royal Bengal', 'price': 14000, 'rating': 4.7},
        {'name': 'JW Marriott Hotel Kolkata', 'price': 11000, 'rating': 4.6}
    ],
    'chennai': [
        {'name': 'Taj Coromandel', 'price': 12000, 'rating': 4.6},
        {'name': 'ITC Grand Chola', 'price': 15000, 'rating': 4.8},
        {'name': 'The Leela Palace Chennai', 'price': 18000, 'rating': 4.7},
        {'name': 'Park Hyatt Chennai', 'price': 11000, 'rating': 4.5}
    ],
    'hyderabad': [
        {'name': 'Taj Falaknuma Palace', 'price': 45000, 'rating': 4.9},
        {'name': 'ITC Kohenur', 'price': 16000, 'rating': 4.8},
        {'name': 'Park Hyatt Hyderabad', 'price': 12000, 'rating': 4.6},
        {'name': 'The Westin Hyderabad Mindspace', 'price': 14000, 'rating': 4.5}
    ],
    'bengaluru': [
        {'name': 'The Leela Palace Bengaluru', 'price': 20000, 'rating': 4.8},
        {'name': 'Taj West End', 'price': 18000, 'rating': 4.7},
        {'name': 'ITC Gardenia', 'price': 15000, 'rating': 4.6},
        {'name': 'The Ritz-Carlton, Bangalore', 'price': 17000, 'rating': 4.7}
    ],
    'pune': [
        {'name': 'Conrad Pune', 'price': 14000, 'rating': 4.7},
        {'name': 'JW Marriott Hotel Pune', 'price': 13000, 'rating': 4.6},
        {'name': 'The Ritz-Carlton, Pune', 'price': 16000, 'rating': 4.8},
        {'name': 'Taj Amer, Pune', 'price': 12000, 'rating': 4.5}
    ],
    'jaipur': [
        {'name': 'Rambagh Palace', 'price': 45000, 'rating': 4.9},
        {'name': 'The Oberoi Rajvilas', 'price': 35000, 'rating': 4.8},
        {'name': 'Taj Jai Mahal Palace', 'price': 25000, 'rating': 4.7},
        {'name': 'ITC Rajputana', 'price': 15000, 'rating': 4.6}
    ],
    'agra': [
        {'name': 'The Oberoi Amarvilas', 'price': 35000, 'rating': 4.9},
        {'name': 'ITC Mughal, A Luxury Collection Resort', 'price': 8500, 'rating': 4.6},
        {'name': 'Taj Hotel & Convention Centre', 'price': 6500, 'rating': 4.5},
        {'name': 'Courtyard by Marriott Agra', 'price': 4500, 'rating': 4.4}
    ],
    'udaipur': [
        {'name': 'Taj Lake Palace', 'price': 45000, 'rating': 4.9},
        {'name': 'The Leela Palace Udaipur', 'price': 38000, 'rating': 4.8},
        {'name': 'The Oberoi Udaivilas', 'price': 42000, 'rating': 4.9},
        {'name': 'Aurika, Udaipur', 'price': 12000, 'rating': 4.7}
    ],
    'rishikesh': [
        {'name': 'Taj Rishikesh Resort & Spa', 'price': 25000, 'rating': 4.7},
        {'name': 'Aloha On The Ganges', 'price': 8000, 'rating': 4.2},
        {'name': 'The Roseate Ganges', 'price': 22000, 'rating': 4.6},
        {'name': 'Lemon Tree Premier', 'price': 7000, 'rating': 4.4},
        {'name': 'Divine Resort & Spa', 'price': 6000, 'rating': 4.3}
    ],
    'manali': [
        {'name': 'The Himalayan', 'price': 12000, 'rating': 4.5},
        {'name': 'Span Resort and Spa', 'price': 15000, 'rating': 4.4},
        {'name': 'Baragarh Resort and Spa', 'price': 10000, 'rating': 4.6},
        {'name': 'Solang Valley Resort', 'price': 8500, 'rating': 4.3},
        {'name': 'Snow Valley Resorts', 'price': 5000, 'rating': 4.2}
    ],
    'shimla': [
        {'name': 'Wildflower Hall', 'price': 28000, 'rating': 4.8},
        {'name': 'The Oberoi Cecil', 'price': 15000, 'rating': 4.7},
        {'name': 'Radisson Hotel Shimla', 'price': 8000, 'rating': 4.2},
        {'name': 'Clarkes Hotel', 'price': 9000, 'rating': 4.5},
        {'name': 'Taj Theog Resort & Spa', 'price': 20000, 'rating': 4.6}
    ],
    'leh': [
        {'name': 'The Grand Dragon Ladakh', 'price': 15000, 'rating': 4.6},
        {'name': 'Gomang Boutique Hotel', 'price': 9000, 'rating': 4.5},
        {'name': 'Stok Palace Heritage Hotel', 'price': 12000, 'rating': 4.7},
        {'name': 'The Zen Resort', 'price': 8500, 'rating': 4.3},
        {'name': 'Laksdup Guest House', 'price': 4000, 'rating': 4.2}
    ],
    'darjeeling': [
        {'name': 'Mayfair Darjeeling', 'price': 11000, 'rating': 4.5},
        {'name': 'Windamere Hotel', 'price': 14000, 'rating': 4.4},
        {'name': 'Elgin, Darjeeling', 'price': 9500, 'rating': 4.3},
        {'name': 'Cedar Inn', 'price': 8000, 'rating': 4.2},
        {'name': 'Summit Swiss Heritage', 'price': 6000, 'rating': 4.1}
    ],
    'ooty': [
        {'name': 'Savoy - IHCL SeleQtions', 'price': 12000, 'rating': 4.5},
        {'name': 'Sterling Ooty Fern Hill', 'price': 6000, 'rating': 4.1},
        {'name': 'Gem Park Ooty', 'price': 5500, 'rating': 4.0},
        {'name': 'Sinclairs Retreat Ooty', 'price': 7000, 'rating': 4.2},
        {'name': 'Fortune Resort Sullivan Court', 'price': 8000, 'rating': 4.3}
    ],
    'coorg': [
        {'name': 'Taj Madikeri Resort & Spa', 'price': 18000, 'rating': 4.7},
        {'name': 'Evolve Back, Coorg', 'price': 25000, 'rating': 4.8},
        {'name': 'The Tamara Coorg', 'price': 20000, 'rating': 4.7},
        {'name': 'Club Mahindra Madikeri', 'price': 9000, 'rating': 4.4},
        {'name': 'Coorg Wilderness Resort', 'price': 16000, 'rating': 4.6}
    ]
}

new_hotels = []

# Generate exactly 4 hotels per destination
for idx, dest_row in dests_df.iterrows():
    dest = dest_row['dest_id']
    dest_lower = str(dest).lower().strip()
    
    mapping = {
        'bengaluru': 'bangalore',
        'mysuru': 'mysore',
        'kerala': 'kochi',
        'rajasthan': 'jaipur',
        'madhya_pradesh': 'indore'
    }
    search_dest = mapping.get(dest_lower, dest_lower)
    
    for i in range(4):
        h_id = f"{dest}_H{i}"
        
        # Pick hotel - PRIORITIZE hardcoded famous hotels FIRST
        if dest_lower in hardcoded_fallback_hotels and len(hardcoded_fallback_hotels[dest_lower]) > 0:
            chosen = random.choice(hardcoded_fallback_hotels[dest_lower])
            hardcoded_fallback_hotels[dest_lower].remove(chosen)
            name = chosen['name']
            rating = chosen['rating']
            price = chosen['price']
        elif search_dest in hotels_by_city and len(hotels_by_city[search_dest]) > 0:
            chosen = random.choice(hotels_by_city[search_dest])
            hotels_by_city[search_dest].remove(chosen)
            name = chosen['Hotel_Name']
            rating = chosen['Hotel_Rating']
            price = chosen['Hotel_Price']
        else:
            chosen = random.choice(all_real_hotels)
            prefix = dest.replace('_', ' ').title()
            name = f"{prefix} Grand {chosen['Hotel_Name'].split()[0]}"
            rating = chosen['Hotel_Rating']
            price = chosen['Hotel_Price']
            
        if pd.isna(price) or price <= 0:
            price = random.randint(3000, 15000)
            
        new_hotels.append({
            'hotel_id': h_id,
            'dest_id': dest,
            'name': name,
            'price_per_night': float(price),
            'rating': float(rating)
        })

new_hotels_df = pd.DataFrame(new_hotels)
new_hotels_df.to_csv(r'F:\travel website\backend\GRec_Tr_LLM\data\synthetic\hotels.csv', index=False)
print(f"Created {len(new_hotels_df)} hotels (4 per destination).")
