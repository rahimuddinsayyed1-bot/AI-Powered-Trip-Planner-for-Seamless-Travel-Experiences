from typing import List, Dict

# Single Source of Truth for Feature Encodings

# Destination Categories
DEST_TYPES = ['Beach', 'City', 'Historic', 'Mountain', 'Nature']

# Activity Categories
ACT_CATEGORIES = ['Sightseeing', 'Water Sports', 'Hiking', 'Food Tour', 'Museum', 'Relaxation']

# Currency Conversions (to base currency: INR)
USD_TO_INR = 83.0
EUR_TO_INR = 90.0

# NLP Thresholds and Rules
LONG_FLIGHT_HOURS_THRESHOLD = 6.0
LUXURY_HOTEL_RATING_THRESHOLD = 4.5
BUDGET_HOTEL_RATING_THRESHOLD = 3.0

# Normalization Constants (for neural network scaling [0,1])
# We divide absolute values by these maximums to get normalized features.
NORM_CONSTANTS = {
    'budget_max': 300000.0, # max budget in INR
    'travel_time_max': 48.0,
    'rating_max': 5.0,
    'cost_base_max': 100000.0, 
    'flight_cost_max': 100000.0,
    'hotel_price_per_night_max': 50000.0,
    'activity_price_max': 20000.0
}
