import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './n5.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function N5() {
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
          'fill-color': '#97c93b',
          'fill-opacity': 0            // hidden at first
        }
      })
      map.current.addLayer({
        id: 'kzn-outline',
        type: 'line',
        source: 'kzn',
        paint: {
          'line-color': '#97c93b',
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
    <section className="n5">

      <div className="n5__intro">
        <span className="n5__eyebrow">Who Is Left Out?</span>
        <h2 className="n5__title">Gauteng Pharmacy Name, Neighborhood</h2>
        <p className="n5__body">
          Expand on the story of apartheid, accessibility, and how a person accessing
          this selected pharmacy in Gauteng might experience
          challenges (or, not challenges because of city life). What can the reader takeaway?
        </p>
      </div>

      {/* Single map — Scrollama will control flyTo and layer visibility */}
      <div className="n5__map" ref={mapContainer} />

      <div className="n5__purpose">
        <span className="n5__eyebrow">Who Is Left Out?</span>
        <h2 className="n5__title">KwaZulu-Natal Pharmacy Name, Neighborhood</h2>
        <p className="n5__body">
          Expand on story of apartheid, accessibility, and how a person accessing this selected 
          pharmacy in KZN.. so think of internet access, transportation, etc. What can the reader takeaway?
          Oh my god. Plz kill me. This is the most important part of the story. This is where we can really drive home the point about access and equity.
        </p>
      </div>

    </section>
  )
}

export default N5
