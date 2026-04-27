import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import StepCard from './StepCard'
import './n3.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
console.log("token:", mapboxgl.accessToken)

const STEPS = [
  {
    eyebrow: 'Spatial Apartheid · Gauteng',
    heading: 'How Johannesburg was divided',
    body: 'Placeholder — SAL size comparison Gauteng. Max vs min SAL area, compared to a known Joburg landmark for scale.',
  },
  {
    eyebrow: 'Spatial Apartheid · KwaZulu-Natal',
    heading: 'How Durban was divided',
    body: 'Placeholder — SAL size comparison KZN. Max vs min SAL area, compared to a known Durban landmark for scale.',
  },
  {
    eyebrow: 'Spatial Apartheid · Gauteng',
    heading: 'Who lives here',
    body: 'Placeholder — homestead overlays Gauteng. Population distribution, density patterns.',
  },
  {
    eyebrow: 'Spatial Apartheid · KwaZulu-Natal',
    heading: 'Who lives here',
    body: 'Placeholder — homestead overlays KZN. Population distribution, density patterns.',
  },
  {
    eyebrow: 'Spatial Apartheid · Gauteng',
    heading: 'Demographics and economic geography',
    body: 'Placeholder — pop, median income, race distribution Gauteng.',
  },
  {
    eyebrow: 'Spatial Apartheid · KwaZulu-Natal',
    heading: 'Demographics and economic geography',
    body: 'Placeholder — pop, median income, race distribution KZN.',
  },
]

const FLY_TARGETS = [
  { center: [28.0, -26.2], zoom: 9.5 },   // Joburg — Gauteng apartheid geography
  { center: [30.9, -29.8], zoom: 9.5 },   // Durban — KZN apartheid geography
  { center: [28.0, -26.2], zoom: 10.5 },  // Joburg closer — homestead overlays
  { center: [30.9, -29.8], zoom: 10.5 },  // Durban closer — homestead overlays
  { center: [28.0, -26.2], zoom: 9.0 },   // Gauteng — demographics
  { center: [30.9, -29.8], zoom: 9.0 },   // KZN — demographics
]

export default function N3() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [activeStep, setActiveStep] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Boot the map once
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
    console.log('map loaded!')
    setMapLoaded(true)
  })

  map.current.on('error', (e) => {
    console.error('Mapbox error:', e)
  })

  return () => {
    map.current?.remove()
    map.current = null
  }
}, [])

  // Boot Scrollama separately
  useEffect(() => {
    if(!mapLoaded) return 

    const scroller = scrollama()
    scroller
      .setup({
        step: '.n3 .step-card',
        offset: 0.5,
      })
      .onStepEnter(({ index }) => {
        setActiveStep(index)
        if (map.current && FLY_TARGETS[index]) {
          map.current.flyTo({
            ...FLY_TARGETS[index],
            duration: 5000,
            curve: 1.5,
            essential: true,
          })
        }
      })

    return () => scroller.destroy()
  }, [mapLoaded])

return (
  <section className="n3" id = "n3">

    {/* Intro ribbon — no map, just text, sits above the scrollama section */}
    <div className="n3__intro">
      <span className="n3__eyebrow">Spatial Apartheid</span>
      <h2 className="n3__title">The lines drawn then still hold today</h2>
      <p className="n3__body">
        Placeholder — brief framing of apartheid geography before the map steps begin.
      </p>
    </div>

    {/* Scrollama section — sticky map + step cards */}
    <div className="n3__scroll">
      <div className="n3__steps">
        {STEPS.map((step, i) => (
          <StepCard key={i} {...step} isActive={activeStep === i} variant="apartheid" />
        ))}
      </div>
      <div className="n3__graphic">
        <div ref={mapContainer} className="n3__map" />
      </div>
    </div>

  </section>
)
}