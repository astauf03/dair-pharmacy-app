import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './n2.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function N2() {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return
    if (!mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [28.0, -29.0],
      zoom: 3.8,
      interactive: false,
    })

    map.current.on('load', () => {
      // load Gauteng
      map.current.addSource('gauteng', {
        type: 'geojson',
        data: '/data/gauteng.geojson'
      })
      map.current.addLayer({
        id: 'gauteng-fill',
        type: 'fill',
        source: 'gauteng',
        paint: {
          'fill-color': '#002395',
          'fill-opacity': 0,           // hidden at first, Scrollama will reveal
        }
      })
      map.current.addLayer({
        id: 'gauteng-outline',
        type: 'line',
        source: 'gauteng',
        paint: {
          'line-color': '#002395',
          'line-width': 1.5,
          'line-opacity': 0            // hidden at first
        }
      })

      // load KZN
      map.current.addSource('kzn', {
        type: 'geojson',
        data: '/data/KZN.geojson'
      })
      map.current.addLayer({
        id: 'kzn-fill',
        type: 'fill',
        source: 'kzn',
        paint: {
          'fill-color': '#002395',
          'fill-opacity': 0            // hidden at first
        }
      })
      map.current.addLayer({
        id: 'kzn-outline',
        type: 'line',
        source: 'kzn',
        paint: {
          'line-color': '#002395',
          'line-width': 1.5,
          'line-opacity': 0            // hidden at first
        }
      })
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <section className="n2">

      <div className="n2__intro">
        <span className="n2__eyebrow">Spatial Orientation</span>
        <h2 className="n2__title">Situating the Study Area</h2>
        <p className="n2__body">
          This project focuses on two provinces — Gauteng and KwaZulu-Natal — 
          chosen as pilot areas for understanding pharmacy access across 
          vastly different urban and rural geographies.
        </p>
      </div>

      {/* Single map — Scrollama will control flyTo and layer visibility */}
      <div className="n2__map" ref={mapContainer} />

      <div className="n2__purpose">
        <span className="n2__eyebrow">The Two Provinces</span>
        <h2 className="n2__title">Gauteng + KwaZulu-Natal</h2>
        <p className="n2__body">
          Gauteng is South Africa's smallest but most densely populated province, 
          home to Johannesburg and Pretoria. KwaZulu-Natal stretches along the 
          eastern coast — more rural, more dispersed, and facing a different 
          set of access challenges entirely.
        </p>
      </div>

    </section>
  )
}

export default N2