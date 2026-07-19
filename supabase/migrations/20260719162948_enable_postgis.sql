/*
# Enable PostGIS extension

1. Extensions
- `postgis` — spatial types and functions (geometry/geography, ST_Distance, etc.)
2. Notes
- Required for geospatial queries on BTS table.
- If already installed, CREATE EXTENSION IF NOT EXISTS is a no-op.
*/

CREATE EXTENSION IF NOT EXISTS postgis;
