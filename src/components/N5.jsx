import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import StepCard from './StepCard'
import './n5.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const LEFT_MAP_DEFAULT = {
  center: [28.08674, -26.08381],
  zoom: 2,
  label: 'Gauteng',
}

const RIGHT_MAP_DEFAULT = {
  center: [30.959, -29.708],
  zoom: 2,
  label: 'KwaMashu · Durban',
}

const STEPS = [
  {
    eyebrow: 'Return to Provinces',
    heading: 'Gauteng and KwaZulu-Natal Neighborhoods',
    body: 'Neighborhood types for KZN and Gauteng side-by-side.',
    leftFly:  { center: [28.08674, -26.08381], zoom: 8 },
    rightFly: { center: [30.959,   -29.708],   zoom: 9 },
    showEAType:     true,
    showPharmacies: false,
    showAccess:     false,
  },
  {
    eyebrow: 'Return to Provinces',
    heading: 'Pharmacies + Neighborhoods, KZN and Gauteng side-by-side.',
    body: 'Neighborhood typologies plus pharmacy points overlaid on both maps.',
    leftFly:  { center: [28.08674, -26.08381], zoom: 8 },
    rightFly: { center: [30.959,   -29.708],   zoom: 9 },
    showEAType:     true,
    showPharmacies: true,
    showAccess:     false,
  },
  {
    eyebrow: 'Return to Provinces',
    heading: 'What access looks like here?',
    body: 'Neighborhood types, pharmacy locations, and access choropleth appear together.',
    leftFly:  { center: [28.08674, -26.08381], zoom: 8 },
    rightFly: { center: [30.959,   -29.708],   zoom: 9 },
    showEAType:     true,
    showPharmacies: true,
    showAccess: true,
  },
]

const LEFT_GEOJSON = '/data/gauteng_boundary.geojson'
const RIGHT_GEOJSON = '/data/KZN_boundary.geojson'
const PHARMACY_GEOJSON = '/data/pharmacies.geojson'

export default function N5() {
  const mapLeftContainer = useRef(null)
  const mapRightContainer = useRef(null)
  const mapLeft = useRef(null)
  const mapRight = useRef(null)
  const loadedCount = useRef(0)

  const [activeStep, setActiveStep] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (mapLeft.current || mapRight.current) return

    mapLeft.current = new mapboxgl.Map({
      container: mapLeftContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: LEFT_MAP_DEFAULT.center,
      zoom: LEFT_MAP_DEFAULT.zoom,
      interactive: false,
    })

    mapRight.current = new mapboxgl.Map({
      container: mapRightContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: RIGHT_MAP_DEFAULT.center,
      zoom: RIGHT_MAP_DEFAULT.zoom,
      interactive: false,
    })

    const trackLoad = () => {
      loadedCount.current += 1
      if (loadedCount.current === 2) {
        setMapLoaded(true)
      }
    }

    const setupMap = (map, side) => {
  if (!map) return

  // ── Province boundary outline ──────────────────────────────────────────
  map.addSource(`${side}-boundary`, {
    type: 'geojson',
    data: side === 'left' ? LEFT_GEOJSON : RIGHT_GEOJSON,
  })
  map.addLayer({
    id: `${side}-boundary-line`,
    type: 'line',
    source: `${side}-boundary`,
    paint: { 'line-color': '#1A1A1A', 'line-width': 1.5, 'line-opacity': 0.6 },
  })

  // ── SAL tileset source + loader (forces tile fetching) ─────────────────
  map.addSource(`${side}-sal`, {
    type: 'vector',
    url: 'mapbox://YOUR_TILESET_ID',   // ← same tileset ID as N2
  })
  map.addLayer({
    id:     `${side}-sal-loader`,
    type:   'fill',
    source: `${side}-sal`,
    'source-layer': 'dair_sal',
    layout: { visibility: 'none' },
    paint:  { 'fill-opacity': 0 },
  })

  // ── EA_TYPE choropleth ─────────────────────────────────────────────────
  map.addLayer({
    id:     `${side}-ea-type`,
    type:   'fill',
    source: `${side}-sal`,
    'source-layer': 'dair_sal',
    layout: { visibility: 'none' },
    paint: {
      'fill-color': [
        'match', ['get', 'EA_TYPE'],
        'Township',              '#442520',
        'Informal residential',  '#6B5C4E',
        'Formal residential',    '#C8B89A',
        'Traditional residential', '#8ab0d8',
        'Smallholdings',         '#EDE7DC',
        'Farms',                 '#EDE7DC',
        'Commercial',            '#002395',
        '#F5F0E8'   // default
      ],
      'fill-opacity': 0.75,
    },
  })
  map.addLayer({
    id:     `${side}-ea-type-line`,
    type:   'line',
    source: `${side}-sal`,
    'source-layer': 'dair_sal',
    layout: { visibility: 'none' },
    paint:  { 'line-color': '#ffffff', 'line-width': 0.3, 'line-opacity': 0.4 },
  })

  // ── Access choropleth (AI_WALK — blue→gold ramp) ───────────────────────
  map.addLayer({
    id:     `${side}-access`,
    type:   'fill',
    source: `${side}-sal`,
    'source-layer': 'dair_sal',
    layout: { visibility: 'none' },
    paint: {
      'fill-color': [
        'interpolate', ['linear'], ['get', 'AI_WALK'],
        0,    '#002395',
        0.25, '#4a80c4',
        0.5,  '#c8d8e8',
        0.75, '#e8c97a',
        1,    '#d4a030',
      ],
      'fill-opacity': 0.85,
    },
  })

  // ── Pharmacy dots ──────────────────────────────────────────────────────
  map.addSource(`${side}-pharmacies`, {
    type: 'geojson',
    data: PHARMACY_GEOJSON,
  })
  map.addLayer({
    id:   `${side}-pharmacies-circle`,
    type: 'circle',
    source: `${side}-pharmacies`,
    layout: { visibility: 'none' },
    paint: {
      'circle-radius':         4,
      'circle-color':          '#007A4D',   // design system green
      'circle-opacity':        0.9,
      'circle-stroke-color':   '#ffffff',
      'circle-stroke-width':   1,
    },
  })

  trackLoad()
}

    mapLeft.current.on('load', () => setupMap(mapLeft.current, 'left'))
    mapRight.current.on('load', () => setupMap(mapRight.current, 'right'))

    mapLeft.current.on('error', (e) => console.error('Mapbox error (left):', e))
    mapRight.current.on('error', (e) => console.error('Mapbox error (right):', e))

    return () => {
      mapLeft.current?.remove()
      mapLeft.current = null
      mapRight.current?.remove()
      mapRight.current = null
    }
  }, [])

