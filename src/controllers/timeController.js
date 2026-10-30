const { pool } = require('../db');

// Current wall-clock time in a zone, as an ISO string with the real UTC offset.
// The original re-parsed toLocaleString() output as UTC, which produced a "Z" timestamp that
// was really local time (and depends on the server's locale parsing).
function zoneTime(zone, now = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'longOffset',
    }).formatToParts(now).map(p => [p.type, p.value]));
    const offset = parts.timeZoneName === 'GMT' ? '+00:00' : parts.timeZoneName.replace('GMT', '');
    return {
        name: zone,
        time: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`,
        utc_offset: offset,
    };
}
exports.zoneTime = zoneTime;

exports.getTimeZones = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT timezone, COUNT(*)::int AS cities FROM uscitymapapi_us_cities_ovokpus GROUP BY timezone ORDER BY cities DESC');
        const now = new Date();
        res.json(result.rows.map(row => ({ ...zoneTime(row.timezone, now), cities: row.cities })));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
