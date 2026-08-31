"""
Builds the 999-parcel world grid that the whole site is drawn from.

Run:  python scripts/build-parcels.py

Reads the two Natural Earth files next to this script (public domain, 110m
resolution) and writes two generated files into src/data/. Those outputs are
committed, so the app never fetches geodata at build or run time — this
script only needs to run again if the parcel count or grid size changes.

Why a hex grid in an equal-area projection: every parcel has to be the same
amount of ground for "one parcel" to mean anything. Equal Earth is
equal-area, so a regular hex lattice laid on the projected plane gives 999
cells of genuinely identical area on the globe. A lat/lon grid would not —
its cells shrink toward the poles, and a parcel in Norway would quietly be
worth a fraction of one in Kenya.
"""

import io
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, "src", "data")

TARGET_PARCELS = 999

# Equal Earth projection coefficients (Šavrič, Patterson & Jenny, 2018).
A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796


def equal_earth(lon_deg, lat_deg):
    """Longitude/latitude in degrees -> projected x, y (unit sphere radii)."""
    lon = math.radians(lon_deg)
    lat = math.radians(lat_deg)
    theta = math.asin(math.sqrt(3) / 2 * math.sin(lat))
    t2 = theta * theta
    denom = 3 * (9 * A4 * t2**4 + 7 * A3 * t2**3 + 3 * A2 * t2 + A1)
    x = 2 * math.sqrt(3) * lon * math.cos(theta) / denom
    y = A4 * theta**9 + A3 * theta**7 + A2 * theta**3 + A1 * theta
    return x, y


def equal_earth_inverse(x, y, iterations=24):
    """
    Projected x, y -> longitude, latitude in degrees.

    Equal Earth has no closed-form inverse, so theta is solved from y by
    Newton iteration and longitude falls out of x once theta is known. The
    globe needs real spherical coordinates; the projected grid alone cannot
    be draped on a sphere.
    """
    theta = y
    for _ in range(iterations):
        t2 = theta * theta
        fy = A4 * theta**9 + A3 * theta**7 + A2 * theta**3 + A1 * theta - y
        dfy = 9 * A4 * theta**8 + 7 * A3 * theta**6 + 3 * A2 * t2 + A1
        if dfy == 0:
            break
        step = fy / dfy
        theta -= step
        if abs(step) < 1e-13:
            break
    t2 = theta * theta
    denom = 3 * (9 * A4 * t2**4 + 7 * A3 * t2**3 + 3 * A2 * t2 + A1)
    cos_theta = math.cos(theta)
    if abs(cos_theta) < 1e-12:
        lon = 0.0
    else:
        lon = x * denom / (2 * math.sqrt(3) * cos_theta)
    sin_lat = math.sin(theta) * 2 / math.sqrt(3)
    sin_lat = max(-1.0, min(1.0, sin_lat))
    lat = math.asin(sin_lat)
    return math.degrees(lon), math.degrees(lat)


def rings_of(geometry):
    """Yields every linear ring of a Polygon or MultiPolygon."""
    kind = geometry["type"]
    if kind == "Polygon":
        for ring in geometry["coordinates"]:
            yield ring
    elif kind == "MultiPolygon":
        for polygon in geometry["coordinates"]:
            for ring in polygon:
                yield ring


def project_ring(ring):
    return [equal_earth(lon, lat) for lon, lat in ring]


