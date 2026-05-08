import { useEffect, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import '../components/mappage.css'
import NavBar from '../components/NavBar'
import MapSidebar from '../components/MapSidebar'
import {
  WALK_TYPOLOGY_COLOR,
  DRIVE_TYPOLOGY_COLOR,
  WALK_DIST_K1_COLOR,
  WALK_DIST_K3_COLOR,
  EXCEEDS_WALK_COLOR,
  EXCEEDS_WALK_OPACITY,
  SNAP_FLAG_COLOR,
  SNAP_FLAG_OPACITY,
  EA_TYPE_COLOR,
  PCT_BLACK_COLOR,
  POP_DENSITY_COLOR,
  ECON_STATUS_COLOR,
  TRANSPORT_GAP_COLOR,
  TRANSPORT_GAP_OPACITY,
  CHOROPLETH_OPACITY,
} from '../constants/layerExpressions'

const BASE = import.meta.env.BASE_URL || '/'

// ─────────────────────────────────────────────
// Layer insertion order matters in Mapbox.
// Bottom → top:
//   sa (neutral fill)
//   walk-typology / walk-dist-k1 / walk-dist-k3 / drive-typology  (choropleth base)
//   ea-type / pct-black-african / econ-status / pop-density        (context)
//   exceeds-walk-3km / transport-gap                               (overlay fills)
//   walk-snap-flag                                                  (uncertainty wash — always on top of fills)
//   sal-outline                                                     (lines above fills)
//   pharmacy-dots                                                   (points always on top)
// ─────────────────────────────────────────────

function MapPage() {
  const mapContainer = useRef(null)
  const map          = useRef(null)
  const [dynamicStats, setDynamicStats] = useState(null)

  // ── Layer toggle handler — called by MapSidebar ──────────────────
  function handleLayerToggle(layerId, isOn) {
    if (!map.current) return
    map.current.setLayoutProperty(layerId, 'visibility', isOn ? 'visible' : 'none')
  }

  // ── Map init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (map.current) return
    if (!mapContainer.current) return

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container:         mapContainer.current,
      style:             'mapbox://styles/mapbox/standard',
      center:            [29.37703, -27.17729],
      zoom:              6,
      interactive:       true,
      prefetchZoomDelta: 6,
      projection:        'mercator',
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    map.current.on('load', () => {
      map.current.setFog(null)

      // ── Sources ────────────────────────────────────────────────
      map.current.addSource('SA-access', {
        type: 'vector',
        url:  'mapbox://astauf03.pharm_access_tileset',
      })

      map.current.addSource('south-africa', {
        type: 'geojson',
        data: `${BASE}data/south_africa.geojson`,
      })

      map.current.addSource('pharmacies', {
        type: 'geojson',
        data: `${BASE}data/pharmacies.geojson`,
      })

      // ── SA neutral base fill ───────────────────────────────────
      map.current.addLayer({
        id:     'sa-base',
        type:   'fill',
        source: 'south-africa',
        paint:  {
          'fill-color':   '#C8B89A',
          'fill-opacity': 0.15,
        },
      })

      // ── Access layers (radio group — only one visible at a time) ──

      map.current.addLayer({
        id:           'walk-typology',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'visible' },
        paint:        {
          'fill-color':   WALK_TYPOLOGY_COLOR,
          'fill-opacity': CHOROPLETH_OPACITY,
        },
      })

      map.current.addLayer({
        id:           'walk-dist-k1',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   WALK_DIST_K1_COLOR,
          'fill-opacity': CHOROPLETH_OPACITY,
        },
      })

      map.current.addLayer({
        id:           'walk-dist-k3',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   WALK_DIST_K3_COLOR,
          'fill-opacity': CHOROPLETH_OPACITY,
        },
      })

      map.current.addLayer({
        id:           'drive-typology',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   DRIVE_TYPOLOGY_COLOR,
          'fill-opacity': CHOROPLETH_OPACITY,
        },
      })

      // ── Context layers ─────────────────────────────────────────

      map.current.addLayer({
        id:           'ea-type',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   EA_TYPE_COLOR,
          'fill-opacity': 0.8,
        },
      })

      map.current.addLayer({
        id:           'pct-black-african',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   PCT_BLACK_COLOR,
          'fill-opacity': 0.75,
        },
      })

      map.current.addLayer({
        id:           'econ-status',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   ECON_STATUS_COLOR,
          'fill-opacity': 0.7,
        },
      })

      map.current.addLayer({
        id:           'pop-density',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   POP_DENSITY_COLOR,
          'fill-opacity': 0.65,
        },
      })

      // ── Overlay fills (stack on top of access/context) ─────────

      // Binary pharmacy desert — 'True'/'False' strings from CSV
      map.current.addLayer({
        id:           'exceeds-walk-3km',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   EXCEEDS_WALK_COLOR,
          'fill-opacity': EXCEEDS_WALK_OPACITY,
        },
      })

      // Transport gap bivariate (walk desert vs drive served)
      map.current.addLayer({
        id:           'transport-gap',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   TRANSPORT_GAP_COLOR,
          'fill-opacity': TRANSPORT_GAP_OPACITY,
        },
      })

      // Data uncertainty wash — sits above all fills, below outlines
      // Transparent where data is clean, orange where snap > 500m
      map.current.addLayer({
        id:           'walk-snap-flag',
        type:         'fill',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        layout:       { visibility: 'none' },
        paint:        {
          'fill-color':   SNAP_FLAG_COLOR,
          'fill-opacity': SNAP_FLAG_OPACITY,
        },
      })

      // ── SAL outlines — above all fills ────────────────────────
      map.current.addLayer({
        id:           'sal-outline',
        type:         'line',
        source:       'SA-access',
        'source-layer': 'dair_sal',
        paint:        {
          'line-color':   '#C8B89A',
          'line-opacity': 0.4,
          'line-width':   [
            'interpolate', ['linear'], ['zoom'],
            6,  0.1,
            10, 0.4,
            13, 0.8,
          ],
        },
      })

      // ── Pharmacy dots — always on top ─────────────────────────
      map.current.addLayer({
        id:     'pharmacy-dots',
        type:   'circle',
        source: 'pharmacies',
        layout: { visibility: 'visible' },
        paint:  {
          'circle-radius':       4,
          'circle-color':        '#007A4D',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      // ── Pharmacy popup ─────────────────────────────────────────
      map.current.on('click', 'pharmacy-dots', (e) => {
        const props = e.features[0].properties
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <strong>${props.MATCHED_NAME || props.NAME || 'Pharmacy'}</strong><br/>
            ${props.ADDRESS || ''}
          `)
          .addTo(map.current)
      })
      map.current.on('mouseenter', 'pharmacy-dots', () => {
        map.current.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', 'pharmacy-dots', () => {
        map.current.getCanvas().style.cursor = ''
      })

      // ── SAL click — log properties for debugging ──────────────
      map.current.on('click', 'walk-typology', (e) => {
        if (e.features.length > 0) console.log(e.features[0].properties)
      })

      // ── Dynamic stats on moveend ───────────────────────────────
      // Uses walk_rank (0–1) and walk_typol — both confirmed in tile
      map.current.on('moveend', () => {
        const pharmacyFeatures = map.current.queryRenderedFeatures({ layers: ['pharmacy-dots'] })
        const salFeatures      = map.current.queryRenderedFeatures({ layers: ['walk-typology'] })

        const pharmacyCount = pharmacyFeatures.length

        const desertCount = salFeatures.filter(
          f => f.properties['walk_typol'] === 'Pharmacy desert'
        ).length

        const pctDesert = salFeatures.length > 0
          ? Math.round((desertCount / salFeatures.length) * 100)
          : 0

        const rankVals = salFeatures
          .map(f => f.properties['walk_rank'])
          .filter(v => v != null && !isNaN(v))

        const avgRank = rankVals.length > 0
          ? (rankVals.reduce((s, v) => s + v, 0) / rankVals.length).toFixed(2)
          : '–'

        setDynamicStats([
          {
            label:   'Pharmacies',
            value:   pharmacyCount.toLocaleString(),
            subtext: 'visible in viewport',
          },
          {
            label:   'Pharmacy deserts',
            value:   `${pctDesert}%`,
            subtext: 'of SALs in viewport',
          },
          {
            label:   'Avg walk rank',
            value:   avgRank,
            subtext: 'normalised 0–1',
          },
        ])
      })
    })

    map.current.on('error', (e) => console.error('Mapbox error:', e))

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
        <MapSidebar
          onLayerToggle={handleLayerToggle}
          mapRef={map}
          dynamicStats={dynamicStats}
        />
        <div className="map-area" ref={mapContainer} />
      </div>
    </div>
  )
}

export default MapPage