const express = require('express');
require('dotenv').config();
const cityRoutes = require('./routes/cityRoutes');
const stateRoutes = require('./routes/stateRoutes');

const app = express();

app.use('/city', cityRoutes);
app.use('/state', stateRoutes);

module.exports = app; // Export the Express app

const timeRoutes = require('./routes/timeRoutes');
// Other imports and setup...

app.use('/time', timeRoutes);
// Other middleware and routes...

