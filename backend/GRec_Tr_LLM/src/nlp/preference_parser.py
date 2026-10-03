import json
import os
import re
import yaml
from typing import Optional, Dict, Any
from src.schemas.user_preferences import UserPreferences, HardConstraints, SoftConstraints
from src.schemas.feature_schema import (
    USD_TO_INR, EUR_TO_INR, LONG_FLIGHT_HOURS_THRESHOLD, 
    LUXURY_HOTEL_RATING_THRESHOLD, BUDGET_HOTEL_RATING_THRESHOLD,
    DEST_TYPES, ACT_CATEGORIES
)
from dotenv import load_dotenv

load_dotenv()

class PreferenceParser:
    def __init__(self, api_key: Optional[str] = None, use_mock: bool = False):
        """
        Initialize the NLP preference parser using Google Gemini.
        use_mock=True enables offline testing/prototyping with regex.
        """
        self.use_mock = use_mock
        
        # Load config assumptions
        config_path = os.path.join(os.path.dirname(__file__), '../../config.yaml')
        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)
            
        if not self.use_mock:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key or os.getenv("GEMINI_API_KEY"))
                self.client = genai.GenerativeModel('gemini-1.5-flash-latest')
            except ImportError:
                raise ImportError("Google Generative AI package not installed. Run `pip install google-generativeai`.")

    def _extract_json_from_text(self, text: str) -> str:
        """Helper to safely extract JSON block if the LLM wraps it in markdown."""
        match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1)
        return text.strip()

    def parse_preferences(self, text: str, user_id: str) -> UserPreferences:
        """
        Parses natural language text into a structured UserPreferences object dynamically.
        """
        if self.use_mock:
            return self._mock_parse(text, user_id)

        schema_json = UserPreferences.model_json_schema()
        
        assumptions = self.config.get('nlp_parser', {}).get('assumptions', {})
        
        system_prompt = (
            "You are an AI assistant for a research-oriented group travel recommender system (GRec_Tr-LLM). "
            "Your strictly limited task is to extract a user's travel preferences from their natural language input "
            "and format them EXACTLY according to the provided JSON schema.\n\n"
            f"SCHEMA:\n{json.dumps(schema_json, indent=2)}\n\n"
            "CRITICAL INSTRUCTIONS:\n"
            "1. Return ONLY valid JSON matching the schema precisely.\n"
            f"2. CURRENCY: All budgets MUST be normalized to INR. If the user uses USD ($), multiply by {USD_TO_INR}. If EUR (€), multiply by {EUR_TO_INR}. "
            "Strip all currency symbols and commas. (e.g. '$1000' -> 83000.0, '₹1,50,000' -> 150000.0).\n"
            f"3. VAGUE TERMS: If the user says 'no long flights' or similar, use max_travel_time_hours = {LONG_FLIGHT_HOURS_THRESHOLD}. "
            f"If they say 'luxury hotel', set min_hotel_rating = {LUXURY_HOTEL_RATING_THRESHOLD}. "
            f"If they say 'budget hotel', set min_hotel_rating = {BUDGET_HOTEL_RATING_THRESHOLD}.\n"
            "4. HARD VS SOFT: If a user explicitly forbids something or states a strict limit (e.g., 'must not exceed', 'cannot be longer than'), "
            "map it to hard_constraints. If it is a preference (e.g., 'would prefer', 'I like'), map it to soft_constraints.\n"
            "5. If a constraint is not explicitly mentioned, set it to null."
        )

        try:
            prompt = f"{system_prompt}\n\nUSER INPUT: {text}"
            response = self.client.generate_content(prompt)
            raw_output = response.text
                
            cleaned_json = self._extract_json_from_text(raw_output)
            
            # Load JSON and inject parameters that are managed by the system
            parsed_dict = json.loads(cleaned_json)
            parsed_dict["user_id"] = user_id
            parsed_dict["raw_text"] = text
            
            # Validate with Pydantic for rigid correctness
            preferences = UserPreferences(**parsed_dict)
            return preferences
            
        except Exception as e:
            raise ValueError(f"Failed to parse or validate LLM output: {e}")

    def _mock_parse(self, text: str, user_id: str) -> UserPreferences:
        """
        A deterministic mock parser to allow the pipeline to run and be tested
        end-to-end without spending tokens.
        """
        text_lower = text.lower()
        
        # Better heuristics to simulate NLP extraction using Regex
        # Match both $ and ₹ currencies correctly parsing Indian numbering (e.g. ₹1,50,000)
        budget = None
        usd_match = re.search(r'\$\s*([\d,]+)', text)
        eur_match = re.search(r'€\s*([\d,]+)', text)
        inr_match = re.search(r'₹\s*([\d,]+)', text)
        
        if usd_match:
            budget = float(usd_match.group(1).replace(',', '')) * USD_TO_INR
        elif eur_match:
            budget = float(eur_match.group(1).replace(',', '')) * EUR_TO_INR
        elif inr_match:
            budget = float(inr_match.group(1).replace(',', ''))
            
        dest_types = []
        if "beach" in text_lower:
            dest_types.append("beach")
        if "mountain" in text_lower:
            dest_types.append("mountain")
        if "city" in text_lower or "sightseeing" in text_lower:
            dest_types.append("city")
            
        activities = []
        if "peaceful" in text_lower or "relaxing" in text_lower:
            activities.append("relaxation")
        if "water sports" in text_lower:
            activities.append("water sports")
        if "sightseeing" in text_lower or "tour" in text_lower:
            activities.append("sightseeing")
            
        travel_time = None
        time_match = re.search(r'(\d+)\s*(?:hours|hrs|h)', text_lower)
        if time_match:
            travel_time = float(time_match.group(1))
        elif "long flight" in text_lower or "no long flight" in text_lower:
            travel_time = LONG_FLIGHT_HOURS_THRESHOLD
        
        min_hotel = None
        if "luxury" in text_lower:
            min_hotel = LUXURY_HOTEL_RATING_THRESHOLD
        elif "budget hotel" in text_lower:
            min_hotel = BUDGET_HOTEL_RATING_THRESHOLD
        
        return UserPreferences(
            user_id=user_id,
            raw_text=text,
            hard_constraints=HardConstraints(
                max_budget=budget,
                max_travel_time_hours=travel_time,
                required_activities=[]
            ),
            soft_constraints=SoftConstraints(
                target_budget=budget * 0.8 if budget else None,
                preferred_destination_types=dest_types,
                preferred_activities=activities,
                min_hotel_rating=min_hotel
            ),
            flexibility_score=0.6
        )
