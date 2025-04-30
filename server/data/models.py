from datetime import datetime
from typing import List, Dict, Optional, Union, Any

# Define celestial object types
celestial_object_types = ["planet", "galaxy", "nebula", "star_cluster", "double_star", "moon", "other"]

# Define ApodResponse type for NASA API
class ApodResponse(Dict[str, Any]):
    """
    Astronomy Picture of the Day response model
    
    Fields:
        date: Date of the APOD photo
        explanation: Description of the photo
        hdurl: High definition URL of the photo (optional)
        media_type: Type of media (image or video)
        service_version: API service version
        title: Title of the image
        url: URL of the photo
        copyright: Copyright information (optional)
    """
    pass

class User:
    def __init__(self, id: int, username: str, email: str, password_hash: str):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email
        }

class CelestialObject:
    def __init__(
        self,
        id: int,
        name: str,
        type: str,
        description: str,
        coordinates: str,
        month: Optional[str] = None,
        best_viewing_time: Optional[str] = None,
        image_url: Optional[str] = None,
        visibility_rating: Optional[str] = None,
        information: Optional[str] = None,
        constellation: Optional[str] = None,
        magnitude: Optional[str] = None,
        hemisphere: Optional[str] = None,
        recommended_eyepiece: Optional[str] = None
    ):
        self.id = id
        self.name = name
        self.type = type
        self.description = description
        self.coordinates = coordinates
        self.month = month
        self.best_viewing_time = best_viewing_time
        self.image_url = image_url
        self.visibility_rating = visibility_rating
        self.information = information
        self.constellation = constellation
        self.magnitude = magnitude
        self.hemisphere = hemisphere
        self.recommended_eyepiece = recommended_eyepiece
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "description": self.description,
            "coordinates": self.coordinates,
            "month": self.month,
            "bestViewingTime": self.best_viewing_time,
            "imageUrl": self.image_url,
            "visibilityRating": self.visibility_rating,
            "information": self.information,
            "constellation": self.constellation,
            "magnitude": self.magnitude,
            "hemisphere": self.hemisphere,
            "recommendedEyepiece": self.recommended_eyepiece
        }

class Observation:
    def __init__(
        self,
        id: int,
        user_id: int,
        object_id: int,
        date_added: datetime,
        is_observed: bool = False,
        observation_notes: Optional[str] = None,
        planned_date: Optional[str] = None
    ):
        self.id = id
        self.user_id = user_id
        self.object_id = object_id
        self.date_added = date_added
        self.is_observed = is_observed
        self.observation_notes = observation_notes
        self.planned_date = planned_date
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "userId": self.user_id,
            "objectId": self.object_id,
            "dateAdded": self.date_added.isoformat(),
            "isObserved": self.is_observed,
            "observationNotes": self.observation_notes,
            "plannedDate": self.planned_date
        }

class MonthlyGuide:
    def __init__(
        self,
        id: int,
        month: str,
        year: int,
        headline: str,
        content: str,
        hemisphere: str,
        featured_objects: List[int]
    ):
        self.id = id
        self.month = month
        self.year = year
        self.headline = headline
        self.content = content
        self.hemisphere = hemisphere
        self.featured_objects = featured_objects
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "month": self.month,
            "year": self.year,
            "headline": self.headline,
            "content": self.content,
            "hemisphere": self.hemisphere,
            "featuredObjects": self.featured_objects
        }

class TelescopeTip:
    def __init__(
        self,
        id: int,
        title: str,
        content: str,
        category: str,
        image_url: Optional[str] = None
    ):
        self.id = id
        self.title = title
        self.content = content
        self.category = category
        self.image_url = image_url
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "imageUrl": self.image_url
        }