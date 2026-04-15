import main
from fastapi.routing import APIRoute

output = []
for route in main.app.routes:
    if isinstance(route, APIRoute):
        output.append(f"{route.methods} {route.path} -> {route.name}")

with open("api_map.txt", "w") as f:
    f.write("\n".join(sorted(output)))
