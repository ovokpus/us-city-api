-- Table name kept from the original project so existing queries work unchanged.
CREATE TABLE IF NOT EXISTS uscitymapapi_us_cities_ovokpus (
    id          INTEGER PRIMARY KEY,
    city        TEXT NOT NULL,
    state_id    CHAR(2) NOT NULL,
    state_name  TEXT NOT NULL,
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    population  INTEGER NOT NULL,
    timezone    TEXT NOT NULL,
    geonameid   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_cities_state ON uscitymapapi_us_cities_ovokpus (state_id);
CREATE INDEX IF NOT EXISTS idx_cities_city_lower ON uscitymapapi_us_cities_ovokpus (lower(city));

COPY uscitymapapi_us_cities_ovokpus (id, city, state_id, state_name, lat, lng, population, timezone, geonameid)
FROM '/seed/us_cities.csv' WITH (FORMAT csv, HEADER true);
