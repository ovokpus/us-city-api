const { pool } = require('../db');

exports.getStates = async (req, res) => {
    try {
        let query = "SELECT DISTINCT state_id as id, state_name as state FROM uscitymapapi_us_cities_ovokpus";
        const queryParams = [];

        const state_id = req.query.id;
        const page_num = parseInt(req.query.page_num, 10);
        const page_size = parseInt(req.query.page_size, 10);

        if (state_id) {
            query += ' WHERE state_id = $1 ';
            queryParams.push(String(state_id).toUpperCase());
        } else if (!isNaN(page_num) && !isNaN(page_size) && page_num > 0 && page_size > 0) {
            const offset = (page_num - 1) * page_size;
            query += ' ORDER BY state_id LIMIT $1 OFFSET $2';
            queryParams.push(page_size, offset);
        } else {
            query += ' ORDER BY state_id';
        }

        const { rows } = await pool.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// New: per-state totals over the cities in the dataset (population >= 15k places).
exports.getStateStats = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT state_id AS id, state_name AS state, COUNT(*)::int AS cities,
                   SUM(population)::bigint AS city_population,
                   (ARRAY_AGG(city ORDER BY population DESC))[1] AS largest_city
            FROM uscitymapapi_us_cities_ovokpus GROUP BY state_id, state_name ORDER BY city_population DESC`);
        res.json(rows.map(r => ({ ...r, city_population: Number(r.city_population) })));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
