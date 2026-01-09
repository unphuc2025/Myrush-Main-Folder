from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, database
import uuid

router = APIRouter(
    prefix="/venues",
    tags=["venues"]
)

@router.get("/game-types")
def get_game_types(db: Session = Depends(database.get_db)):
    try:
        from sqlalchemy import text
        query = text("SELECT name FROM admin_game_types WHERE is_active = true ORDER BY name ASC")
        result = db.execute(query).fetchall()
        game_types = [row[0] for row in result]
        return game_types
    except Exception as e:
        print(f"Error fetching game types: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/branches")
def get_branches(city: Optional[str] = None, db: Session = Depends(database.get_db)):
    try:
        from sqlalchemy import text
        query_sql = """
            SELECT ab.id, ab.name, ab.address_line1, acity.name as city_name
            FROM admin_branches ab
            JOIN admin_cities acity ON ab.city_id = acity.id
            WHERE ab.is_active = true
        """
        params = {}
        if city:
            query_sql += " AND LOWER(acity.name) = LOWER(:city)"
            params['city'] = city.strip()
            
        result = db.execute(text(query_sql), params).fetchall()
        branches = []
        for row in result:
            row_dict = dict(row._mapping)
            branches.append({
                "id": str(row_dict['id']),
                "name": row_dict['name'],
                "location": row_dict['address_line1'],
                "city": row_dict['city_name']
            })
        return branches
    except Exception as e:
        print(f"Error fetching branches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def get_venues(
    city: Optional[str] = None,
    game_type: Optional[str] = None,
    location: Optional[str] = None,
    branch_id: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    try:
        # Query from admin_courts with joins to get city and game type info
        from sqlalchemy import text
        
        query_sql = """
            SELECT 
                ac.id,
                ac.name as court_name,
                ac.price_per_hour as prices,
                ac.images as photos,
                ac.videos,
                ac.created_at,
                ac.updated_at,
                ab.name as branch_name,
                ab.address_line1 as location,
                ab.search_location as description,
                acity.name as city_name,
                agt.name as game_type
            FROM admin_courts ac
            JOIN admin_branches ab ON ac.branch_id = ab.id
            JOIN admin_cities acity ON ab.city_id = acity.id
            JOIN admin_game_types agt ON ac.game_type_id = agt.id
            WHERE ac.is_active = true
        """
        
        params = {}
        
        # Filter by city OR location (they're the same in your case)
        if city or location:
            city_filter = city or location
            city_filter = city_filter.strip()  # Remove trailing spaces
            query_sql += " AND LOWER(acity.name) = LOWER(:city)"
            params['city'] = city_filter
        
        # Filter by branch_id if provided
        if branch_id:
            query_sql += " AND ab.id = :branch_id"
            params['branch_id'] = branch_id
        
        # Filter by game type if provided (handle array of game types)
        if game_type and game_type != "undefined":
            if isinstance(game_type, list):
                # Handle array of game types
                placeholders = ','.join([f":game_type_{i}" for i in range(len(game_type))])
                query_sql += f" AND agt.name IN ({placeholders})"
                for i, gt in enumerate(game_type):
                    params[f'game_type_{i}'] = gt.strip()
            else:
                query_sql += " AND agt.name ILIKE :game_type"
                params['game_type'] = f"%{game_type}%"
        
        print(f"[VENUES API] Query: {query_sql}")
        print(f"[VENUES API] Params: {params}")
        
        result_proxy = db.execute(text(query_sql), params)
        courts = result_proxy.fetchall()
        
        print(f"[VENUES API] Found {len(courts)} courts")
        
        # Helper function to parse images from various formats
        def parse_images(images_value):
            """Parse images from text/array formats into list of URLs"""
            if not images_value:
                return []
            
            # If already a list/array from PostgreSQL
            if isinstance(images_value, list):
                return [str(img).strip() for img in images_value if img]
            
            # If string, try parsing different formats
            if isinstance(images_value, str):
                images_value = images_value.strip()
                if not images_value:
                    return []
                
                # Try JSON array parse (e.g., '["url1", "url2"]')
                if images_value.startswith('[') and images_value.endswith(']'):
                    try:
                        import json
                        parsed = json.loads(images_value)
                        if isinstance(parsed, list):
                            return [str(img).strip() for img in parsed if img]
                    except:
                        pass
                
                # Try PostgreSQL array format (e.g., '{url1,url2}')
                if images_value.startswith('{') and images_value.endswith('}'):
                    images_value = images_value[1:-1]  # Remove braces
                    return [img.strip() for img in images_value.split(',') if img.strip()]
                
                # Try comma-separated (e.g., 'url1,url2')
                if ',' in images_value:
                    return [img.strip() for img in images_value.split(',') if img.strip()]
                
                # Single URL
                return [images_value]
            
            return []
        
        # Convert to dict format
        result = []
        for court in courts:
            court_dict = dict(court._mapping)
            
            # Parse images
            parsed_images = parse_images(court_dict.get('photos'))
            parsed_videos = parse_images(court_dict.get('videos'))
            
            result.append({
                "id": str(court_dict['id']),
                "court_name": court_dict.get('court_name', ''),
                "location": f"{court_dict.get('location', '')}, {court_dict.get('city_name', '')}",
                "game_type": court_dict.get('game_type', ''),
                "prices": str(court_dict.get('prices', '0')),
                "description": court_dict.get('description', '') or f"{court_dict.get('branch_name', '')} - {court_dict.get('game_type', '')} Court",
                "photos": parsed_images,
                "videos": parsed_videos,
                "created_at": court_dict['created_at'].isoformat() if court_dict.get('created_at') else None,
                "updated_at": court_dict['updated_at'].isoformat() if court_dict.get('updated_at') else None,
            })
        
        return result
    except Exception as e:
        print(f"Error in get_venues: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{venue_id}", response_model=schemas.AdminCourtResponse)
def get_venue(venue_id: str, db: Session = Depends(database.get_db)):
    venue = db.query(models.AdminCourt).filter(models.AdminCourt.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

@router.post("/seed", response_model=List[schemas.VenueResponse])
def seed_venues(db: Session = Depends(database.get_db)):
    """Seed the database with some dummy venues if empty"""
    if db.query(models.Venue).count() > 0:
        return db.query(models.Venue).all()
        
    venues_data = [
        {
            "court_name": "Smash Arena",
            "location": "Jubilee Hills",
            "city": "Hyderabad",
            "game_type": "Badminton,Table Tennis",
            "prices": "500",
            "description": "Premium indoor stadium with synthetic courts",
            "photos": "https://example.com/photo1.jpg"
        },
        {
            "court_name": "Power Play Sports",
            "location": "Gachibowli",
            "city": "Hyderabad",
            "game_type": "Cricket,Football",
            "prices": "1200",
            "description": "Large turf for cricket and football",
            "photos": "https://example.com/photo2.jpg"
        },
        {
            "court_name": "City Tennis Club",
            "location": "Banjara Hills",
            "city": "Hyderabad",
            "game_type": "Tennis",
            "prices": "800",
            "description": "Clay and hard courts available",
            "photos": "https://example.com/photo3.jpg"
        }
    ]
    
    created_venues = []
    for v in venues_data:
        venue = models.Venue(
            id=str(uuid.uuid4()),
            **v
        )
        db.add(venue)
        created_venues.append(venue)
        
    db.commit()
    for v in created_venues:
        db.refresh(v)
        
    return created_venues
