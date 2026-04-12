import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import NavBar from '../components/NavBar'
import MapSidebar from '../components/MapSidebar'
import Footer from '../components/Footer'


mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function MapPage() {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return
    if (!mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',  // light basemap for dashboard
      center: [28.0, -29.0],
      zoom: 5,
      interactive: true,                           // users can pan and zoom
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

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
      <Footer />
    </div>
  )
}

export default MapPage