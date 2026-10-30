jest.mock('../src/db', () => ({ pool: { query: jest.fn() } }));
const request = require('supertest');
const { pool } = require('../src/db');
const app = require('../src/app');
const { bucketPopulation } = require('../src/controllers/cityController');
const { zoneTime } = require('../src/controllers/timeController');

beforeEach(() => pool.query.mockReset());

describe('GET /city', () => {
  test('paginates with bound parameters', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, city: 'Abilene' }] });
    const r = await request(app).get('/city?page_num=3&page_size=10');
    expect(r.status).toBe(200);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/LIMIT \$1 OFFSET \$2/);
    expect(params).toEqual([10, 20]);
  });

  test('state filter is parameterised, not interpolated', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await request(app).get("/city?state_id=tx' OR 1=1--");
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).not.toMatch(/OR 1=1/);
    expect(params[0]).toBe("TX' OR 1=1--");
  });
});

describe('GET /city/find', () => {
  test('400 on missing or invalid coordinates', async () => {
    expect((await request(app).get('/city/find')).status).toBe(400);
    expect((await request(app).get('/city/find?lat=200&lng=0')).status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('returns nearest city with km distance via haversine', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 7, city: 'Denver', state_id: 'CO', lat: 39.7, lng: -104.9, population: 715522, distance: '3.2' }] });
    const r = await request(app).get('/city/find?lat=39.74&lng=-104.99');
    expect(r.body).toEqual({ city: { id: 7, name: 'Denver', state_id: 'CO', lat: 39.7, lng: -104.9, population: 715522 }, distance: 3.2, unit: 'km' });
    expect(pool.query.mock.calls[0][0]).toMatch(/ASIN/);
    expect(pool.query.mock.calls[0][1]).toEqual([39.74, -104.99]);
  });
});

test('bucketPopulation groups into fixed ranges including empty ones', () => {
  const d = bucketPopulation([{ id: 1, city: 'A', population: 20000 }, { id: 2, city: 'B', population: 2500000 }]);
  expect(Object.keys(d)).toEqual(['0 - 1000000', '1000000 - 2000000', '2000000 - 3000000']);
  expect(d['1000000 - 2000000']).toEqual([]);
  expect(d['2000000 - 3000000']).toEqual([{ id: 2, city: 'B' }]);
});

test('zoneTime uses the real offset', () => {
  const now = new Date('2026-07-01T12:00:00Z');
  expect(zoneTime('America/New_York', now)).toEqual({ name: 'America/New_York', time: '2026-07-01T08:00:00-04:00', utc_offset: '-04:00' });
  expect(zoneTime('Pacific/Honolulu', now).time).toBe('2026-07-01T02:00:00-10:00');
});

test('GET /time lists zones with city counts', async () => {
  pool.query.mockResolvedValue({ rows: [{ timezone: 'America/Chicago', cities: 900 }] });
  const r = await request(app).get('/time');
  expect(r.body[0]).toMatchObject({ name: 'America/Chicago', cities: 900 });
  expect(r.body[0].time).toMatch(/-0[56]:00$/);
});

test('GET /health degrades when the database is down', async () => {
  pool.query.mockRejectedValue(Object.assign(new Error('x'), { code: 'ECONNREFUSED' }));
  const r = await request(app).get('/health');
  expect(r.status).toBe(503);
  expect(r.body).toEqual({ status: 'degraded', database: false, error: 'ECONNREFUSED' });
});

test('GET /state/stats casts bigint sums', async () => {
  pool.query.mockResolvedValue({ rows: [{ id: 'CA', state: 'California', cities: 400, city_population: '30000000', largest_city: 'Los Angeles' }] });
  const r = await request(app).get('/state/stats');
  expect(r.body[0].city_population).toBe(30000000);
});