def point_in_ring(x, y, ring):
    """Standard ray casting. `ring` is a list of projected (x, y) pairs."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y):
            if x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                inside = not inside
        j = i
    return inside


class RingIndex:
    """
    Rings bucketed by latitude band so a point test only walks the rings
    that could possibly contain it. 999 candidate centres against ~1500
    rings is slow enough to matter without this.
    """

    def __init__(self, bands=90):
        self.bands = bands
        self.buckets = [[] for _ in range(bands)]
        self.y_min = float("inf")
        self.y_max = float("-inf")
        self.entries = []

    def add(self, ring, payload):
        ys = [p[1] for p in ring]
        xs = [p[0] for p in ring]
        box = (min(xs), min(ys), max(xs), max(ys))
        self.entries.append((ring, box, payload))
        self.y_min = min(self.y_min, box[1])
        self.y_max = max(self.y_max, box[3])

    def build(self):
        span = self.y_max - self.y_min or 1
        for ring, box, payload in self.entries:
            lo = int((box[1] - self.y_min) / span * (self.bands - 1))
            hi = int((box[3] - self.y_min) / span * (self.bands - 1))
            for b in range(max(0, lo), min(self.bands - 1, hi) + 1):
                self.buckets[b].append((ring, box, payload))

    def hits(self, x, y):
        span = self.y_max - self.y_min or 1
        b = int((y - self.y_min) / span * (self.bands - 1))
        if b < 0 or b >= self.bands:
            return
        for ring, box, payload in self.buckets[b]:
            if box[0] <= x <= box[2] and box[1] <= y <= box[3]:
                if point_in_ring(x, y, ring):
                    yield payload


def load_land():
    path = os.path.join(HERE, "ne_110m_land.geojson")
    data = json.load(io.open(path, encoding="utf-8"))
    index = RingIndex()
    outlines = []
    spherical = []
    for feature in data["features"]:
        for ring in rings_of(feature["geometry"]):
            projected = project_ring(ring)
            index.add(projected, True)
            outlines.append(projected)
            spherical.append([(lon, lat) for lon, lat in ring])
    index.build()
    return index, outlines, spherical


def load_countries():
    path = os.path.join(HERE, "ne_110m_admin_0_countries.geojson")
    data = json.load(io.open(path, encoding="utf-8"))
    index = RingIndex()
    for feature in data["features"]:
        props = feature["properties"]
        payload = (props.get("NAME") or "Unclaimed", props.get("CONTINENT") or "")
        for ring in rings_of(feature["geometry"]):
            index.add(project_ring(ring), payload)
    index.build()
    return index


def hex_centres(radius, bounds):
    """
    Flat-top hex lattice. Horizontal step 1.5r, vertical step sqrt(3)r,
    odd columns dropped half a row.
    """
    min_x, min_y, max_x, max_y = bounds
    step_x = 1.5 * radius
    step_y = math.sqrt(3) * radius
    col = 0
    x = min_x
    while x <= max_x + step_x:
        offset = (step_y / 2) if col % 2 else 0
        y = min_y + offset
        while y <= max_y + step_y:
            yield x, y
            y += step_y
        x += step_x
        col += 1


def land_fraction(cx, cy, radius, land):
    """
    Rough share of a hex that is actually land, by sampling a small ring of
    points inside it. Used only to decide which coastal hexes to drop when
    the lattice overshoots 999.
    """
    hits = 0
    samples = 0
    for ring_r in (0.35, 0.7):
        for k in range(6):
            angle = math.pi / 3 * k + (0.3 if ring_r > 0.5 else 0)
            px = cx + math.cos(angle) * radius * ring_r
            py = cy + math.sin(angle) * radius * ring_r
            samples += 1
            if any(land.hits(px, py)):
                hits += 1
    return hits / samples if samples else 0


def main():
    print("projecting land…")
    land, outlines, spherical = load_land()
    countries = load_countries()

    xs = [p[0] for ring in outlines for p in ring]
    ys = [p[1] for ring in outlines for p in ring]
    bounds = (min(xs), min(ys), max(xs), max(ys))

    # Binary search the hex radius so the land cells land just above 999.
    lo, hi = 0.005, 0.25
    best = None
    for _ in range(40):
        radius = (lo + hi) / 2
        centres = [
            (x, y) for x, y in hex_centres(radius, bounds) if any(land.hits(x, y))
        ]
        count = len(centres)
        if count >= TARGET_PARCELS:
            best = (radius, centres)
            lo = radius  # bigger radius -> fewer cells; push for the fewest >= target
        else:
            hi = radius
        if abs(hi - lo) < 1e-6:
            break

    if best is None:
        raise SystemExit("no radius produced enough land cells")

    radius, centres = best
    print(f"radius {radius:.6f} -> {len(centres)} land cells")

    # Trim the overshoot by dropping the cells with the least land in them,
    # which removes stray coastal slivers rather than punching holes inland.
    scored = [(land_fraction(x, y, radius, land), x, y) for x, y in centres]
    scored.sort(key=lambda s: (-s[0], s[2], s[1]))
    kept = scored[:TARGET_PARCELS]

    # Number them the way an atlas would: north to south, then west to east.
    kept.sort(key=lambda s: (-s[2], s[1]))

    parcels = []
    for i, (fraction, x, y) in enumerate(kept, start=1):
        name, continent = next(iter(countries.hits(x, y)), ("Open Water", ""))
        lon, lat = equal_earth_inverse(x, y)

        # Corners are taken from the lattice itself and then unprojected,
        # not rebuilt as a regular hexagon on the sphere. Equal Earth
        # preserves area, not shape, so a hex that is regular here is wider
        # in longitude than in latitude once it is on the globe — redrawing
        # it as a regular spherical hexagon makes every plot overlap its
        # neighbours by about a third. Unprojecting the real corners tiles
        # exactly, which is the whole point of the grid.
        corners = []
        for k in range(6):
            angle = math.pi / 3 * k
            cx = x + radius * math.cos(angle)
            cy = y + radius * math.sin(angle)
            c_lon, c_lat = equal_earth_inverse(cx, cy)
            corners.append([round(c_lon, 3), round(c_lat, 3)])

        parcels.append(
            {
                "id": i,
                "x": round(x, 5),
                "y": round(y, 5),
                "lon": round(lon, 4),
                "lat": round(lat, 4),
                "corners": corners,
                "country": name,
                "continent": continent,
                "land": round(fraction, 2),
            }
        )

    # Angular radius of a plot on the sphere, measured rather than assumed:
    # invert two points one hex radius apart on the equator and take the
    # longitude difference. The globe draws hexes from this.
    lon_a, _ = equal_earth_inverse(0.0, 0.0)
    lon_b, _ = equal_earth_inverse(radius, 0.0)
    hex_angular_radius = math.radians(abs(lon_b - lon_a))

    os.makedirs(OUT_DIR, exist_ok=True)

    with io.open(os.path.join(OUT_DIR, "parcels.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "total": len(parcels),
                "hexRadius": round(radius, 6),
                "hexAngularRadius": round(hex_angular_radius, 8),
                "bounds": [round(v, 5) for v in bounds],
                "parcels": parcels,
            },
            f,
            separators=(",", ":"),
            ensure_ascii=False,
        )

    with io.open(os.path.join(OUT_DIR, "coastline.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "bounds": [round(v, 5) for v in bounds],
                "rings": [
                    [[round(x, 4), round(y, 4)] for x, y in ring]
                    for ring in outlines
                    if len(ring) > 3
                ],
                # The globe drapes the coastline on a sphere, so it needs the
                # original spherical coordinates, not the flattened ones.
                "lonLatRings": [
                    [[round(lon, 3), round(lat, 3)] for lon, lat in ring]
                    for ring in spherical
                    if len(ring) > 3
                ],
            },
            f,
            separators=(",", ":"),
            ensure_ascii=False,
        )

    by_country = {}
    for parcel in parcels:
        by_country[parcel["country"]] = by_country.get(parcel["country"], 0) + 1
    top = sorted(by_country.items(), key=lambda kv: -kv[1])[:8]
    print(f"wrote {len(parcels)} parcels across {len(by_country)} countries")
    print("largest holdings:", ", ".join(f"{n} {c}" for n, c in top))


if __name__ == "__main__":
    main()
