import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import StepCard from './StepCard'
import './n2.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
console.log("token:", mapboxgl.accessToken)

const STEPS = [
  {
    eyebrow: 'Spatial Context · Step 1',
    heading: 'South Africa in southern Africa',
    body: 'South Africa sits at the southern tip of the continent, home to over 60 million people across nine provinces.',
  },
  {
    eyebrow: 'Spatial Context · Step 2',
    heading: 'Province Highlight: Gauteng and KwaZulu-Natal',
    body: 'Gauteng is the smallest province by area but the most populous. KZN stretches along the coast with vast rural hinterlands. (Other statistics).',
  },
  {
    eyebrow: 'Spatial Context · Step 3',
    heading: 'Zooming in to where people live, Ward and SAL Area Orientation',
    body: 'Ward is comparable to X kilometers across and SAL areas are about Y km. These are the units of analysis for our pharmacy access mapping.',
  },
]

const FLY_TARGETS = [
  { center: [25.0, -29.0], zoom: 3.8 },   // Africa view
  { center: [28.5, -27.5], zoom: 5.2 },   // Gauteng + KZN
  { center: [28.0, -26.2], zoom: 8.5 },   // Joburg zoom
]

export default function N2() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [activeStep, setActiveStep] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Boot the map once
  useEffect(() => {
    if (map.current) return
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: FLY_TARGETS[0].center,
      zoom: FLY_TARGETS[0].zoom,
      interactive: false,
    })

      map.current.on('load', () => {
        setMapLoaded(true)
      })

    return () => map.current?.remove()
  }, [])

  // Boot Scrollama separately
  useEffect(() => {
    if(!mapLoaded) return 

    const scroller = scrollama()
    scroller
      .setup({
        step: '.n2 .step-card',
        offset: 0.5,
      })
      .onStepEnter(({ index }) => {
        setActiveStep(index)
        if (map.current && FLY_TARGETS[index]) {
          map.current.flyTo({
            ...FLY_TARGETS[index],
            duration: 1800,
            essential: true,
          })
        }
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  return (
<section className="n2">
  <div className="n2__steps">
    {STEPS.map((step, i) => (
      <StepCard key={i} {...step} isActive={activeStep === i} />
    ))}
  </div>
  <div className="n2__graphic">
    <div ref={mapContainer} className="n2__map" />
  </div>
</section>
  )
}