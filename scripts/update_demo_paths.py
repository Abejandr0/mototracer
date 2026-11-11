"""Refresh static demo geometry from OSRM's OpenStreetMap-backed routing demo.

The generated file is committed so the mobile app never calls the demo server.
"""
import json
import math
import urllib.request
from pathlib import Path

ROUTES = {
    "palmas": [(-75.5674, 6.2097), (-75.548, 6.202), (-75.522, 6.187), (-75.508, 6.174)],
    "km18": [(-76.59, 3.444), (-76.605, 3.462), (-76.623, 3.499), (-76.641, 3.522)],
    "calera": [(-74.039, 4.665), (-74.021, 4.677), (-74.002, 4.694), (-73.98, 4.71)],
}


def meters(a, b):
    lat = math.radians((a[1] + b[1]) / 2)
    return math.hypot((a[0] - b[0]) * 111_320 * math.cos(lat), (a[1] - b[1]) * 111_320)


def simplify(points):
    # Retain turns and still include a sample at least every ~180 m.
    result = [points[0]]
    for index in range(1, len(points) - 1):
        if meters(result[-1], points[index]) >= 180:
            result.append(points[index])
            continue
        before, after = result[-1], points[index + 1]
        ax, ay = points[index][0] - before[0], points[index][1] - before[1]
        bx, by = after[0] - before[0], after[1] - before[1]
        if bx * bx + by * by and abs(ax * by - ay * bx) / math.hypot(bx, by) * 111_320 >= 12:
            result.append(points[index])
    result.append(points[-1])
    return [[round(lat, 6), round(lon, 6)] for lon, lat in result]


output = {}
for name, waypoints in ROUTES.items():
    path = ";".join(f"{lon},{lat}" for lon, lat in waypoints)
    url = f"https://router.project-osrm.org/route/v1/driving/{path}?overview=full&geometries=geojson"
    with urllib.request.urlopen(url, timeout=30) as response:
        route = json.load(response)["routes"][0]
    output[name] = {"distanceKm": round(route["distance"] / 1000, 2), "path": simplify(route["geometry"]["coordinates"])}
Path(__file__).resolve().parents[1].joinpath("src/data/demoRoutePaths.json").write_text(json.dumps(output, separators=(",", ":")) + "\n")
print({name: {"distanceKm": route["distanceKm"], "points": len(route["path"])} for name, route in output.items()})
