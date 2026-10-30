const { pool } = require('../db');

const TABLE = 'uscitymapapi_us_cities_ovokpus';

// Great-circle distance in km (haversine). The original used Euclidean distance on degrees,
// which picks the wrong city at higher latitudes (a degree of longitude shrinks with latitude).
const HAVERSINE_KM = `(2 * 6371 * ASIN(SQRT(
    POWER(SIN(RADIANS(lat - $1) / 2), 2) +
    COS(RADIANS($1)) * COS(RADIANS(lat)) * POWER(SIN(RADIANS(lng - $2) / 2), 2))))`;

exports.getCities = async (req, res) => {
    try {
        let query = `SELECT id, city FROM ${TABLE}`;
        const queryParams = [];

        const page_num = parseInt(req.query.page_num, 10);
        const page_size = parseInt(req.query.page_size, 10);
        const id = parseInt(req.query.id, 10);
        const state_id = req.query.state_id;

        if (!isNaN(id) && id > 0) {
            query += ' WHERE id = $1 ORDER BY city';
            queryParams.push(id);
        } else if (state_id) {
            query += ' WHERE state_id = $1 ORDER BY city';
            queryParams.push(String(state_id).toUpperCase());
        } else if (!isNaN(page_num) && !isNaN(page_size) && page_num > 0 && page_size > 0) {
            const offset = (page_num - 1) * page_size;
            query += ' ORDER BY city LIMIT $1 OFFSET $2';
            queryParams.push(Math.min(page_size, 1000), offset);
        } else {
            query += ' ORDER BY city';
        }

        const { rows } = await pool.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// New: full-detail search used by the UI (name prefix / state / min population).
exports.searchCities = async (req, res) => {
    try {
        const where = [];
        const params = [];
        if (req.query.q) { params.push(`${String(req.query.q).toLowerCase()}%`); where.push(`lower(city) LIKE $${params.length}`); }
        if (req.query.state_id) { params.push(String(req.query.state_id).toUpperCase()); where.push(`state_id = $${params.length}`); }
        const minPop = parseInt(req.query.min_population, 10);
        if (!isNaN(minPop)) { params.push(minPop); where.push(`population >= $${params.length}`); }
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
        params.push(limit);
        const sql = `SELECT id, city, state_id, state_name, lat, lng, population, timezone FROM ${TABLE}
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY population DESC LIMIT $${params.length}`;
        const { rows } = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.findNearestCity = async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ message: 'lat and lng are required numbers (lat -90..90, lng -180..180).' });
    }
    try {
        const query = `
            SELECT id, city, state_id, lat, lng, population, ${HAVERSINE_KM} AS distance
            FROM ${TABLE}
            ORDER BY distance
            LIMIT 1
        `;
        const { rows } = await pool.query(query, [lat, lng]);
        if (rows.length > 0) {
            const r = rows[0];
            res.json({
                city: { id: r.id, name: r.city, state_id: r.state_id, lat: r.lat, lng: r.lng, population: r.population },
                distance: Number(r.distance),
                unit: 'km',
            });
        } else {
            res.status(404).json({ message: 'No cities found.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Pure helper, exported for tests: bucket cities into fixed-width population ranges.
function bucketPopulation(rows, width = 1000000) {
    const distribution = {};
    if (!rows.length) return distribution;
    const min = Math.min(...rows.map(r => r.population));
    const max = Math.max(...rows.map(r => r.population));
    for (let start = Math.floor(min / width) * width; start <= max; start += width) {
        distribution[`${start} - ${start + width}`] = [];
    }
    rows.forEach(({ id, city, population }) => {
        const start = Math.floor(population / width) * width;
        distribution[`${start} - ${start + width}`].push({ id, city });
    });
    return distribution;
}
exports.bucketPopulation = bucketPopulation;

exports.getPopulationDistribution = async (req, res) => {
    try {
        const width = Math.max(parseInt(req.query.bucket_size, 10) || 1000000, 1000);
        const { rows } = await pool.query(`SELECT id, city, population FROM ${TABLE} ORDER BY population`);
        res.json(bucketPopulation(rows, width));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
