import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import StepCard from './StepCard'
import './n5.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const LEFT_MAP_DEFAULT = {
  center: [27.975, -26.065],
  zoom: 10,
  label: 'Gauteng · Johannesburg',
}

const RIGHT_MAP_DEFAULT = {
  center: [30.959, -29.708],
  zoom: 10,
  label: 'KwaMashu · Durban',
}

const STEPS = [
  {
    eyebrow: 'Return to Provinces',
    heading: 'Gauteng and KwaZulu-Natal Neighborhoods',
    body: 'Neighborhood types for KZN and Gauteng side-by-side.',
    fly: { center: [28.5, -27.5], zoom: 7 },
  },
  {
    eyebrow: 'Return to Provinces',
    heading: 'Pharmacies + Neighborhoods, KZN and Gauteng side-by-side.',
    body: 'Neighborhood typologies plus pharmacy points overlaid on both maps.',
    fly: { center: [28.5, -27.5], zoom: 7 },
    showPharmacies: true,
  },
  {
    eyebrow: 'Return to Provinces',
    heading: 'What access looks like here?',
    body: 'Neighborhood types, pharmacy locations, and access choropleth appear together.',
    fly: { center: [28.5, -27.5], zoom: 7 },
    showPharmacies: true,
    showAccess: true,
  },
]

const LEFT_WARDS_GEOJSON = '/data/gauteng-wards.geojson'
const RIGHT_WARDS_GEOJSON = '/data/KZN-wards.geojson'
const PHARMACY_GEOJSON = '/data/PHARMACIES_MASTER_FINAL.geojson'

export default function N5Parallel() {
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

      map.addSource(`${side}-wards`, {
        type: 'geojson',
        data: side === 'left' ? LEFT_WARDS_GEOJSON : RIGHT_WARDS_GEOJSON,
      })

      map.addLayer({
        id: `${side}-wards-fill`,
        type: 'fill',
        source: `${side}-wards`,
        paint: {
          'fill-color': side === 'left' ? '#5B8C5A' : '#5A7A9D',
          'fill-opacity': 0,
        },
      })

      map.addLayer({
        id: `${side}-wards-outline`,
        type: 'line',
        source: `${side}-wards`,
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 0.8,
          'line-opacity': 0,
        },
      })

      map.addSource(`${side}-pharmacies`, {
        type: 'geojson',
        data: PHARMACY_GEOJSON,
      })

      map.addLayer({
        id: `${side}-pharmacies-circle`,
        type: 'circle',
        source: `${side}-pharmacies`,
        paint: {
          'circle-radius': 3,
          'circle-color': '#D9480F',
          'circle-opacity': 0,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 0.5,
          'circle-stroke-opacity': 0,
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

    const step = STEPS[activeStep]
    const showPharmacies = !!step.showPharmacies
    const showAccess = !!step.showAccess

    const updateLayer = (map, layerId, visible) => {
      if (!map || !map.getLayer(layerId)) return

      const opacityProp = layerId.includes('circle') ? 'circle-opacity' : layerId.includes('fill') ? 'fill-opacity' : 'line-opacity'
      map.setPaintProperty(layerId, opacityProp, visible ? 0.65 : 0)
      if (layerId.includes('circle')) {
        map.setPaintProperty(layerId, 'circle-stroke-opacity', visible ? 1 : 0)
      }
    }

    updateLayer(mapLeft.current, 'left-pharmacies-circle', showPharmacies)
    updateLayer(mapRight.current, 'right-pharmacies-circle', showPharmacies)
    updateLayer(mapLeft.current, 'left-wards-fill', showAccess)
    updateLayer(mapRight.current, 'right-wards-fill', showAccess)
    updateLayer(mapLeft.current, 'left-wards-outline', showAccess)
    updateLayer(mapRight.current, 'right-wards-outline', showAccess)
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
