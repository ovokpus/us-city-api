import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import MapView, { type Marker } from './MapView'

type City = { id: number; city: string; state_id: string; state_name: string; lat: number; lng: number; population: number; timezone: string }
type Nearest = { city: { id: number; name: string; state_id: string; lat: number; lng: number; population: number }; distance: number; unit: string }
type StateStat = { id: string; state: string; cities: number; city_population: number; largest_city: string }
type Zone = { name: string; time: string; utc_offset: string; cities: number }

const j = (u: string) => fetch(u).then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b.message ?? r.statusText); return b })
const n = (x: number) => x.toLocaleString('en-US')

export default function App() {
  const [health, setHealth] = useState<{ cities: number; states: number; source: string } | null>(null)
  const [q, setQ] = useState('')
  const [st, setSt] = useState('')
  const [minPop, setMinPop] = useState(250000)
  const [cities, setCities] = useState<City[]>([])
  const [states, setStates] = useState<StateStat[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [dist, setDist] = useState<Record<string, unknown[]>>({})
  const [click, setClick] = useState<{ lat: number; lng: number } | null>(null)
  const [nearest, setNearest] = useState<Nearest | null>(null)

  useEffect(() => {
    j('/health').then(setHealth).catch(() => {})
    j('/state/stats').then(setStates)
    j('/time').then(setZones)
    j('/city/population?bucket_size=250000').then(setDist)
  }, [])
  useEffect(() => {
    const p = new URLSearchParams({ limit: '300' })
    if (q) p.set('q', q); if (st) p.set('state_id', st); if (minPop) p.set('min_population', String(minPop))
    j(`/city/search?${p}`).then(setCities)
  }, [q, st, minPop])
  useEffect(() => { if (click) j(`/city/find?lat=${click.lat}&lng=${click.lng}`).then(setNearest) }, [click])

  const markers: Marker[] = useMemo(() => [
    ...cities.map(c => ({ lat: c.lat, lon: c.lng, radius: Math.max(3, Math.sqrt(c.population) / 160), color: '#0891b2',
      label: `${c.city}, ${c.state_id} · ${n(c.population)}` })),
    ...(click ? [{ lat: click.lat, lon: click.lng, radius: 6, color: '#111827', label: 'You clicked here' }] : []),
    ...(nearest ? [{ lat: nearest.city.lat, lon: nearest.city.lng, radius: 9, color: '#dc2626', label: `Nearest: ${nearest.city.name}` }] : []),
  ], [cities, click, nearest])
  const path = click && nearest ? [[click.lat, click.lng], [nearest.city.lat, nearest.city.lng]] as [number, number][] : undefined
  const buckets = Object.entries(dist).map(([k, v]) => ({ k, count: v.length })).filter(b => b.count)
  const bmax = Math.max(1, ...buckets.map(b => b.count))

  return (
    <div className="page">
      <header>
        <div><h1>🗺️ US City Explorer</h1><div className="hint">Express + PostgreSQL API · React + Leaflet</div></div>
        <div className="badges">
          <span className={`badge ${health ? 'ok' : 'bad'}`}>{health ? `PostgreSQL · ${n(health.cities)} cities · ${health.states} states` : 'API down'}</span>
          {health && <span className="badge info">Data: {health.source}</span>}
        </div>
      </header>

      <section className="card controls">
        <label>City starts with <input value={q} onChange={e => setQ(e.target.value)} placeholder="San" /></label>
        <label>State <select value={st} onChange={e => setSt(e.target.value)}><option value="">All</option>{[...states].sort((a, b) => a.id.localeCompare(b.id)).map(s => <option key={s.id} value={s.id}>{s.id} · {s.state}</option>)}</select></label>
        <label>Min population <select value={minPop} onChange={e => setMinPop(+e.target.value)}>{[0, 50000, 100000, 250000, 500000, 1000000].map(v => <option key={v} value={v}>{n(v)}</option>)}</select></label>
        <span className="hint">{cities.length} cities shown (max 300) · click anywhere on the map to find the nearest city</span>
      </section>

      <div className="cols2">
        <section className="card">
          <ClickableMap markers={markers} path={path} onClick={setClick} />
          {nearest && click && <div className="nearest">📍 ({click.lat.toFixed(3)}, {click.lng.toFixed(3)}) → nearest city <b>{nearest.city.name}, {nearest.city.state_id}</b> · {nearest.distance.toFixed(1)} km · pop. {n(nearest.city.population)} <code>GET /city/find</code></div>}
        </section>
        <section className="card scroll">
          <table><thead><tr><th>City</th><th>State</th><th>Population</th><th>Time zone</th></tr></thead>
            <tbody>{cities.slice(0, 60).map(c => <tr key={c.id}><td>{c.city}</td><td>{c.state_id}</td><td className="num">{n(c.population)}</td><td className="hint">{c.timezone}</td></tr>)}</tbody></table>
        </section>
      </div>

      <div className="cols3">
        <section className="card scroll">
          <h3>States <span className="hint">totals over cities ≥15k in the dataset</span></h3>
          <table><thead><tr><th>State</th><th>Cities</th><th>City pop.</th><th>Largest</th></tr></thead>
            <tbody>{states.slice(0, 20).map(s => <tr key={s.id} className="click" onClick={() => setSt(s.id)}><td>{s.state}</td><td className="num">{s.cities}</td><td className="num">{n(s.city_population)}</td><td>{s.largest_city}</td></tr>)}</tbody></table>
        </section>
        <section className="card">
          <h3>Population distribution <span className="hint">GET /city/population, 250k buckets, log scale</span></h3>
          {buckets.map(b => <div key={b.k} className="bar"><span>{b.k.split(' - ').map(x => n(+x / 1000) + 'k').join('–')}</span>
            <div style={{ width: `${Math.log10(b.count + 1) / Math.log10(bmax + 1) * 100}%` }} /><b>{b.count}</b></div>)}
        </section>
        <section className="card">
          <h3>Time zones now <span className="hint">GET /time · local time · cities</span></h3>
          <table><tbody>{zones.map(z => <tr key={z.name}><td title={z.name}>{z.name.replace(/^America\//, "").replace(/_/g, " ")}</td><td className="num"><b>{z.time.slice(11, 16)}</b></td><td className="hint">UTC{z.utc_offset}</td><td className="num hint">{z.cities}</td></tr>)}</tbody></table>
        </section>
      </div>
      <footer className="hint">City data © <a href="https://www.geonames.org">GeoNames</a>, CC BY 4.0. Map tiles © OpenStreetMap contributors.</footer>
    </div>
  )
}

function ClickableMap({ markers, path, onClick }: { markers: Marker[]; path?: [number, number][]; onClick: (p: { lat: number; lng: number }) => void }) {
  useEffect(() => {
    const el = document.querySelector('.map') as (HTMLElement & { _leaflet_map?: L.Map }) | null
    const m = el?._leaflet_map
    if (!m) return
    const h = (e: L.LeafletMouseEvent) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    m.on('click', h)
    return () => { m.off('click', h) }
  })
  return <MapView markers={markers} path={path} />
}
