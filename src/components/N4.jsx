import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import StepCard from './StepCard'
import './n4.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const STEPS = [
  {
    eyebrow: 'Measuring Access · Population',
    heading: 'Population Density + Pharmacies',
    body: 'This is a population density map at the most specific level available. Bare bones median household income data. So, where are the pharmacies?',
  },
  {
    eyebrow: 'Measuring Access · Disparity',
    heading: 'Who is being left out',
    body: 'Placeholder — low-access disparity highlight layer. Non-wealthy traditional residential areas with zero walking access.',
  },
  {
    eyebrow: 'Measuring Access · Provinces',
    heading: 'Access by province',
    body: 'Identified 4,000+ pharmacies, X in Gauteng, Y in KZN. Where are they located? How does that relate to population density?',
  },
]

const FLY_TARGETS = [
  { center: [28.0, -26.2], zoom: 9.0 },   // Gauteng — population density
  { center: [28.0, -26.2], zoom: 9.0 },   // Gauteng — disparity layer
  { center: [30.9, -29.8], zoom: 9.0 },   // KZN — province stat
]

export default function N4() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [activeStep, setActiveStep] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: FLY_TARGETS[0].center,
      zoom: FLY_TARGETS[0].zoom,
      interactive: false,
    })

    map.current.on('load', () => {
      // Gauteng source + layers
      map.current.addSource('gauteng', {
        type: 'geojson',
        data: '/data/gauteng.geojson',
      })
      map.current.addLayer({
        id: 'gauteng-fill',
        type: 'fill',
        source: 'gauteng',
        paint: { 'fill-color': '#002395', 'fill-opacity': 0 },
      })
      map.current.addLayer({
        id: 'gauteng-outline',
        type: 'line',
        source: 'gauteng',
        paint: { 'line-color': '#002395', 'line-width': 1.5, 'line-opacity': 0 },
      })

      // KZN source + layers
      map.current.addSource('kzn', {
        type: 'geojson',
        data: '/data/KZN.geojson',
      })
      map.current.addLayer({
        id: 'kzn-fill',
        type: 'fill',
        source: 'kzn',
        paint: { 'fill-color': '#ebc159', 'fill-opacity': 0 },  // fixed — was #97c93b
      })
      map.current.addLayer({
        id: 'kzn-outline',
        type: 'line',
        source: 'kzn',
        paint: { 'line-color': '#ebc159', 'line-width': 1.5, 'line-opacity': 0 },
      })

      setMapLoaded(true)
    })

    map.current.on('error', (e) => console.error('Mapbox error:', e))

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded) return

    const scroller = scrollama()
    scroller
      .setup({
        step: '.n4 .step-card',
        offset: 0.5,
      })
      .onStepEnter(({ index }) => {
        setActiveStep(index)
        if (map.current && FLY_TARGETS[index]) {
          map.current.flyTo({
            ...FLY_TARGETS[index],
            duration: 5000,
            curve: 1.8,
            essential: true,
          })
        }
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  return (
    <section className="n4">
      <div className="n4__intro">
        <span className="n4__eyebrow">Measuring Access</span>
        <h2 className="n4__title">Where are the pharmacies?</h2>
        <p className="n4__body">
          This is a population density map at the most specific level available.
          Bare bones median household income data. So, where are the pharmacies?
        </p>
      </div>

      <div className="n4__scroll">
        <div className="n4__steps">
          {STEPS.map((step, i) => (
            <StepCard key={i} {...step} isActive={activeStep === i} variant="pharmacy" />
          ))}
        </div>
        <div className="n4__graphic">
          <div ref={mapContainer} className="n4__map" />
        </div>
      </div>
    </section>
  )
}