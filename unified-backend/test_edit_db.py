import sqlite3

conn = sqlite3.connect('myrush.db')
cursor = conn.cursor()

cursor.execute("SELECT id, email, role FROM admins LIMIT 1")
admin = cursor.fetchone()
print(f"Admin: {admin}")

cursor.execute("SELECT id, name FROM amenities LIMIT 1")
amenity = cursor.fetchone()
print(f"Amenity: {amenity}")

cursor.execute("SELECT id, name FROM game_types LIMIT 1")
game = cursor.fetchone()
print(f"GameType: {game}")

if admin and amenity:
    import requests
    headers = {"Authorization": f"Bearer admin-token-{admin[0]}"}
    print(f"Using headers: {headers}")
    
    # Try updating amenity
    res = requests.put(
        f"http://localhost:8000/api/admin/amenities/{amenity[0]}", 
        data={"name": amenity[1] + " Test"},
        headers=headers
    )
    print("Amenity PUT:", res.status_code, res.text)
    
    if game:
        res2 = requests.put(
            f"http://localhost:8000/api/admin/game-types/{game[0]}",
            data={"name": game[1] + " Test", "short_code": "TST"},
            headers=headers
        )
        print("GameType PUT:", res2.status_code, res2.text)
