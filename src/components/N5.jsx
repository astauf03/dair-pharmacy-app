import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import StepCard from './StepCard'
import './n5.css'
import {
  EA_TYPE_FILL_EXPRESSION,
} from '../constants/mapStyles'
import accessPopJson from '../../public/data/chart_n5_access_pop.json'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
const BASE = import.meta.env.BASE_URL || '/'

// kzn_polygons.geojson exceeds 100MB — not in repo.
// N5 right map uses gauteng_polygons.geojson for left, kzn.geojson (point file) for right.
// Walk typology and density fill on KZN side will not render until vector tileset is wired (Part 2).
const GAUTENG_GEOJSON  = `${BASE}data/gauteng_polygons.geojson`
const KZN_GEOJSON      = `${BASE}data/kzn.geojson`
const GAUTENG_BOUNDARY = `${BASE}data/gauteng_boundary.geojson`
const KZN_BOUNDARY     = `${BASE}data/kzn_boundary.geojson`
const PHARMACIES       = `${BASE}data/pharmacies.geojson`

const LEFT_DEFAULT  = { center: [28.09, -26.08], zoom: 8, label: 'Gauteng' }
const RIGHT_DEFAULT = { center: [30.96, -29.71], zoom: 9, label: 'KwaZulu-Natal' }

// Walk typology — confirmed strings from data
// Severity: Pharmacy desert → Underserved → Fragile → Overcrowded → Well-served
// Data-uncertain = measurement uncertainty (OSM routing gaps), not an access tier
const WALK_TYPOLOGY_COLOR = [
  'match', ['get', 'walk_typology'],
  'Pharmacy desert', '#8B0000',
  'Underserved',     '#E67E22',
  'Fragile',         '#F1C40F',
  'Overcrowded',     '#82C46C',
  'Well-served',     '#27AE60',
  'Data-uncertain',  '#B0A090',
  '#CCCCCC',
]

// Population density — sand (sparse) → dark brown (dense)
// Replaces previous blue ramp to avoid conflict with access layer blue encoding
const DENSITY_FILL_COLOR = [
  'interpolate', ['linear'],
  ['/', ['get', 'sal2023_est'], ['max', ['get', 'area_km2'], 0.001]],
  0,     '#F5F0E8',
  200,   '#E8D5A0',
  500,   '#D4A850',
  2000,  '#B07820',
  5000,  '#7A4E10',
  10000, '#3A2008',
]

const DENSITY_LEGEND = [
  { color: '#F5F0E8', label: '0 ppl/km²' },
  { color: '#E8D5A0', label: '200'        },
  { color: '#D4A850', label: '500'        },
  { color: '#B07820', label: '2,000'      },
  { color: '#7A4E10', label: '5,000'      },
  { color: '#3A2008', label: '10,000+'    },
]

// ACCESS_TIERS — confirmed typology strings matching precomputed chart_n5_access_pop.json
// Used only by AccessPopChart to set bar colors. Chart data comes from the JSON import.
const ACCESS_TIERS = [
  { key: 'Well-served',     color: '#27AE60' },
  { key: 'Overcrowded',     color: '#82C46C' },
  { key: 'Fragile',         color: '#F1C40F' },
  { key: 'Underserved',     color: '#E67E22' },
  { key: 'Pharmacy desert', color: '#8B0000' },
  { key: 'Data-uncertain',  color: '#B0A090' },
]

const EA_TYPE_LEGEND = [
  { color: '#8B2500', label: 'Township'                    },
  { color: '#C4713A', label: 'Informal residential'        },
  { color: '#6B8FA8', label: 'Formal residential / Suburb' },
  { color: '#4A7C6F', label: 'Traditional residential'     },
  { color: '#A89860', label: 'Smallholdings'               },
  { color: '#C8B878', label: 'Farms'                       },
  { color: '#002395', label: 'Commercial'                  },
  { color: '#555566', label: 'Industrial'                  },
]

const WALK_TYPOLOGY_LEGEND = [
  { color: '#8B0000', label: 'Pharmacy desert' },
  { color: '#E67E22', label: 'Underserved'     },
  { color: '#F1C40F', label: 'Fragile'         },
  { color: '#82C46C', label: 'Overcrowded'     },
  { color: '#27AE60', label: 'Well-served'     },
  { color: '#B0A090', label: 'Data-uncertain'  },
]

