from datetime import datetime
from typing import List, Dict, Any, Optional
from python_server.data.storage import storage

def seed_database() -> None:
    """
    Seeds the database with initial celestial objects, monthly guides, and telescope tips
    """
    # Create sample celestial objects if none exist
    if not storage.get_all_celestial_objects():
        # Planets
        storage.create_celestial_object({
            'name': 'Jupiter',
            'type': 'planet',
            'description': 'The largest planet in our solar system with visible bands and four bright moons.',
            'coordinates': 'Varies monthly',
            'month': 'April',
            'bestViewingTime': 'Evening',
            'imageUrl': 'https://science.nasa.gov/wp-content/uploads/2023/09/PIA21974.jpeg?w=1536&format=webp',
            'visibilityRating': 'Excellent',
            'information': 'Jupiter is easily visible with the naked eye and spectacular through a telescope. Look for the four Galilean moons and the Great Red Spot.',
            'constellation': 'Varies',
            'magnitude': '-2.5',
            'hemisphere': 'both',
            'recommendedEyepiece': '20mm - 10mm'
        })
        
        storage.create_celestial_object({
            'name': 'Saturn',
            'type': 'planet',
            'description': 'The ringed planet, a spectacular sight through any telescope.',
            'coordinates': 'Varies monthly',
            'month': 'April',
            'bestViewingTime': 'Late Evening',
            'imageUrl': 'https://science.nasa.gov/wp-content/uploads/2023/04/PIA26493-1-1.jpg?w=4096&format=webp',
            'visibilityRating': 'Excellent',
            'information': 'Saturn\'s rings are visible with even a small telescope. The best views come with higher magnification.',
            'constellation': 'Varies',
            'magnitude': '0.5',
            'hemisphere': 'both',
            'recommendedEyepiece': '10mm - 6mm'
        })
        
        # Galaxies
        storage.create_celestial_object({
            'name': 'Andromeda Galaxy (M31)',
            'type': 'galaxy',
            'description': 'The nearest major galaxy to our Milky Way.',
            'coordinates': 'RA 00h 42m 44s, Dec +41° 16\' 08\"',
            'month': 'October',
            'bestViewingTime': 'Evening in Fall/Winter',
            'imageUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Andromeda_Galaxy_%28with_h-alpha%29.jpg/1280px-Andromeda_Galaxy_%28with_h-alpha%29.jpg',
            'visibilityRating': 'Good',
            'information': 'The Andromeda Galaxy is visible to the naked eye under dark skies and appears as a fuzzy patch. With a telescope, you can observe its shape and structure.',
            'constellation': 'Andromeda',
            'magnitude': '3.4',
            'hemisphere': 'Northern',
            'recommendedEyepiece': '25mm - 20mm'
        })
        
        # Nebulae
        storage.create_celestial_object({
            'name': 'Orion Nebula (M42)',
            'type': 'nebula',
            'description': 'A bright, young star-forming region visible to the naked eye.',
            'coordinates': 'RA 05h 35m 17s, Dec -05° 23\' 28"',
            'month': 'January',
            'bestViewingTime': 'Winter Evenings',
            'imageUrl': 'https://esahubble.org/media/archives/images/large/heic0601a.jpg',
            'visibilityRating': 'Excellent',
            'information': 'One of the brightest nebulae in the sky, located in Orion\'s Sword. Even small telescopes reveal its glowing gas and dust.',
            'constellation': 'Orion',
            'magnitude': '4.0',
            'hemisphere': 'both',
            'recommendedEyepiece': '25mm - 15mm'
        })
        
        # Star Clusters
        storage.create_celestial_object({
            'name': 'Pleiades (M45)',
            'type': 'star_cluster',
            'description': 'Also known as the Seven Sisters, a bright open star cluster.',
            'coordinates': 'RA 03h 47m 24s, Dec +24° 07\' 00"',
            'month': 'November',
            'bestViewingTime': 'Fall and Winter Evenings',
            'imageUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/1280px-Pleiades_large.jpg',
            'visibilityRating': 'Excellent',
            'information': 'Visible to the naked eye, this cluster contains hot blue stars surrounded by reflective nebulosity. Best viewed with low magnification.',
            'constellation': 'Taurus',
            'magnitude': '1.6',
            'hemisphere': 'both',
            'recommendedEyepiece': '32mm - 25mm'
        })
        
    # Create sample monthly guides if none exist
    if not storage.get_all_monthly_guides():
        storage.create_monthly_guide({
            'month': 'April',
            'year': 2025,
            'headline': 'April 2025 Viewing Guide - Northern Hemisphere',
            'content': 'April offers excellent views of the spring galaxies in Leo, Virgo, and Coma Berenices. The Lyrid meteor shower peaks around April 22nd. Jupiter and Saturn are visible in the evening sky.',
            'hemisphere': 'Northern',
            'featuredObjects': [1, 2]  # IDs of featured celestial objects
        })
        
        storage.create_monthly_guide({
            'month': 'April',
            'year': 2025,
            'headline': 'April 2025 Viewing Guide - Southern Hemisphere',
            'content': 'In April, the southern hemisphere offers excellent views of the Carina Nebula and the Southern Cross. The Large and Small Magellanic Clouds are also easily visible. Jupiter and Saturn are visible in the evening sky.',
            'hemisphere': 'Southern',
            'featuredObjects': [1, 2]  # IDs of featured celestial objects
        })
    
    # Create sample telescope tips if none exist
    if not storage.get_all_telescope_tips():
        storage.create_telescope_tip({
            'title': 'Collimating Your Dobsonian',
            'content': 'Proper collimation is essential for getting the best views through your Dobsonian telescope. Use a collimation cap or laser collimator to align your mirrors. Check collimation at the beginning of each observing session for best results.',
            'category': 'maintenance',
            'imageUrl': 'https://images.unsplash.com/photo-1619451683204-6d4834e28fb8?auto=format&fit=crop&w=800&h=500'
        })
        
        storage.create_telescope_tip({
            'title': 'Using Eyepieces Effectively',
            'content': 'Start with a low-power eyepiece (25mm or higher) to locate objects, then switch to higher magnification to see details. Remember that the smaller the mm number, the higher the magnification. For most 8-inch Dobsonians, avoid going beyond 200x magnification as image quality will degrade.',
            'category': 'observing',
            'imageUrl': 'https://images.unsplash.com/photo-1463693396521-8f2734431f99?auto=format&fit=crop&w=800&h=500'
        })
        
        storage.create_telescope_tip({
            'title': 'Dark Adaptation',
            'content': 'Allow your eyes at least 20-30 minutes to fully adapt to darkness. Use a red flashlight to preserve your night vision. Avoid looking at phone screens or white lights during your observing session.',
            'category': 'observing',
            'imageUrl': 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=800&h=500'
        })

def get_current_month() -> str:
    """
    Gets the current month's name
    """
    return datetime.now().strftime('%B')

def get_current_year() -> int:
    """
    Gets the current year
    """
    return datetime.now().year

def filter_celestial_objects(object_type: Optional[str] = None, month: Optional[str] = None, hemisphere: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Filters celestial objects by multiple criteria
    """
    objects = storage.get_all_celestial_objects()
    
    # Apply filters
    if object_type:
        objects = [obj for obj in objects if obj.type == object_type]
    
    if month:
        objects = [obj for obj in objects if obj.month == month or obj.month is None]
    
    if hemisphere:
        objects = [obj for obj in objects if obj.hemisphere == hemisphere or obj.hemisphere == 'both' or obj.hemisphere is None]
    
    return [obj.to_dict() for obj in objects]