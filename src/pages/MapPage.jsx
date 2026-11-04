import { useEffect, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import '../components/mappage.css'
import NavBar from '../components/NavBar'
import MapSidebar from '../components/MapSidebar'
import Footer from '../components/Footer'
import { PHARMACY_DOT_PAINT } from '../constants/mapStyles'
import {
  WALK_TYPOLOGY_COLOR,
  DRIVE_TYPOLOGY_COLOR,
  WALK_DIST_K1_COLOR,
  WALK_DIST_K3_COLOR,
  EXCEEDS_WALK_COLOR,
  EXCEEDS_WALK_OPACITY,
  SNAP_FLAG_COLOR,
  SNAP_FLAG_OPACITY,
  SETTLEMENT_TYPE_COLOR,
  PCT_BLACK_COLOR,
  POP_DENSITY_COLOR,
  WEALTH_CLASS_COLOR,
  TRANSPORT_GAP_COLOR,
  TRANSPORT_GAP_OPACITY,
  CHOROPLETH_OPACITY,
} from '../constants/layerExpressions'
import {
  TILE_SOURCE_LAYER,
  isBeyondThreshold,
  settlementTypeOf,
} from '../constants/dataContract'

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

      const tilesetId = import.meta.env.VITE_MAPBOX_TILESET

      // ── Sources ────────────────────────────────────────────────
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

      if (tilesetId) {
        map.current.addSource('SA-access', {
          type: 'vector',
          url:  `mapbox://${tilesetId}`,
        })

        // ── Access layers (radio group — only one visible at a time) ──

        map.current.addLayer({
          id:           'walk-typology',
          type:         'fill',
          source:       'SA-access',
          'source-layer': TILE_SOURCE_LAYER,
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
          'source-layer': TILE_SOURCE_LAYER,
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
          'source-layer': TILE_SOURCE_LAYER,
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
          'source-layer': TILE_SOURCE_LAYER,
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
          'source-layer': TILE_SOURCE_LAYER,
          layout:       { visibility: 'none' },
          paint:        {
            'fill-color':   SETTLEMENT_TYPE_COLOR,
            'fill-opacity': 0.8,
          },
        })

        map.current.addLayer({
          id:           'pct-black-african',
          type:         'fill',
          source:       'SA-access',
          'source-layer': TILE_SOURCE_LAYER,
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
          'source-layer': TILE_SOURCE_LAYER,
          layout:       { visibility: 'none' },
          paint:        {
            'fill-color':   WEALTH_CLASS_COLOR,
            'fill-opacity': 0.7,
          },
        })

        map.current.addLayer({
          id:           'pop-density',
          type:         'fill',
          source:       'SA-access',
          'source-layer': TILE_SOURCE_LAYER,
          layout:       { visibility: 'none' },
          paint:        {
            'fill-color':   POP_DENSITY_COLOR,
            'fill-opacity': 0.65,
          },
        })

        // ── Overlay fills (stack on top of access/context) ─────────

        // Binary pharmacy desert — beyond the 3 km walk threshold
        map.current.addLayer({
          id:           'exceeds-walk-3km',
          type:         'fill',
          source:       'SA-access',
          'source-layer': TILE_SOURCE_LAYER,
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
          'source-layer': TILE_SOURCE_LAYER,
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
          'source-layer': TILE_SOURCE_LAYER,
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
          'source-layer': TILE_SOURCE_LAYER,
          paint:        {
            'line-color':   '#ffffff',
            'line-opacity': 0.55,
            'line-width':   [
              'interpolate', ['linear'], ['zoom'],
              6,  0.15,
              10, 0.45,
              13, 0.8,
            ],
          },
        })
      } else {
        console.error('VITE_MAPBOX_TILESET is not set; skipping the SAL vector tileset layers.')
      }

      // ── Pharmacy dots — always on top ─────────────────────────
      map.current.addLayer({
        id:     'pharmacy-dots',
        type:   'circle',
        source: 'pharmacies',
        layout: { visibility: 'visible' },
        paint: PHARMACY_DOT_PAINT,
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

      // ── Dynamic stats on moveend ───────────────────────────────
      if (tilesetId) {
        map.current.on('moveend', () => {
          const pharmacyFeatures = map.current.queryRenderedFeatures({ layers: ['pharmacy-dots'] })
          const salFeatures = map.current.queryRenderedFeatures({ layers: ['sal-outline'] })
          const salById = new Map()

          salFeatures.forEach(feature => {
            const salId = feature.properties?.EA_CODE ?? feature.id
            if (salId != null) salById.set(String(salId), feature.properties)
          })

          const visibleSals = [...salById.values()]
          let totalPopulation = 0
          let townshipPopulation = 0
          let beyondWalkPopulation = 0
          let beyondDrivePopulation = 0
          let beyondWalkCount = 0
          let beyondDriveCount = 0

          visibleSals.forEach(properties => {
            const population = Number(properties.pop2023est)
            const hasPopulation = properties.pop2023est != null
              && Number.isFinite(population)
              && population > 0
            const beyondWalk = isBeyondThreshold(properties.wlk_k1_km, 'walk')
            const beyondDrive = isBeyondThreshold(properties.drv_k1_km, 'drive')

            if (hasPopulation) {
              totalPopulation += population
              if (settlementTypeOf(properties.EA_TYPE) === 'Township') {
                townshipPopulation += population
              }
              if (beyondWalk) beyondWalkPopulation += population
              if (beyondDrive) beyondDrivePopulation += population
            }
            if (beyondWalk) beyondWalkCount += 1
            if (beyondDrive) beyondDriveCount += 1
          })

          const populationShare = population => totalPopulation > 0
            ? `${Math.round((population / totalPopulation) * 100)}% of Viewport Population`
            : 'Population Unavailable'

          setDynamicStats([
            {
              label: 'Pharmacies in View',
              value: pharmacyFeatures.length.toLocaleString(),
              subtext: 'Points in Viewport',
            },
            {
              label: 'Township Population',
              value: totalPopulation > 0
                ? `${Math.round((townshipPopulation / totalPopulation) * 100)}%`
                : '–',
              subtext: 'Of Visible SAL Population',
            },
            {
              label: 'SALs Beyond 3 km Walk',
              value: beyondWalkCount.toLocaleString(),
              subtext: populationShare(beyondWalkPopulation),
            },
            {
              label: 'SALs Beyond 10 km Drive',
              value: beyondDriveCount.toLocaleString(),
              subtext: populationShare(beyondDrivePopulation),
            },
          ])
        })
      }
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
      <Footer />
    </div>
  )
}

export default MapPage