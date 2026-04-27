import { useEffect, useRef } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import '../components/mappage.css'
import NavBar from '../components/NavBar'
import MapSidebar from '../components/MapSidebar'

function MapPage() {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return
    if (!mapContainer.current) return

    

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [28.0, -29.0],
      zoom: 5,
      interactive: true,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    map.current.on('load', () => {

      // --- Gauteng wards ---
      map.current.addSource('gauteng-sal', {
        type: 'geojson',
        data: '/data/gauteng.geojson',
      })

      map.current.addLayer({
        id: 'gauteng-fill',
        type: 'fill',
        source: 'gauteng-wards',
        paint: {
          'fill-color': '#002395',
          'fill-opacity': 0.5,
        },
      })

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

      // --- KZN wards ---
      map.current.addSource('kzn-sal', {
        type: 'geojson',
        data: '/data/KZN.geojson',
      })

      map.current.addLayer({
        id: 'kzn-fill',
        type: 'fill',
        source: 'kzn-sal',
        paint: {
          'fill-color': '#ebc159',
          'fill-opacity': 0.5,
        },
      })

      map.current.addLayer({
        id: 'kzn-lines',
        type: 'line',
        source: 'kzn-sal',
        paint: {
          'line-color': '#4e401a',
          'line-width': 0.8,
          'line-opacity': 0.6,
        },
      })

      // --- Pharmacies ---
      map.current.addSource('pharmacies', {
        type: 'geojson',
        data: '/data/PHARMACIES_MASTER_FINAL.geojson',
      })

      map.current.addLayer({
        id: 'pharmacy-dots',
        type: 'circle',
        source: 'pharmacies',
        paint: {
          'circle-radius': 6,
          'circle-color': '#007A4D',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      map.current.on('click', 'pharmacy-dots', (e) => {
        const props = e.features[0].properties

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <strong>${props.MATCHED_NAME || props.NAME}</strong><br/>
            ${props.ADDRESS}<br/>
            <span style="color: #007A4D; font-size: 12px;">${props.STATUS}</span>
          `)
          .addTo(map.current)
      })

      map.current.on('mouseenter', 'pharmacy-dots', () => {
        map.current.getCanvas().style.cursor = 'pointer'
      })

      map.current.on('mouseleave', 'pharmacy-dots', () => {
        map.current.getCanvas().style.cursor = ''
      })

    }) // end map.on('load')

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

  // Add this function inside MapPage(), after the useEffect
function handleLayerToggle(layerId, isOn) {
  if (!map.current) return
  map.current.setLayoutProperty(
    layerId,
    'visibility',
    isOn ? 'visible' : 'none'
  )
}

  return (
    <div className="map-page">
      <NavBar />
      <div className="map-container">
        <MapSidebar onLayerToggle={handleLayerToggle} />
        <div className="map-area" ref={mapContainer} />
      </div>
    </div>
  )
}

export default MapPage