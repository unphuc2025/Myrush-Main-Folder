import os
import sys
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import json

# Import the actual database URL from the application
sys.path.append(os.getcwd())
from database import SQLALCHEMY_DATABASE_URL

# Create engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

TARGET_PREFIX = "/api/media/"

def clean_url_list(urls):
    if not urls:
        return urls
    cleaned = []
    changed = False
    for url in urls:
        if url and isinstance(url, str) and url.startswith(TARGET_PREFIX):
            cleaned.append(url.replace(TARGET_PREFIX, ""))
            changed = True
        else:
            cleaned.append(url)
    return cleaned, changed

def clean_url_single(url):
    if url and isinstance(url, str) and url.startswith(TARGET_PREFIX):
        return url.replace(TARGET_PREFIX, ""), True
    return url, False

def run_cleanup():
    db = SessionLocal()
    try:
        print(f"Starting cleanup of {TARGET_PREFIX}...")

        # 1. Clean admin_branches (images)
        print("Cleaning admin_branches...")
        branches = db.execute(text("SELECT id, images FROM admin_branches")).fetchall()
        for b_id, images in branches:
            if images:
                cleaned_images, changed = clean_url_list(images)
                if changed:
                    db.execute(
                        text("UPDATE admin_branches SET images = :images WHERE id = :id"),
                        {"images": cleaned_images, "id": b_id}
                    )
                    print(f"  Updated branch {b_id}")

        # 2. Clean admin_courts (images)
        print("Cleaning admin_courts...")
        courts = db.execute(text("SELECT id, images FROM admin_courts")).fetchall()
        for c_id, images in courts:
            if images:
                cleaned_images, changed = clean_url_list(images)
                if changed:
                    db.execute(
                        text("UPDATE admin_courts SET images = :images WHERE id = :id"),
                        {"images": cleaned_images, "id": c_id}
                    )
                    print(f"  Updated court {c_id}")

        # 3. Clean admin_game_types (icon_url)
        print("Cleaning admin_game_types...")
        game_types = db.execute(text("SELECT id, icon_url FROM admin_game_types")).fetchall()
        for gt_id, icon_url in game_types:
            cleaned_url, changed = clean_url_single(icon_url)
            if changed:
                db.execute(
                    text("UPDATE admin_game_types SET icon_url = :url WHERE id = :id"),
                    {"url": cleaned_url, "id": gt_id}
                )
                print(f"  Updated game type {gt_id}")

        # 4. Clean admin_amenities (icon_url)
        print("Cleaning admin_amenities...")
        amenities = db.execute(text("SELECT id, icon_url FROM admin_amenities")).fetchall()
        for a_id, icon_url in amenities:
            cleaned_url, changed = clean_url_single(icon_url)
            if changed:
                db.execute(
                    text("UPDATE admin_amenities SET icon_url = :url WHERE id = :id"),
                    {"url": cleaned_url, "id": a_id}
                )
                print(f"  Updated amenity {a_id}")

        # 5. Clean adminvenues (photos)
        print("Cleaning adminvenues...")
        avenues = db.execute(text("SELECT id, photos FROM adminvenues")).fetchall()
        for av_id, photos in avenues:
            if photos:
                cleaned_photos, changed = clean_url_list(photos)
                if changed:
                    db.execute(
                        text("UPDATE adminvenues SET photos = :photos WHERE id = :id"),
                        {"photos": cleaned_photos, "id": av_id}
                    )
                    print(f"  Updated adminvenue {av_id}")

        # 6. Clean users (avatar_url)
        print("Cleaning user avatars...")
        users = db.execute(text("SELECT id, avatar_url FROM users")).fetchall()
        for u_id, avatar_url in users:
            cleaned_url, changed = clean_url_single(avatar_url)
            if changed:
                db.execute(
                    text("UPDATE users SET avatar_url = :url WHERE id = :id"),
                    {"url": cleaned_url, "id": u_id}
                )
                print(f"  Updated user avatar {u_id}")

        db.commit()
        print("Cleanup completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_cleanup()
