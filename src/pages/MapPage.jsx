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
      projection: 'mercator'
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

map.current.on('load', () => {
  const style = map.current.getStyle()
  console.log('all sources:', Object.keys(style.sources))
  map.current.setFog(null)


  // --- Choropleth tileset (add FIRST so it renders below SA outline) ---
  map.current.addSource('SA-access', {
    type: 'vector',
    url: 'mapbox://astauf03.4k4npw04'
  });

  map.current.addLayer({
    id: 'walk',
    type: 'fill',
    source: 'SA-access',
    'source-layer': 'all_access_4_27_26-11skzg',
    layout: { visibility: 'visible' },
    paint: {
      'fill-color': [
        'step', ['get', 'Walking Access Index'],
        '#002395',
        0.01, '#1a4fa8',
        0.5,  '#4a80c4',
        1.0,  '#c8d8e8',
        3.0,  '#ebc159',
        10.0, '#e7c477'
      ],
      'fill-opacity': 0.75
    }
  });

map.current.on('click', (e) => {
  const features = map.current.queryRenderedFeatures(e.point, { layers: ['walk'] });
  if (features.length > 0) {
    console.log(features[0].properties);
  }
});

  map.current.addLayer({
    id: 'drive',
    type: 'fill',
    source: 'SA-access',
    'source-layer': 'all_access_4_27_26-11skzg',
    layout: { visibility: 'none' },
    paint: {
      'fill-color': [
        'step', ['get', 'Driving Access Index'],
        '#002395',
        0.01, '#1a4fa8',
        0.5,  '#4a80c4',
        1.0,  '#c8d8e8',
        3.0,  '#ebc159',
        10.0, '#d4a030'
      ],
      'fill-opacity': 0.75
    }
  });

  map.current.on('click', 'walk', (e) => {
    console.log(e.features[0].properties);
  });

  // --- SA outline (neutral base) - added AFTER choropleth so it renders on top ---
  map.current.addSource('south_africa', {
    type: 'geojson',
    data: '/data/south_africa.geojson'
  });

  map.current.addLayer({
    id: 'sa',
    type: 'fill',
    source: 'south_africa',
    paint: {
      'fill-color': '#C8B89A',
      'fill-opacity': 0.25
    }
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
      `)
      .addTo(map.current)
  })
  map.current.on('mouseenter', 'pharmacy-dots', () => {
    map.current.getCanvas().style.cursor = 'pointer'
  })
  map.current.on('mouseleave', 'pharmacy-dots', () => {
    map.current.getCanvas().style.cursor = ''
  })

    map.current.on('click', (e) => {
    const features = map.current.queryRenderedFeatures(e.point, { layers: ['walk'] });
    console.log(features);
  });
});

// end map.on('load')

map.current.on('error', (e) => console.log(e));

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