useEffect(() => {
  if (!mapLoaded) return

  const step     = STEPS[activeStep]
  const showEA   = !!step.showEAType
  const showRx   = !!step.showPharmacies
  const showAcc  = !!step.showAccess

  const toggle = (map, layerId, visible) => {
    if (!map?.getLayer(layerId)) return
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }

  ;['left', 'right'].forEach(side => {
    const map = side === 'left' ? mapLeft.current : mapRight.current
    toggle(map, `${side}-ea-type`,          showEA)
    toggle(map, `${side}-ea-type-line`,     showEA)
    toggle(map, `${side}-access`,           showAcc)
    toggle(map, `${side}-pharmacies-circle`, showRx)
  })
}, [activeStep, mapLoaded])

  useEffect(() => {
    if (!mapLoaded) return

    const scroller = scrollama()
    scroller
      .setup({ step: '.n5 .step-card', offset: 0.85 })
      .onStepEnter(({ index }) => {
        setActiveStep(index)
        const step = STEPS[index]
        const leftFly = step.leftFly || step.fly
        const rightFly = step.rightFly || step.fly

        if (mapLeft.current && leftFly) {
          mapLeft.current.flyTo({ ...leftFly, duration: 2500, essential: true })
        }
        if (mapRight.current && rightFly) {
          mapRight.current.flyTo({ ...rightFly, duration: 2500, essential: true })
        }
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  return (
    <section className="n5" id="n5">
      <div className="n5__intro">
        <span className="n5__eyebrow">Neighborhood Incorporation</span>
        <h2 className="n5__title">Two neighborhoods, one pattern</h2>
        <p className="n5__body">
          The side-by-side view shows how township spatial form and pharmacy access differ across Gauteng and KZN.
        </p>
      </div>

      <div className="n5__scroll">
        <div className="n5__steps">
          {STEPS.map((step, i) => (
            <StepCard key={i} {...step} isActive={activeStep === i} variant="disparity" />
          ))}
        </div>

        <div className="n5__graphic">
          <div className="n5__map-panel">
            <span className="n5__map-label">{LEFT_MAP_DEFAULT.label}</span>
            <div ref={mapLeftContainer} className="n5__map" />
          </div>

          <div className="n5__map-divider" />

          <div className="n5__map-panel">
            <span className="n5__map-label">{RIGHT_MAP_DEFAULT.label}</span>
            <div ref={mapRightContainer} className="n5__map" />
          </div>
        </div>
      </div>
    </section>
  )
}
