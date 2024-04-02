const { pool } = require('../db');

exports.getCities = async (req, res) => {
    try {
        let query = 'SELECT id, city FROM uscitymapapi_us_cities_ovokpus';
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
            queryParams.push(state_id);
        } else if (!isNaN(page_num) && !isNaN(page_size) && page_num > 0 && page_size > 0) {
            const offset = (page_num - 1) * page_size;
            query += ' ORDER BY city LIMIT $1 OFFSET $2';
            queryParams.push(page_size, offset);
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

exports.findNearestCity = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        // Example SQL query using Euclidean distance (simplified for demonstration)
        // Note: This approach is not geographically accurate for real-world applications
        let query = `
            SELECT id, city,
            SQRT(POWER(lat - $1, 2) + POWER(lng - $2, 2)) AS distance
            FROM uscitymapapi_us_cities_ovokpus
            ORDER BY distance
            LIMIT 1
        `;

        const { rows } = await pool.query(query, [lat, lng]);
        if (rows.length > 0) {
            res.json({
                city: {
                    id: rows[0].id,
                    name: rows[0].city
                },
                distance: rows[0].distance
            });
        } else {
            res.status(404).json({ message: 'No cities found.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getPopulationDistribution = async (req, res) => {
    try {
        // First, determine the min and max population in the dataset
        const minMaxQuery = 'SELECT MIN(population) AS min_population, MAX(population) AS max_population FROM uscitymapapi_us_cities_ovokpus';
        const minMaxResult = await pool.query(minMaxQuery);
        const { min_population, max_population } = minMaxResult.rows[0];

        // Initialize distribution with ranges
        const distribution = {};
        for (let population = min_population; population <= max_population; population += 1000000) {
            const rangeStart = Math.floor(population / 1000000) * 1000000;
            const rangeEnd = rangeStart + 1000000;
            const rangeKey = `${rangeStart} - ${rangeEnd}`;
            distribution[rangeKey] = [];
        }

        // Query to select all cities with their populations
        let query = 'SELECT id, city, population FROM uscitymapapi_us_cities_ovokpus ORDER BY population';

        const { rows } = await pool.query(query);
        rows.forEach(({ id, city, population }) => {
            const rangeStart = Math.floor(population / 1000000) * 1000000;
            const rangeEnd = rangeStart + 1000000;
            const rangeKey = `${rangeStart} - ${rangeEnd}`;

            distribution[rangeKey].push({ id, city });
        });

        res.json(distribution);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};