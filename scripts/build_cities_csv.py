"""Rebuild db/data/us_cities.csv from GeoNames (CC BY 4.0). Usage: python scripts/build_cities_csv.py"""
import csv
import io
import urllib.request
import zipfile
from pathlib import Path

BASE = "https://download.geonames.org/export/dump/"
OUT = Path(__file__).resolve().parent.parent / "db" / "data" / "us_cities.csv"

admin = urllib.request.urlopen(BASE + "admin1CodesASCII.txt").read().decode()
names = {l.split("\t")[0][3:]: l.split("\t")[1] for l in admin.splitlines() if l.startswith("US.")}
z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(BASE + "cities15000.zip").read()))
rows = []
for line in z.read("cities15000.txt").decode().splitlines():
    f = line.split("\t")
    if f[8] != "US" or f[7] == "PPLX" or f[10] not in names:
        continue
    rows.append((f[1], f[10], names[f[10]], float(f[4]), float(f[5]), int(f[14]), f[17], int(f[0])))
rows.sort(key=lambda r: -r[5])
with OUT.open("w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(["id", "city", "state_id", "state_name", "lat", "lng", "population", "timezone", "geonameid"])
    for i, r in enumerate(rows, 1):
        w.writerow([i, *r])
print(f"wrote {len(rows)} cities to {OUT}")
