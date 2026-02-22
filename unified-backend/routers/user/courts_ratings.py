from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import database
import uuid

router = APIRouter(
    prefix="/courts",
    tags=["courts"]
)

@router.get("/")
def get_courts(
    city: Optional[str] = None,
    game_type: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """
    Fetch courts from admin_courts table filtered by city and game type.
    This is used for the field booking section.
    """
    try:
        # Query from admin_courts with joins to get city, game type, and amenities info
        query_sql = """
            SELECT
                ac.id,
                ac.name as court_name,
                ac.price_per_hour as prices,
                ac.images as photos,
                ac.videos,
                ac.terms_and_conditions,
                ac.amenities as amenities,
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
        """

        params = {}
        where_conditions = ["ac.is_active = true"]

        # Filter by city OR location (they're the same in your case)
        if city or location:
            city_filter = city or location
            city_filter = city_filter.strip()  # Remove trailing spaces
            where_conditions.append("LOWER(acity.name) = LOWER(:city)")
            params['city'] = city_filter

        # Add WHERE clause
        query_sql += " WHERE " + " AND ".join(where_conditions)
        
        # Filter by game type if provided (handle array of game types)
        if game_type and game_type != "undefined":
            if isinstance(game_type, list):
                # Handle Array of game types
                placeholders = ','.join([f":game_type_{i}" for i in range(len(game_type))])
                where_conditions.append(f"agt.name IN ({placeholders})")
                for i, gt in enumerate(game_type):
                    params[f'game_type_{i}'] = gt.strip()
            else:
                where_conditions.append("agt.name ILIKE :game_type")
                params['game_type'] = f"%{game_type}%"

        # Update WHERE clause if we have additional conditions
        if len(where_conditions) > 1:
            query_sql = query_sql.replace(" WHERE ac.is_active = true", " WHERE " + " AND ".join(where_conditions))
        
        print(f"[COURTS API] Query: {query_sql}")
        print(f"[COURTS API] Params: {params}")
        
        result_proxy = db.execute(text(query_sql), params)
        courts = result_proxy.fetchall()
        
        print(f"[COURTS API] Found {len(courts)} courts")
        
        # Convert to dict format
        result = []
        for court in courts:
            court_dict = dict(court._mapping)
            result.append({
                "id": str(court_dict['id']),
                "court_name": court_dict.get('court_name', ''),
                "location": f"{court_dict.get('location', '')}, {court_dict.get('city_name', '')}",
                "game_type": court_dict.get('game_type', ''),
                "prices": str(court_dict.get('prices', '0')),
                "description": court_dict.get('description', '') or f"{court_dict.get('branch_name', '')} - {court_dict.get('game_type', '')} Court",
                "terms_and_conditions": court_dict.get('terms_and_conditions', ''),
                "amenities": court_dict.get('amenities', []) or [],
                "photos": court_dict.get('photos', []) or [],
                "videos": court_dict.get('videos', []) or [],
                "created_at": court_dict['created_at'].isoformat() if court_dict.get('created_at') else None,
                "updated_at": court_dict['updated_at'].isoformat() if court_dict.get('updated_at') else None,
                "branch_name": court_dict.get('branch_name', ''),
            })
        
        return result
    except Exception as e:
        print(f"[COURTS API] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{court_id}/ratings")
def get_court_ratings(court_id: str, db: Session = Depends(database.get_db)):
    """Get ratings summary for a specific court"""
    try:
        try:
            uuid.UUID(court_id)
        except ValueError:
             # Return empty ratings structure instead of crashing or 404 for easier frontend handling
             return {
                "court_id": court_id,
                "average_rating": 0,
                "total_reviews": 0,
                "rating_distribution": {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
            }
        # Determine if it's a court or a branch
        is_branch = db.execute(text("SELECT 1 FROM admin_branches WHERE id = :id"), {"id": court_id}).first() is not None
        
        if is_branch:
             query_sql = """
                SELECT
                    COUNT(*) as total_reviews,
                    ROUND(AVG(r.rating)::numeric, 1) as average_rating,
                    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_stars,
                    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_stars,
                    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_stars,
                    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_stars,
                    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star
                FROM reviews r
                JOIN admin_courts ac ON r.court_id = ac.id
                WHERE ac.branch_id = :court_id AND r.is_active = true
            """
        else:
            query_sql = """
                SELECT
                    court_id,
                    COUNT(*) as total_reviews,
                    ROUND(AVG(rating)::numeric, 1) as average_rating,
                    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
                    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
                    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
                    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
                    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
                FROM reviews
                WHERE court_id = :court_id AND is_active = true
                GROUP BY court_id
            """
        
        result = db.execute(text(query_sql), {"court_id": court_id})
        row = result.fetchone()
        
        if not row:
            # No reviews yet for this court
            return {
                "court_id": court_id,
                "average_rating": 0,
                "total_reviews": 0,
                "rating_distribution": {
                    "5": 0,
                    "4": 0,
                    "3": 0,
                    "2": 0,
                    "1": 0
                }
            }
        
        row_dict = dict(row._mapping)
        
        return {
            "court_id": str(row_dict.get('court_id', court_id)),
            "average_rating": float(row_dict['average_rating']) if row_dict['average_rating'] else 0,
            "total_reviews": int(row_dict['total_reviews']),
            "rating_distribution": {
                "5": int(row_dict['five_stars']),
                "4": int(row_dict['four_stars']),
                "3": int(row_dict['three_stars']),
                "2": int(row_dict['two_stars']),
                "1": int(row_dict['one_star'])
            }
        }
        
    except Exception as e:
        print(f"[COURTS API] Error getting court ratings: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{court_id}/reviews")
def get_court_reviews(
    court_id: str,
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(database.get_db)
):
    """Get reviews for a specific court"""
    try:
        try:
            uuid.UUID(court_id)
        except ValueError:
             return { "court_id": court_id, "reviews": [], "total": 0 }

        # Determine if it's a court or a branch
        is_branch = db.execute(text("SELECT 1 FROM admin_branches WHERE id = :id"), {"id": court_id}).first() is not None

        if is_branch:
             query_sql = """
                SELECT
                    r.id,
                    r.rating,
                    r.review_text,
                    r.created_at,
                    COALESCE(u.full_name, p.full_name, 'Anonymous User') as user_name
                FROM reviews r
                JOIN admin_courts ac ON r.court_id = ac.id
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN profiles p ON r.user_id = p.id
                WHERE ac.branch_id = :court_id AND r.is_active = true
                ORDER BY r.created_at DESC
                LIMIT :limit OFFSET :offset
            """
        else:
            query_sql = """
                SELECT
                    r.id,
                    r.rating,
                    r.review_text,
                    r.created_at,
                    COALESCE(u.full_name, p.full_name, 'Anonymous User') as user_name
                FROM reviews r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN profiles p ON r.user_id = p.id
                WHERE r.court_id = :court_id AND r.is_active = true
                ORDER BY r.created_at DESC
                LIMIT :limit OFFSET :offset
            """
        
        result = db.execute(
            text(query_sql),
            {"court_id": court_id, "limit": limit, "offset": offset}
        )
        reviews_data = result.fetchall()
        
        reviews = []
        for row in reviews_data:
            row_dict = dict(row._mapping)
            reviews.append({
                "id": str(row_dict['id']),
                "rating": int(row_dict['rating']),
                "review_text": row_dict['review_text'] or "",
                "user_name": row_dict['user_name'],
                "created_at": row_dict['created_at'].isoformat() if row_dict['created_at'] else None
            })
        
        return {
            "court_id": court_id,
            "reviews": reviews,
            "total": len(reviews)
        }
        
    except Exception as e:
        print(f"[COURTS API] Error getting court reviews: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Rest of the file continues with get_court and get_available_slots endpoints...
