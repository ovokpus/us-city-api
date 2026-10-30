const express = require('express');
require('dotenv').config();
const { pool } = require('./db');
const cityRoutes = require('./routes/cityRoutes');
const stateRoutes = require('./routes/stateRoutes');
const timeRoutes = require('./routes/timeRoutes');

const app = express();

app.get('/health', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT COUNT(*)::int AS cities, COUNT(DISTINCT state_id)::int AS states FROM uscitymapapi_us_cities_ovokpus');
        res.json({ status: 'ok', database: true, ...rows[0], source: 'GeoNames cities15000 (CC BY 4.0)' });
    } catch (err) {
        res.status(503).json({ status: 'degraded', database: false, error: err.code || 'db_unavailable' });
    }
});

app.use('/city', cityRoutes);
app.use('/state', stateRoutes);
app.use('/time', timeRoutes);

module.exports = app;
