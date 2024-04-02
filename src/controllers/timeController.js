const { pool } = require('../db'); // Ensure this path matches where you've configured your database connection

exports.getTimeZones = async (req, res) => {
    try {
        // SQL query to select distinct time zones from the database
        const query = 'SELECT DISTINCT timezone FROM uscitymapapi_us_cities_ovokpus';
        const result = await pool.query(query);

        // Extracting time zones from query result
        const timeZones = result.rows.map(row => row.timezone);

        const timeDefs = timeZones.map(zone => {
            // Directly working with the specified timezone
            const currentTime = new Date().toLocaleString('en-US', {
                timeZone: zone,
                hour12: false
            });

            // Convert the localized string back to a Date object in the specific timezone
            const timeZoneDate = new Date(currentTime + " UTC");

            return {
                name: zone,
                time: timeZoneDate.toISOString() // Format the Date object to ISO string
            };
        });

        res.json(timeDefs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
