# us_cities.csv

Derived from the **GeoNames** `cities15000` dump (all populated places with population ≥ 15,000) and
`admin1CodesASCII.txt` (state names), downloaded from https://download.geonames.org/export/dump/.

- Licence: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Data © GeoNames (https://www.geonames.org).
- Changes: kept only `country_code = US`, dropped `PPLX` (sections of populated places), joined state names,
  re-numbered `id` by population (descending), kept `geonameid` for traceability.
- Populations are GeoNames figures and may differ from the latest US Census estimates.

Regenerate with `scripts/build_cities_csv.py`.
