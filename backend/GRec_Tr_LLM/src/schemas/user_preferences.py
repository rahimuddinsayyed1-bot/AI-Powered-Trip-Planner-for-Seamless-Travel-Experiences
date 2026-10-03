from pydantic import BaseModel, Field
from typing import List, Optional

class HardConstraints(BaseModel):
    max_budget: Optional[float] = Field(None, description="Absolute maximum budget per person")
    max_travel_time_hours: Optional[float] = Field(None, description="Absolute maximum travel time in hours")
    required_activities: List[str] = Field(default_factory=list, description="Activities that MUST be present")

class SoftConstraints(BaseModel):
    target_budget: Optional[float] = Field(None, description="Preferred budget")
    preferred_destination_types: List[str] = Field(default_factory=list, description="E.g., beach, mountain, city")
    preferred_activities: List[str] = Field(default_factory=list, description="Activities they would like to do")
    min_hotel_rating: Optional[float] = Field(None, description="Preferred minimum hotel rating")

class UserPreferences(BaseModel):
    user_id: str = Field(..., description="ID of the user")
    raw_text: str = Field(..., description="Original text input from the user")
    hard_constraints: HardConstraints
    soft_constraints: SoftConstraints
    flexibility_score: float = Field(0.5, description="Inferred flexibility from 0.0 (rigid) to 1.0 (very flexible)", ge=0.0, le=1.0)

class GroupPreferences(BaseModel):
    group_id: str = Field(..., description="ID of the group")
    members: List[UserPreferences] = Field(..., description="Preferences of individual members")
