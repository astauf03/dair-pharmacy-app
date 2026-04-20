import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import '../components/mappage.css'
import NavBar from '../components/NavBar'
import MapSidebar from '../components/MapSidebar'



mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function MapPage() {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return
    if (!mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',  // light basemap for dashboard
      center: [28.0, -29.0],
      zoom: 5,
      interactive: true,                           // users can pan and zoom
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    // Wait for the map to load before adding sources/layers
    map.current.on('load', () => {
      console.log('Map loaded!')
      // You can add any default sources/layers here if needed
      map.current.addSource('gauteng-wards', {
        type: 'geojson',
        data: '/data/gauteng.geojson',
      })
      
      // Fill layer for Gauteng wards
      map.current.addLayer({
        id: 'gauteng-fill',
        type: 'fill',
        source: 'gauteng-wards',
        paint: {
          'fill-color': '#002395',
          'fill-opacity': 0.5
        }
      })
      
      // Outline layer for Gauteng wards
      map.current.addLayer({
        id: 'gauteng-lines',
        type: 'line',
        source: 'gauteng-wards',
        paint: {
          'line-color': '#020b25',
          'line-width': 0.8,
          'line-opacity': 0.6,
        },
      })


      // KZN source and layers
      map.current.addSource('kzn-wards', {
        type: 'geojson',
        data: '/data/KZN.geojson',
      })

      // Fill layer for KZN wards
      map.current.addLayer({
        id: 'kzn-wards',
        type: 'fill',
        source: 'kzn-wards',
        paint: {
          'fill-color': '#ebc159',
          'fill-opacity': 0.5
        }
      })

      // Outline layer for KZN wards
      map.current.addLayer({
        id: 'kzn-lines',
        type: 'line',
        source: 'kzn-wards',
        paint: {
          'line-color': '#4e401a',
          'line-width': 0.8,
          'line-opacity': 0.6,
        },
      })
    }) //emd map.on ('load')
    
    map.current.on('error', (e) => {
      console.error('Mapbox error:', e)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="map-page">
      <NavBar />
      <div className="map-container">
        <MapSidebar />
        <div className="map-area" ref={mapContainer} />
      </div>
    </div>

  )
}

export default MapPage