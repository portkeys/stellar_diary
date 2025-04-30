from datetime import datetime
from typing import List, Dict, Optional, Union, Any
from .models import User, CelestialObject, Observation, MonthlyGuide, TelescopeTip

class MemStorage:
    def __init__(self):
        self.users = {}
        self.celestial_objects = {}
        self.observations = {}
        self.monthly_guides = {}
        self.telescope_tips = {}
        
        # Counters for IDs
        self.user_current_id = 0
        self.object_current_id = 0
        self.observation_current_id = 0
        self.guide_current_id = 0
        self.tip_current_id = 0
    
    # User operations
    def get_user(self, id: int) -> Optional[User]:
        return self.users.get(id)
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        for user in self.users.values():
            if user.username == username:
                return user
        return None
    
    def create_user(self, user_data: Dict[str, Any]) -> User:
        self.user_current_id += 1
        id = self.user_current_id
        
        user = User(
            id=id,
            username=user_data.get('username'),
            email=user_data.get('email'),
            password_hash=user_data.get('passwordHash')
        )
        
        self.users[id] = user
        return user
    
    # Celestial object operations
    def get_celestial_object(self, id: int) -> Optional[CelestialObject]:
        return self.celestial_objects.get(id)
    
    def get_all_celestial_objects(self) -> List[CelestialObject]:
        return list(self.celestial_objects.values())
    
    def get_celestial_objects_by_type(self, type: str) -> List[CelestialObject]:
        return [obj for obj in self.celestial_objects.values() if obj.type == type]
    
    def get_celestial_objects_by_month(self, month: str) -> List[CelestialObject]:
        return [obj for obj in self.celestial_objects.values() if obj.month == month]
    
    def get_celestial_objects_by_hemisphere(self, hemisphere: str) -> List[CelestialObject]:
        return [obj for obj in self.celestial_objects.values() if obj.hemisphere == hemisphere]
    
    def create_celestial_object(self, object_data: Dict[str, Any]) -> CelestialObject:
        self.object_current_id += 1
        id = self.object_current_id
        
        # Convert camelCase keys to snake_case for our Python model
        celestial_object = CelestialObject(
            id=id,
            name=object_data.get('name'),
            type=object_data.get('type'),
            description=object_data.get('description'),
            coordinates=object_data.get('coordinates'),
            month=object_data.get('month'),
            best_viewing_time=object_data.get('bestViewingTime'),
            image_url=object_data.get('imageUrl'),
            visibility_rating=object_data.get('visibilityRating'),
            information=object_data.get('information'),
            constellation=object_data.get('constellation'),
            magnitude=object_data.get('magnitude'),
            hemisphere=object_data.get('hemisphere'),
            recommended_eyepiece=object_data.get('recommendedEyepiece')
        )
        
        self.celestial_objects[id] = celestial_object
        return celestial_object
    
    # Observation operations
    def get_observation(self, id: int) -> Optional[Observation]:
        return self.observations.get(id)
    
    def get_user_observations(self, user_id: int) -> List[Observation]:
        return [obs for obs in self.observations.values() if obs.user_id == user_id]
    
    def create_observation(self, observation_data: Dict[str, Any]) -> Observation:
        self.observation_current_id += 1
        id = self.observation_current_id
        date_added = datetime.now()
        
        observation = Observation(
            id=id,
            user_id=observation_data.get('userId'),
            object_id=observation_data.get('objectId'),
            date_added=date_added,
            is_observed=observation_data.get('isObserved', False),
            observation_notes=observation_data.get('observationNotes'),
            planned_date=observation_data.get('plannedDate')
        )
        
        self.observations[id] = observation
        return observation
    
    def update_observation(self, id: int, update_data: Dict[str, Any]) -> Optional[Observation]:
        observation = self.observations.get(id)
        if not observation:
            return None
        
        # Update the fields
        if 'isObserved' in update_data:
            observation.is_observed = update_data['isObserved']
        
        if 'observationNotes' in update_data:
            observation.observation_notes = update_data['observationNotes']
        
        if 'plannedDate' in update_data:
            observation.planned_date = update_data['plannedDate']
        
        return observation
    
    def delete_observation(self, id: int) -> bool:
        if id in self.observations:
            del self.observations[id]
            return True
        return False
    
    # Monthly guide operations
    def get_monthly_guide(self, id: int) -> Optional[MonthlyGuide]:
        return self.monthly_guides.get(id)
    
    def get_current_monthly_guide(self, hemisphere: str) -> Optional[MonthlyGuide]:
        current_month = datetime.now().strftime('%B')
        current_year = datetime.now().year
        
        for guide in self.monthly_guides.values():
            if (guide.month == current_month and 
                guide.year == current_year and 
                (guide.hemisphere == hemisphere or guide.hemisphere == 'both')):
                return guide
        
        return None
    
    def get_all_monthly_guides(self) -> List[MonthlyGuide]:
        return list(self.monthly_guides.values())
    
    def create_monthly_guide(self, guide_data: Dict[str, Any]) -> MonthlyGuide:
        self.guide_current_id += 1
        id = self.guide_current_id
        
        guide = MonthlyGuide(
            id=id,
            month=guide_data.get('month'),
            year=guide_data.get('year'),
            headline=guide_data.get('headline'),
            content=guide_data.get('content'),
            hemisphere=guide_data.get('hemisphere'),
            featured_objects=guide_data.get('featuredObjects', [])
        )
        
        self.monthly_guides[id] = guide
        return guide
    
    # Telescope tip operations
    def get_telescope_tip(self, id: int) -> Optional[TelescopeTip]:
        return self.telescope_tips.get(id)
    
    def get_all_telescope_tips(self) -> List[TelescopeTip]:
        return list(self.telescope_tips.values())
    
    def get_telescope_tips_by_category(self, category: str) -> List[TelescopeTip]:
        return [tip for tip in self.telescope_tips.values() if tip.category == category]
    
    def create_telescope_tip(self, tip_data: Dict[str, Any]) -> TelescopeTip:
        self.tip_current_id += 1
        id = self.tip_current_id
        
        tip = TelescopeTip(
            id=id,
            title=tip_data.get('title'),
            content=tip_data.get('content'),
            category=tip_data.get('category'),
            image_url=tip_data.get('imageUrl')
        )
        
        self.telescope_tips[id] = tip
        return tip

# Create a singleton instance
storage = MemStorage()