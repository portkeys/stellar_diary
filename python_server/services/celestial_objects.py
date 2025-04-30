from datetime import datetime
from typing import List, Dict, Optional, Any
from data.storage import storage
from data.models import CelestialObject, MonthlyGuide, TelescopeTip

def seed_database() -> None:
    """
    Seeds the database with initial celestial objects, monthly guides, and telescope tips
    """
    # Check if we've already seeded the database
    if storage.celestial_objects:
        return
    
    # Sample celestial objects
    celestial_objects = [
        {
            "name": "Leo Triplet",
            "type": "galaxy",
            "description": "A small group of galaxies about 35 million light-years away in the constellation Leo.",
            "coordinates": "RA: 11h 18m | Dec: +13° 03′",
            "month": "April",
            "bestViewingTime": "9 PM - 3 AM",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Leo_Triplet.jpg/600px-Leo_Triplet.jpg",
            "visibilityRating": "Good",
            "information": "Also known as the M66 Group, this trio includes the spiral galaxies M65, M66, and NGC 3628.",
            "constellation": "Leo",
            "magnitude": "9-10",
            "hemisphere": "Both",
            "recommendedEyepiece": "Low power"
        },
        {
            "name": "Jupiter",
            "type": "planet",
            "description": "The largest planet in our solar system, known for its Great Red Spot and numerous moons.",
            "coordinates": "Varies by date",
            "month": "August",
            "bestViewingTime": "10 PM - 4 AM",
            "imageUrl": "https://solarsystem.nasa.gov/system/stellar_items/image_files/6_jupiter.jpg",
            "visibilityRating": "Excellent",
            "information": "With a good telescope, you can observe Jupiter's cloud bands and its four largest moons: Io, Europa, Ganymede, and Callisto.",
            "constellation": "Varies by season",
            "magnitude": "-2.7",
            "hemisphere": "Both",
            "recommendedEyepiece": "Medium power (100-150x)"
        },
        {
            "name": "M13 (Great Globular Cluster)",
            "type": "star_cluster",
            "description": "One of the most prominent and best-known globular clusters in the northern sky.",
            "coordinates": "RA: 16h 41m | Dec: +36° 28′",
            "month": "June",
            "bestViewingTime": "11 PM - 2 AM",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Messier_13.jpg/600px-Messier_13.jpg",
            "visibilityRating": "Good",
            "information": "Contains about 300,000 stars and is approximately 22,000 light-years away from Earth.",
            "constellation": "Hercules",
            "magnitude": "5.8",
            "hemisphere": "Northern",
            "recommendedEyepiece": "Medium power"
        },
        {
            "name": "Orion Nebula (M42)",
            "type": "nebula",
            "description": "A diffuse nebula situated in the Milky Way, south of Orion's Belt.",
            "coordinates": "RA: 05h 35m | Dec: -05° 23′",
            "month": "January",
            "bestViewingTime": "8 PM - 12 AM",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg/600px-Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg",
            "visibilityRating": "Excellent",
            "information": "One of the brightest nebulae and visible to the naked eye under dark skies.",
            "constellation": "Orion",
            "magnitude": "4.0",
            "hemisphere": "Both",
            "recommendedEyepiece": "Low power"
        },
        {
            "name": "Saturn",
            "type": "planet",
            "description": "The sixth planet from the Sun, known for its prominent ring system.",
            "coordinates": "Varies by date",
            "month": "July",
            "bestViewingTime": "10 PM - 3 AM",
            "imageUrl": "https://solarsystem.nasa.gov/system/stellar_items/image_files/38_saturn_1600x900.jpg",
            "visibilityRating": "Excellent",
            "information": "Saturn's rings are visible with even a small telescope, making it one of the most rewarding objects for amateur astronomers.",
            "constellation": "Varies by season",
            "magnitude": "0.1",
            "hemisphere": "Both",
            "recommendedEyepiece": "Medium to high power (150-200x)"
        },
        {
            "name": "Andromeda Galaxy (M31)",
            "type": "galaxy",
            "description": "The nearest major galaxy to the Milky Way, visible to the naked eye on moonless nights.",
            "coordinates": "RA: 00h 42m | Dec: +41° 16′",
            "month": "October",
            "bestViewingTime": "9 PM - 2 AM",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Andromeda_Galaxy_%28with_h-alpha%29.jpg/600px-Andromeda_Galaxy_%28with_h-alpha%29.jpg",
            "visibilityRating": "Good",
            "information": "Located approximately 2.5 million light-years from Earth, it is the most distant object visible to the naked eye.",
            "constellation": "Andromeda",
            "magnitude": "3.4",
            "hemisphere": "Northern",
            "recommendedEyepiece": "Low power"
        },
        {
            "name": "Pleiades (M45)",
            "type": "star_cluster",
            "description": "An open star cluster containing middle-aged, hot B-type stars located in the constellation of Taurus.",
            "coordinates": "RA: 03h 47m | Dec: +24° 07′",
            "month": "November",
            "bestViewingTime": "8 PM - 1 AM",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/600px-Pleiades_large.jpg",
            "visibilityRating": "Excellent",
            "information": "Also known as the Seven Sisters, this cluster is among the nearest star clusters to Earth at just 444 light-years away.",
            "constellation": "Taurus",
            "magnitude": "1.6",
            "hemisphere": "Both",
            "recommendedEyepiece": "Low power or binoculars"
        },
        {
            "name": "Whirlpool Galaxy (M51)",
            "type": "galaxy",
            "description": "A grand-design spiral galaxy located in the constellation Canes Venatici.",
            "coordinates": "RA: 13h 29m | Dec: +47° 11′",
            "month": "April",
            "bestViewingTime": "10 PM - 2 AM",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Messier51_sRGB.jpg/600px-Messier51_sRGB.jpg",
            "visibilityRating": "Moderate",
            "information": "The galaxy and its companion, NGC 5195, are easily observed by amateur astronomers, and the two galaxies may be seen with binoculars.",
            "constellation": "Canes Venatici",
            "magnitude": "8.4",
            "hemisphere": "Northern",
            "recommendedEyepiece": "Medium power"
        },
        {
            "name": "Crab Nebula (M1)",
            "type": "nebula",
            "description": "A supernova remnant and pulsar wind nebula in the constellation of Taurus.",
            "coordinates": "RA: 05h 34m | Dec: +22° 01′",
            "month": "December",
            "bestViewingTime": "8 PM - 11 PM",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Crab_Nebula.jpg/600px-Crab_Nebula.jpg",
            "visibilityRating": "Moderate",
            "information": "Corresponds to a bright supernova recorded by Chinese astronomers in 1054 AD.",
            "constellation": "Taurus",
            "magnitude": "8.4",
            "hemisphere": "Both",
            "recommendedEyepiece": "Medium power"
        },
        {
            "name": "Albireo",
            "type": "double_star",
            "description": "A beautiful double star and the fifth-brightest in the constellation Cygnus.",
            "coordinates": "RA: 19h 30m | Dec: +27° 57′",
            "month": "July",
            "bestViewingTime": "10 PM - 1 AM",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Albireo_Lund_2020.jpg",
            "visibilityRating": "Good",
            "information": "Considered one of the most beautiful double stars, with a gold primary and blue-green secondary component.",
            "constellation": "Cygnus",
            "magnitude": "3.1",
            "hemisphere": "Northern",
            "recommendedEyepiece": "Medium to high power"
        }
    ]
    
    # Add the celestial objects to storage
    for obj_data in celestial_objects:
        storage.create_celestial_object(obj_data)
    
    print("Seeded celestial objects")
    
    # Monthly guides
    monthly_guides = [
        {
            "month": "April",
            "year": 2025,
            "headline": "Galaxy Season Peaks",
            "content": "April is an excellent time for observing galaxies as the night sky is focused away from the dense star clouds of the Milky Way, allowing us to peer into the deeper universe. The Leo Triplet and Whirlpool Galaxy are at their best this month.",
            "hemisphere": "Northern",
            "featuredObjects": [1, 8]  # IDs of Leo Triplet and Whirlpool Galaxy
        },
        {
            "month": "June",
            "year": 2025,
            "headline": "The Summer Sky Emerges",
            "content": "As summer begins, Hercules rises high in the night sky, bringing with it M13, one of the finest globular clusters visible from the northern hemisphere. Look for it in the 'keystone' of Hercules.",
            "hemisphere": "Northern",
            "featuredObjects": [3]  # ID of M13
        },
        {
            "month": "July",
            "year": 2025,
            "headline": "Planets and Double Stars",
            "content": "July brings excellent views of Saturn, which is approaching opposition, providing a perfect chance to observe its magnificent rings. Meanwhile, Albireo, a beautiful double star with contrasting colors, is high in the summer sky.",
            "hemisphere": "Northern",
            "featuredObjects": [5, 10]  # IDs of Saturn and Albireo
        },
        {
            "month": "October",
            "year": 2025,
            "headline": "Andromeda Nights",
            "content": "October offers dark autumn skies perfect for viewing the Andromeda Galaxy (M31), our closest major galactic neighbor. Under dark skies, it's visible to the naked eye as a misty patch in the constellation Andromeda.",
            "hemisphere": "Northern",
            "featuredObjects": [6]  # ID of Andromeda Galaxy
        },
        {
            "month": "December",
            "year": 2025,
            "headline": "Winter's Deep Sky Gems",
            "content": "The winter sky offers some of the most brilliant deep sky objects. The Crab Nebula (M1) is well-placed for evening observing, and the Pleiades (M45) is a stunning sight in binoculars or a small telescope.",
            "hemisphere": "Northern",
            "featuredObjects": [7, 9]  # IDs of Pleiades and Crab Nebula
        }
    ]
    
    # Add the monthly guides to storage
    for guide_data in monthly_guides:
        storage.create_monthly_guide(guide_data)
    
    print("Seeded monthly guides")
    
    # Telescope tips
    telescope_tips = [
        {
            "title": "Collimation Guide",
            "content": "Proper alignment of your telescope's optical elements (collimation) is essential for achieving sharp, high-contrast views. For Dobsonian owners, check your collimation before each observing session using a collimation cap or Cheshire eyepiece.",
            "category": "maintenance",
            "imageUrl": "https://images.unsplash.com/photo-1548639136-5ebdb06a6614?auto=format&fit=crop&w=300&h=200"
        },
        {
            "title": "Light Pollution Filters",
            "content": "Consider investing in a narrowband light pollution filter, which can significantly improve contrast on nebulae by blocking light pollution while allowing the light from emission nebulae to pass through.",
            "category": "equipment",
            "imageUrl": "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?auto=format&fit=crop&w=300&h=200"
        },
        {
            "title": "Dark Adaptation",
            "content": "Allow your eyes at least 20-30 minutes to fully adapt to darkness. Use a red flashlight for reading star charts or adjusting equipment, as red light preserves your night vision.",
            "category": "observing",
            "imageUrl": "https://images.unsplash.com/photo-1533162507191-d90c625b2640?auto=format&fit=crop&w=300&h=200"
        },
        {
            "title": "Magnification Tips",
            "content": "Remember that highest power isn't always best. For most objects, moderate magnification with good contrast will provide better views than pushing your telescope to its magnification limits.",
            "category": "observing",
            "imageUrl": "https://images.unsplash.com/photo-1566904312366-0b95e8228de1?auto=format&fit=crop&w=300&h=200"
        },
        {
            "title": "Dew Prevention",
            "content": "In humid conditions, dew can form quickly on your telescope's optical surfaces. A dew shield or battery-powered dew heater can prevent this issue and extend your observing time.",
            "category": "equipment",
            "imageUrl": "https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=300&h=200"
        }
    ]
    
    # Add the telescope tips to storage
    for tip_data in telescope_tips:
        storage.create_telescope_tip(tip_data)
    
    print("Seeded telescope tips")

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
    filtered_objects = objects
    
    if object_type:
        filtered_objects = [obj for obj in filtered_objects if obj.type == object_type]
    
    if month:
        filtered_objects = [obj for obj in filtered_objects if obj.month == month]
    
    if hemisphere:
        filtered_objects = [obj for obj in filtered_objects 
                           if obj.hemisphere == hemisphere or obj.hemisphere == 'Both']
    
    return [obj.to_dict() for obj in filtered_objects]