from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import models, database, dependencies
from pydantic import BaseModel
from uuid import UUID

router = APIRouter(
    prefix="/favorites",
    tags=["favorites"]
)

class FavoriteToggle(BaseModel):
    court_id: str

@router.post("/toggle")
def toggle_favorite(
    request: FavoriteToggle,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """Toggle a court as favorite for the current user"""
    try:
        # Check if court exists
        court = db.query(models.Court).filter(models.Court.id == request.court_id).first()
        
        if not court:
            # Check if it's a branch ID (Venue-First flow)
            branch = db.query(models.Branch).filter(models.Branch.id == request.court_id).first()
            if branch:
                # Find the first available court in this branch to link the favorite
                court = db.query(models.Court).filter(models.Court.branch_id == branch.id).first()
                if not court:
                    raise HTTPException(status_code=404, detail="No courts found for this venue")
                # Update the ID to the actual court ID for database consistency
                request.court_id = str(court.id)
            else:
                raise HTTPException(status_code=404, detail="Court or Venue not found")

        # Check if already favorited
        favorite = db.query(models.UserFavoriteCourt).filter(
            models.UserFavoriteCourt.user_id == current_user.id,
            models.UserFavoriteCourt.court_id == request.court_id
        ).first()

        if favorite:
            # Remove from favorites
            db.delete(favorite)
            db.commit()
            return {"status": "unfavorited", "court_id": request.court_id}
        else:
            # Add to favorites
            new_fav = models.UserFavoriteCourt(
                user_id=current_user.id,
                court_id=request.court_id
            )
            db.add(new_fav)
            db.commit()
            return {"status": "favorited", "court_id": request.court_id}
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def get_favorites(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """Get all favorite courts for the current user"""
    try:
        # Join with courts and branches to get full details
        query_sql = """
            SELECT
                ac.id,
                ac.name as court_name,
                ac.price_per_hour as prices,
                ac.images as photos,
                ab.name as branch_name,
                ab.address_line1 as location,
                acity.name as city_name,
                agt.name as game_type,
                (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews r WHERE r.court_id = ac.id AND r.is_active = true) as average_rating
            FROM user_favorite_courts ufc
            JOIN admin_courts ac ON ufc.court_id = ac.id
            JOIN admin_branches ab ON ac.branch_id = ab.id
            JOIN admin_cities acity ON ab.city_id = acity.id
            JOIN admin_game_types agt ON ac.game_type_id = agt.id
            WHERE ufc.user_id = :user_id
        """
        
        result_proxy = db.execute(text(query_sql), {"user_id": current_user.id})
        favorites = result_proxy.fetchall()
        
        result = []
        for fav in favorites:
            row = dict(fav._mapping)
            result.append({
                "id": str(row['id']),
                "court_name": row['branch_name'], # Use Branch Name for Venue-First consistency
                "location": f"{row['location']}, {row['city_name']}",
                "game_type": row['game_type'],
                "prices": str(row['prices']),
                "photos": row['photos'] or [],
                "rating": float(row['average_rating'] or 0),
                "is_favorite": True
            })
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
