"""Capture README screenshots from the running stack (docker compose up). Real UI and data."""
import json
from pathlib import Path
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent.parent / "docs" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    pg.goto("http://localhost:8080"); pg.wait_for_selector("tbody tr"); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(1200)
    box = pg.locator(".map").bounding_box()
    pg.mouse.click(box["x"] + box["width"] * 0.38, box["y"] + box["height"] * 0.42)  # somewhere in the Mountain West
    pg.wait_for_selector(".nearest"); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(1200)
    pg.screenshot(path=OUT / "01-explorer-nearest.png", full_page=True)
    pg.fill("input", "San"); pg.select_option("select >> nth=0", "CA"); pg.select_option("select >> nth=1", "50000")
    pg.wait_for_timeout(800); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(1200)
    pg.screenshot(path=OUT / "02-search-california.png", full_page=True)
    b.close()

# raw JSON from the original endpoints, captured for the README
api = "http://localhost:3000"
samples = {path: json.load(urlopen(api + path)) for path in
           ["/city?page_num=1&page_size=3", "/city/find?lat=40.0&lng=-105.3", "/state?page_num=1&page_size=3", "/health"]}
(OUT / "api-samples.json").write_text(json.dumps(samples, indent=2) + "\n")
print("ok")
