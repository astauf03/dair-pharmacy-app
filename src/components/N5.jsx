import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import StepCard from './StepCard'
import './n5.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const STEPS = [
  {
    eyebrow: 'Neighborhood: Gauteng',
    heading: 'Kya Sands, Johannesburg',
    body: 'Placeholder — fly to Kya Sands. A neighborhood shaped by apartheid-era planning, sitting on the boundary of Randburg.',
  },
  {
    eyebrow: 'Neighborhood: Gauteng',
    heading: 'What access looks like here?',
    body: 'Placeholder — Kya Sands pharmacy stats, walking distance, population density.',
  },
  {
    eyebrow: 'Neighborhood: KwaZulu-Natal',
    heading: 'KwaMashu, Durban',
    body: 'Placeholder — fly to KwaMashu. A purpose-built apartheid township north of Durban, visible from satellite as an ideological artifact.',
  },
  {
    eyebrow: 'Neighborhood: KwaZulu-Natal',
    heading: 'What access looks like here?',
    body: 'Placeholder — KwaMashu pharmacy stats, walking distance, population density. How does this compare to Kyasand? What does this say about the legacy of spatial apartheid?',
  },
]

const FLY_TARGETS = [
  { center: [27.9717, -26.0667], zoom: 13.5 },  // Kyasand, Johannesburg
  { center: [27.9717, -26.0667], zoom: 14.5 },  // Kyasand closer
  { center: [30.9590, -29.7080], zoom: 13.5 },  // KwaMashu, Durban
  { center: [30.9590, -29.7080], zoom: 14.5 },  // KwaMashu closer
]

export default function N5() {
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

  useEffect(() => {
    if (!mapLoaded) return

    const scroller = scrollama()
    scroller
      .setup({
        step: '.n5 .step-card',
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
    <section className="n5">
      <div className="n5__intro">
        <span className="n5__eyebrow">Neighborhood Incorporation</span>
        <h2 className="n5__title">Two neighborhoods, one pattern</h2>
        <p className="n5__body">
          Placeholder — framing the neighborhood-scale story. Khayasand in Gauteng, KwaMashu in KZN. What does access actually look like on the ground?
        </p>
      </div>

      <div className="n5__scroll">
        <div className="n5__steps">
          {STEPS.map((step, i) => (
            <StepCard key={i} {...step} isActive={activeStep === i} variant="disparity" />
          ))}
        </div>
        <div className="n5__graphic">
          <div ref={mapContainer} className="n5__map" />
        </div>
      </div>
    </section>
  )
}