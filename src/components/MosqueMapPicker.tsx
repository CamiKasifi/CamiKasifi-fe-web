'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Circle, LeafletMouseEvent, Map as LeafletMap, Marker } from 'leaflet'
import { LocateFixed, Search } from 'lucide-react'
import { Button, Input, Spinner } from './ui'

interface Props {
  latitude: number
  longitude: number
  radius: number
  onChange: (next: { latitude: number; longitude: number }) => void
}

const DEFAULT_VIEW = { lat: 41.0082, lng: 28.9784, zoom: 11 }

export function MosqueMapPicker({
  latitude,
  longitude,
  radius,
  onChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const circleRef = useRef<Circle | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)

  const [ready, setReady] = useState(false)
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    let map: LeafletMap | null = null

    void (async () => {
      const L = await import('leaflet')
      if (cancelled || !containerRef.current) return
      LRef.current = L

      const hasInitial =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        (latitude !== 0 || longitude !== 0)
      const center = hasInitial
        ? { lat: latitude, lng: longitude }
        : { lat: DEFAULT_VIEW.lat, lng: DEFAULT_VIEW.lng }
      const zoom = hasInitial ? 16 : DEFAULT_VIEW.zoom

      map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([center.lat, center.lng], zoom)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const icon = L.divIcon({
        className: 'mosque-marker',
        html:
          '<div style="width:18px;height:18px;border-radius:9999px;background:#047857;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })

      if (hasInitial) {
        markerRef.current = L.marker([center.lat, center.lng], {
          icon,
          draggable: true,
        }).addTo(map)
        circleRef.current = L.circle([center.lat, center.lng], {
          radius,
          color: '#047857',
          weight: 1.5,
          fillColor: '#047857',
          fillOpacity: 0.12,
        }).addTo(map)

        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng()
          onChange({ latitude: pos.lat, longitude: pos.lng })
        })
      }

      map.on('click', (e: LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        upsertMarker(L, lat, lng)
        onChange({ latitude: lat, longitude: lng })
      })

      setReady(true)
    })()

    return () => {
      cancelled = true
      if (map) {
        map.remove()
      }
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const upsertMarker = (
    L: typeof import('leaflet'),
    lat: number,
    lng: number,
  ) => {
    if (!mapRef.current) return
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const icon = L.divIcon({
        className: 'mosque-marker',
        html:
          '<div style="width:18px;height:18px;border-radius:9999px;background:#047857;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })
      markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(
        mapRef.current,
      )
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng()
        onChange({ latitude: pos.lat, longitude: pos.lng })
      })
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng])
    } else {
      circleRef.current = L.circle([lat, lng], {
        radius,
        color: '#047857',
        weight: 1.5,
        fillColor: '#047857',
        fillOpacity: 0.12,
      }).addTo(mapRef.current)
    }
  }

  useEffect(() => {
    if (!ready || !LRef.current) return
    const L = LRef.current
    const hasPoint =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      (latitude !== 0 || longitude !== 0)
    if (!hasPoint) return
    upsertMarker(L, latitude, longitude)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, latitude, longitude])

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius)
    }
  }, [radius])

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Tarayıcı konum servisini desteklemiyor.')
      return
    }
    setLocating(true)
    setStatus(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: la, longitude: ln } = pos.coords
        onChange({ latitude: la, longitude: ln })
        if (mapRef.current) mapRef.current.setView([la, ln], 17)
        setLocating(false)
      },
      (err) => {
        setStatus(err.message || 'Konum alınamadı.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q.length < 3) {
      setStatus('Aramak için en az 3 karakter gir.')
      return
    }
    setSearching(true)
    setStatus(null)
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '1')
      url.searchParams.set('q', q)
      url.searchParams.set('countrycodes', 'tr')
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`Arama başarısız (${res.status})`)
      const json = (await res.json()) as Array<{
        lat: string
        lon: string
        display_name: string
      }>
      if (json.length === 0) {
        setStatus('Sonuç bulunamadı.')
        return
      }
      const lat = parseFloat(json[0].lat)
      const lng = parseFloat(json[0].lon)
      onChange({ latitude: lat, longitude: lng })
      if (mapRef.current) mapRef.current.setView([lat, lng], 17)
      setStatus(json[0].display_name)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Arama başarısız.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={search} className="flex gap-2">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Adres ara (örn: Körfez Cami, Kocaeli)"
          aria-label="Adres ara"
        />
        <Button type="submit" variant="secondary" loading={searching}>
          <Search className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={useMyLocation}
          loading={locating}
          aria-label="Konumumu kullan"
        >
          <LocateFixed className="h-4 w-4" />
        </Button>
      </form>

      <div className="relative h-64 w-full overflow-hidden rounded-md border border-border">
        <div ref={containerRef} className="h-full w-full" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/40 text-xs text-muted-foreground">
            <Spinner className="mr-2 h-4 w-4" /> Harita yükleniyor…
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-mono text-muted-foreground">
          {Number.isFinite(latitude) && Number.isFinite(longitude)
            ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            : '—'}
        </span>
        {status && (
          <span className="truncate text-muted-foreground">{status}</span>
        )}
      </div>
    </div>
  )
}
