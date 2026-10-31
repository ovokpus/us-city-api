# Business case: US City API

**Nearest city, search and state statistics over open data, from your own API.**

## Who buys this

The buyer is the engineering lead at a logistics, real-estate or field-services company that needs basic place lookups inside its own systems. The users are developers who call the API.

## The problem and what it costs

Many apps need simple place lookups (nearest city to a point, cities in a state, population buckets) and either pay per call for a commercial service or hard-code a list. The data here is **GeoNames `cities15000`**, licensed CC BY 4.0 ([GeoNames](https://www.geonames.org/)), so it can be self-hosted with attribution. I found no reliable figure for what teams spend on simple lookups, so the model below uses assumptions.

## How the repo solves it

| Need | What in the repo does it |
|---|---|
| Nearest city | `GET /city/find?lat=&lng=` with haversine distance in km (the original used flat Euclidean distance) |
| Search and stats | `GET /city/search`, `GET /state/stats` and `GET /city/population` buckets |
| Time zones | `GET /time` returns each time zone's local time and UTC offset |
| Data | 3,122 US cities seeded into Postgres from GeoNames on first boot (`db/`) |
| Run and deploy | Express API, React + Leaflet explorer, Jest tests, and Terraform for Cloud Run, Azure Container Apps and AWS ECS |

## Use-case scenarios

All of these organisations are fictional.

1. **A regional courier** tags each delivery address with its nearest city for reporting.
2. **A property-listing site** shows the nearest larger city and its population on each listing.
3. **A field-services firm** uses state statistics to plan where to open a new depot.

## ROI: a worked model (illustrative)

These figures are **illustrative assumptions** unless a source is linked.

| Input | Value | Basis |
|---|---|---|
| Lookup calls a month | 200,000 | Assumption |
| Price per 1,000 calls on a paid service | US$5 | Assumption |
| Hosting the API | US$30 a month | Assumption |

Saving: 200 × $5 − $30 = $970 a month, about **US$11,600 a year**. If a free tier already covers the volume, the saving is close to zero.

## Path to production

1. Rebuild the city file on a schedule with `scripts/build_cities_csv.py`, and keep the GeoNames attribution.
2. Add authentication and rate limits.
3. Add caching for the most common lookups.

## Risks and limits

- Cities only (15,000+ people), with no street-level geocoding.
- GeoNames lists New York's boroughs as separate places, so results reflect that.

**Case strength:** **Weak.** It is useful plumbing, but commercial and free alternatives are easy to find.

## Sources

- GeoNames (cities15000, CC BY 4.0): https://www.geonames.org/
