import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import StepCard from './StepCard'
import './n2.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN


const STEPS = [
  {
    heading: 'Spatial Context · South Africa',
    body: 'South Africa sits at the southern tip of the continent, home to over 60 million people across nine provinces.',
    fly: { center: [25.0, -29.0], zoom: 3.8 },   // Africa view
  },
  {
    eyebrow: 'Spatial Context · Provinces',
    heading: 'Gauteng and KwaZulu-Natal',
    body: 'Gauteng is the smallest province by area but the most populous. KZN stretches along the coast with vast rural hinterlands. (Other statistics).',
    fly: { center: [28.5, -27.5], zoom: 5.2 },   // Gauteng + KZN
  },
  {
    eyebrow: 'Spatial Context · Neighborhoods',
    heading: 'What are the most common neighborhoods in Gauteng?',
    body: 'List the types of neighborhoods in Gauteng, with a focus on the most common ones. Include a map showing the distribution of these neighborhood types across the province.',
    fly: { center: [27.9943239,9.21, -26.0410534], zoom: 8.5 },   // Joburg zoom
  },
  {
    eyebrow: 'Spatial Context · Neighborhoods and Population',
    heading: 'How does population density vary by neighborhood type across Gauteng?',
    body: 'Examine the relationship between neighborhood types and population density in Gauteng. Include a map showing the distribution of population across different neighborhood types.',
    fly: { center: [27.9943239,9.21, -26.0410534], zoom: 8.5 },   // Joburg zoom
  },
  {
    eyebrow: 'Spatial Context · Neighborhoods',
    heading: 'What are the most common neighborhoods in KwaZulu-Natal?',
    body: 'List the types of neighborhoods in KZN, with a focus on the most common ones. Include a map showing the distribution of these neighborhood types across the province.',
    fly: { center: [31.0, -29.0], zoom: 6.0 },   // KZN zoom
  },
    {
    eyebrow: 'Spatial Context · Neighborhoods and Population',
    heading: 'How does population density vary by neighborhood type across KZN?',
    body: 'Examine the relationship between neighborhood types and population density in KZN. Include a map showing the distribution of population across different neighborhood types.',
    fly: { center: [27.9943239,9.21, -26.0410534], zoom: 8.5 },   // Joburg zoom
  },
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
      center: STEPS[0].center,
      zoom: STEPS[0].zoom,
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
        if (map.current && STEPS[index].fly) {
          map.current.flyTo({
            ...STEPS[index].fly,
            duration: 1800,
            essential: true,
          })
        }
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  return (
<section className="n2" id = "n2">
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