const STEPS = [
  {
    eyebrow: 'Return to Provinces',
    heading: 'The pattern at scale',
    body: 'This pattern is not unique to the two neighborhoods studied. Across Gauteng and KwaZulu-Natal, pharmacy access is dictated by neighborhood type and racial composition. As the province-wide maps show, the same relationship observed in KwaMashu and Olievenhoutbosch holds at scale. Neighborhood type directly translates to accessibility scores, and neighborhood type was largely determined by apartheid.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['ea-type', 'ea-type-line', 'boundary-line'],
    legend: EA_TYPE_LEGEND,
    legendTitle: 'Neighborhood type',
  },
  {
    eyebrow: 'Pharmacy Distribution',
    heading: 'Where are the pharmacies?',
    body: 'Gauteng has over double the regulated pharmacies of KZN. Each KZN pharmacy serves ~15,100 people — 70% more than Gauteng\'s ~8,900.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['ea-type', 'ea-type-line', 'pharmacies', 'boundary-line'],
    legend: [...EA_TYPE_LEGEND, { color: '#007A4D', label: 'Pharmacy' }],
    legendTitle: 'Neighborhoods + Pharmacies',
  },
  {
    // TODO: update headline stats once chart_n5_access_pop.json is recomputed
    // with correct typology strings ('Access gap' and 'Artifact zone' resolved)
    eyebrow: 'Walk Access',
    heading: 'Pharmacy access across both provinces',
    body: 'Combined Gauteng + KZN population classified by walk-mode pharmacy access. Townships and traditional settlements account for the overwhelming majority of residents without walkable access.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['walk-typology', 'boundary-line'],
    legend: WALK_TYPOLOGY_LEGEND,
    legendTitle: 'Walk access typology',
  },
  {
    eyebrow: 'Pharmacies + Access',
    heading: 'The spatial mismatch',
    body: 'Pharmacies cluster where access is already adequate. The areas that need them most — townships, traditional settlements — are the furthest from care.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['walk-typology', 'pharmacies', 'boundary-line'],
    legend: [...WALK_TYPOLOGY_LEGEND, { color: '#007A4D', label: 'Pharmacy' }],
    legendTitle: 'Access + Pharmacies',
  },
  {
    eyebrow: 'The Apartheid Correlation',
    heading: 'Neighborhood type meets pharmacy gap',
    body: 'The question of who can reach a pharmacy is inseparable from the question of where apartheid placed them.',
    leftFly:  { center: [28.09, -26.08], zoom: 7.5 },
    rightFly: { center: [30.96, -29.71], zoom: 8.5 },
    splitLayers: true,
    layersLeft:  ['ea-type', 'ea-type-line', 'boundary-line'],
    layersRight: ['walk-typology', 'boundary-line'],
  },
  {
    eyebrow: 'Where People Actually Live',
    heading: 'Population density reveals the stakes',
    body: 'The darkest zones are the densest — and often the most underserved. High population density without pharmacy access concentrates the burden of the gap.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['density-fill', 'boundary-line'],
    showDensityLegend: true,
  },
  {
    eyebrow: 'By the Numbers',
    heading: 'Population by walk access tier',
    body: 'The combined Gauteng + KZN population classified by walk-mode pharmacy access score.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['walk-typology', 'boundary-line'],
    showChart: true,
    chartType: 'access-pop',
    legend: WALK_TYPOLOGY_LEGEND,
    legendTitle: 'Walk access typology',
  },
  {
    eyebrow: 'Looking Forward',
    heading: 'Confronting the geography apartheid built',
    body: 'The NHI Act of 2024 expands financial access — but closing the gap requires investing in pharmacy infrastructure where it\'s needed most.',
    leftFly:  { center: [28.09, -26.08], zoom: 7 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: [],
    isClosing: true,
  },
]

const ALL_LAYERS = [
  'ea-type',
  'ea-type-line',
  'density-fill',
  'walk-typology',
  'pharmacies',
  'boundary-line',
]

function AccessPopChart({ data }) {
  if (!data?.length) return null
  return (
    <div className="n5__chart-container">
      <p className="n5__chart-title">Population by walk access tier</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 80, bottom: 5, left: 140 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#555' }} width={135} />
          <Tooltip
            formatter={(val) => `${(val / 1000000).toFixed(2)}M people`}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="population" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList
              dataKey="percent"
              position="right"
              formatter={(v) => `${v}%`}
              style={{ fontSize: 11, fill: '#333', fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="n5__chart-source">Combined Gauteng + KZN · 2SFCA walk accessibility score</p>
    </div>
  )
}

function addDataLayers(map, side, salSource) {
  map.addSource(`${side}-boundary`, {
    type: 'geojson',
    data: side === 'left' ? GAUTENG_BOUNDARY : KZN_BOUNDARY,
  })
  map.addLayer({
    id: `${side}-boundary-line`, type: 'line',
    source: `${side}-boundary`,
    layout: { visibility: 'none' },
    paint: { 'line-color': '#1A1A1A', 'line-width': 1.5, 'line-opacity': 0.6 },
  })

  map.addSource(`${side}-sal`, {
    type: 'geojson',
    data: salSource,
  })

  map.addLayer({
    id: `${side}-ea-type`, type: 'fill',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: { 'fill-color': EA_TYPE_FILL_EXPRESSION, 'fill-opacity': 0.7 },
  })
  map.addLayer({
    id: `${side}-ea-type-line`, type: 'line',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: { 'line-color': '#ffffff', 'line-width': 0.3, 'line-opacity': 0.4 },
  })

  map.addLayer({
    id: `${side}-density-fill`, type: 'fill',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: { 'fill-color': DENSITY_FILL_COLOR, 'fill-opacity': 0.82 },
  })

  map.addLayer({
    id: `${side}-walk-typology`, type: 'fill',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: { 'fill-color': WALK_TYPOLOGY_COLOR, 'fill-opacity': 0.8 },
  })

  map.addSource(`${side}-pharmacies`, {
    type: 'geojson',
    data: PHARMACIES,
  })
  map.addLayer({
    id: `${side}-pharmacies`, type: 'circle',
    source: `${side}-pharmacies`,
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': 4,
      'circle-color': '#007A4D',
      'circle-opacity': 0.9,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  })
}

function MapLegend({ items, title }) {
  return (
    <div className="n5__map-legend">
      {title && <span className="n5__map-legend-title">{title}</span>}
      {items.map(({ color, label }) => (
        <span key={label} className="n5__map-legend-item">
          <span className="n5__map-legend-swatch" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

function DensityLegend() {
  return (
    <div className="n5__map-legend">
      <span className="n5__map-legend-title">Population density (ppl/km²)</span>
      {DENSITY_LEGEND.map(({ color, label }) => (
        <span key={label} className="n5__map-legend-item">
          <span className="n5__map-legend-swatch" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

export default function N5() {
  const mapLeftContainer  = useRef(null)
  const mapRightContainer = useRef(null)
  const mapLeft     = useRef(null)
  const mapRight    = useRef(null)
  const loadedCount = useRef(0)

  const [activeStep,    setActiveStep]    = useState(0)
  const [mapLoaded,     setMapLoaded]     = useState(false)
  const [showChart,     setShowChart]     = useState(false)

  // Chart data imported statically — no fetch needed
  const [accessPopData] = useState(accessPopJson)

  // Map init
  useEffect(() => {
    if (mapLeft.current || mapRight.current) return

    mapLeft.current = new mapboxgl.Map({
      container: mapLeftContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: LEFT_DEFAULT.center,
      zoom: LEFT_DEFAULT.zoom,
      interactive: false,
    })

    mapRight.current = new mapboxgl.Map({
      container: mapRightContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: RIGHT_DEFAULT.center,
      zoom: RIGHT_DEFAULT.zoom,
      interactive: false,
    })

    const onLoad = (map, side, salSource) => {
      addDataLayers(map, side, salSource)
      loadedCount.current += 1
      if (loadedCount.current === 2) {
        // Resize forces canvas recalculation after sticky layout settles
        mapLeft.current.resize()
        mapRight.current.resize()
        setMapLoaded(true)
      }
    }

    mapLeft.current.on('load',  () => onLoad(mapLeft.current,  'left',  GAUTENG_GEOJSON))
    mapRight.current.on('load', () => onLoad(mapRight.current, 'right', KZN_GEOJSON))

    mapLeft.current.on('error',  e => console.warn('N5 left map error:',  e))
    mapRight.current.on('error', e => console.warn('N5 right map error:', e))

    return () => {
      mapLeft.current?.remove();  mapLeft.current  = null
      mapRight.current?.remove(); mapRight.current = null
    }
  }, [])

  // Scrollama
  useEffect(() => {
    if (!mapLoaded) return

    const toggle = (map, layerId, visible) => {
      if (map?.getLayer(layerId))
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
    }

    const applyStep = (index) => {
      const step = STEPS[index]
      const setLayers = (map, side, layerNames) => {
        ALL_LAYERS.forEach(l => toggle(map, `${side}-${l}`, layerNames.includes(l)))
      }
      if (step.splitLayers) {
        setLayers(mapLeft.current,  'left',  step.layersLeft  ?? [])
        setLayers(mapRight.current, 'right', step.layersRight ?? [])
      } else {
        const layers = step.layers ?? []
        setLayers(mapLeft.current,  'left',  layers)
        setLayers(mapRight.current, 'right', layers)
      }
    }

    const scroller = scrollama()
    scroller
      .setup({ step: '.n5 .step-card', offset: 0.85, progress: true })
      .onStepEnter(({ index }) => {
        setActiveStep(index)
        const step = STEPS[index]
        setShowChart(false)
        applyStep(index)
        if (!step.showChart) {
          mapLeft.current?.flyTo({ ...(step.leftFly ?? {}), duration: 2500, essential: true })
          mapRight.current?.flyTo({ ...(step.rightFly ?? {}), duration: 2500, essential: true })
        }
      })
      .onStepProgress(({ index, progress }) => {
        const step = STEPS[index]
        if (!step.showChart) return
        if (progress > 0.2) {
          mapLeft.current?.flyTo({ ...(step.leftFly ?? {}), duration: 2500, essential: true })
          mapRight.current?.flyTo({ ...(step.rightFly ?? {}), duration: 2500, essential: true })
        }
        setShowChart(progress > 0.75)
      })
      .onStepExit(({ index }) => {
        if (STEPS[index].showChart) setShowChart(false)
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  const step = STEPS[activeStep]

  return (
    <section className="n5" id="n5">
      <div className="n5__scroll">
        <div className="n5__steps">
          {STEPS.map((s, i) => (
            <StepCard key={i} {...s} isActive={activeStep === i} variant="disparity" />
          ))}
        </div>

        <div className="n5__graphic">
          <div className="n5__map-panel">
            <span className="n5__map-label">{LEFT_DEFAULT.label}</span>
            <div
              ref={mapLeftContainer}
              className="n5__map"
              style={{ opacity: showChart ? 0.18 : 1, transition: 'opacity 0.7s ease' }}
            />
          </div>

          <div className="n5__map-divider" />

          <div className="n5__map-panel">
            <span className="n5__map-label">{RIGHT_DEFAULT.label}</span>
            <div
              ref={mapRightContainer}
              className="n5__map"
              style={{ opacity: showChart ? 0.18 : 1, transition: 'opacity 0.7s ease' }}
            />
          </div>

          {step?.legend && !showChart && !step?.showDensityLegend && !step?.isClosing && (
            <MapLegend items={step.legend} title={step.legendTitle} />
          )}

          {step?.showDensityLegend && !showChart && !step?.isClosing && (
            <DensityLegend />
          )}

          {showChart && step?.chartType === 'access-pop' && (
            <div className="n5__chart-overlay n5__chart-overlay--visible">
              <AccessPopChart data={accessPopData} />
            </div>
          )}

          {step?.isClosing && (
            <div className="n5__closing">
              <p className="n5__pull-quote">
                The NHI Act of 2024 expands who can afford a pharmacy visit.
                But it cannot move pharmacies closer to where people live.
                Closing the gap means investing in the geography apartheid built.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}