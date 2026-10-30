import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type Marker = { lat: number; lon: number; label: string; color?: string; radius?: number; onClick?: () => void }

export default function MapView({ markers, path }: { markers: Marker[]; path?: [number, number][] }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  useEffect(() => {
    if (!el.current || map.current) return
    map.current = L.map(el.current).setView([38.6, -96.5], 4)
    ;(el.current as HTMLDivElement & { _leaflet_map?: L.Map })._leaflet_map = map.current
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
  }, [])
  useEffect(() => {
    const g = layer.current, m = map.current
    if (!g || !m) return
    g.clearLayers()
    if (path && path.length > 1) L.polyline(path, { color: '#4f46e5', weight: 3, opacity: .7, dashArray: '6 6' }).addTo(g)
    markers.forEach(mk => {
      const c = L.circleMarker([mk.lat, mk.lon], { radius: mk.radius ?? 7, color: 'white', weight: 1.5, fillColor: mk.color ?? '#4f46e5', fillOpacity: .9 })
        .bindTooltip(mk.label).addTo(g)
      if (mk.onClick) c.on('click', mk.onClick)
    })
  }, [markers, path])
  return <div ref={el} className="map" />
}
