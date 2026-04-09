import json
from main import app

with open("MyRush_API_Collection.json", "w") as f:
    json.dump(app.openapi(), f, indent=2)
print("done")
