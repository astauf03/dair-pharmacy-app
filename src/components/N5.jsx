import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import StepCard from './StepCard'
import './n5.css'
import {
  CHART_EA_TYPES,
  EA_TYPE_ORDER,
  EA_TYPE_LABELS,
  EA_TYPE_FILL_EXPRESSION,
} from '../constants/mapStyles'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const GAUTENG_GEOJSON  = '/data/gauteng_polygons.geojson'
const KZN_GEOJSON      = '/data/kzn_polygons.geojson'
const GAUTENG_BOUNDARY = '/data/gauteng_boundary.geojson'
const KZN_BOUNDARY     = '/data/kzn_boundary.geojson'
const PHARMACIES       = '/data/pharmacies.geojson'

const LEFT_DEFAULT  = { center: [28.09, -26.08], zoom: 8, label: 'Gauteng' }
const RIGHT_DEFAULT = { center: [30.96, -29.71], zoom: 9, label: 'KwaZulu-Natal' }

const WALK_TYPOLOGY_COLOR = [
  'match', ['get', 'walk_typology'],
  'Pharmacy desert',      '#8B0000',
  'Connectivity gap',     '#C0392B',
  'Demand overcrowding',  '#E67E22',
  'Underserved',          '#F1C40F',
  'Adequate',             '#82C46C',
  'Well-served',          '#27AE60',
  '#CCCCCC',
]

const DRIVE_TYPOLOGY_COLOR = [
  'match', ['get', 'drive_typology'],
  'Pharmacy desert',      '#8B0000',
  'Connectivity gap',     '#C0392B',
  'Demand overcrowding',  '#E67E22',
  'Underserved',          '#F1C40F',
  'Adequate',             '#82C46C',
  'Well-served',          '#27AE60',
  '#CCCCCC',
]

const ACCESS_TIERS = [
  { key: 'Well-served',          color: '#27AE60' },
  { key: 'Adequate',             color: '#82C46C' },
  { key: 'Underserved',          color: '#F1C40F' },
  { key: 'Demand overcrowding',  color: '#E67E22' },
  { key: 'Connectivity gap',     color: '#C0392B' },
  { key: 'Pharmacy desert',      color: '#8B0000' },
]

const EA_TYPE_LEGEND = [
  { color: '#8B2500', label: 'Township' },
  { color: '#C4713A', label: 'Informal residential' },
  { color: '#6B8FA8', label: 'Formal residential / Suburb' },
  { color: '#4A7C6F', label: 'Traditional residential' },
  { color: '#A89860', label: 'Smallholdings' },
  { color: '#C8B878', label: 'Farms' },
  { color: '#002395', label: 'Commercial' },
  { color: '#555566', label: 'Industrial' },
]

const WALK_TYPOLOGY_LEGEND = [
  { color: '#8B0000', label: 'Pharmacy desert' },
  { color: '#C0392B', label: 'Connectivity gap' },
  { color: '#E67E22', label: 'Demand overcrowding' },
  { color: '#F1C40F', label: 'Underserved' },
  { color: '#82C46C', label: 'Adequate' },
  { color: '#27AE60', label: 'Well-served' },
]

const STEPS = [
  {
    eyebrow: 'Return to Provinces',
    heading: 'The pattern at scale',
    body: 'This pattern of access is not unique to Olievenhoutbosch and KwaMashu. Across both provinces, neighborhood type directly translates to accessibility.',
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
    eyebrow: 'Walk Access',
    heading: '17.6 million with no walkable pharmacy',
    body: '72.1% of the combined population has zero walkable pharmacy access. Only 2.5% — about 609,000 people — are well-served on foot.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['walk-typology', 'boundary-line'],
    showChart: true,
    chartType: 'access-pop',
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
    eyebrow: 'By Neighborhood Type',
    heading: 'Every neighborhood is underserved',
    body: 'Traditional residential: 93% no access. Townships: 57% no access but 8.8 million people. The character of underservice differs — distance vs density without infrastructure.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['walk-typology', 'boundary-line'],
    showChart: true,
    chartType: 'access-by-ea',
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
    eyebrow: 'Conclusion',
    heading: 'Confronting the geography apartheid built',
    body: 'The NHI Act of 2024 expands financial access — but closing the gap requires investing in pharmacy infrastructure where it\'s needed most.',
    leftFly:  { center: [28.09, -26.08], zoom: 7 },
    rightFly: { center: [30.96, -29.71], zoom: 8 },
    layers: ['walk-typology', 'pharmacies', 'boundary-line'],
  },
]

const ALL_LAYERS = [
  'ea-type',
  'ea-type-line',
  'walk-typology',
  'pharmacies',
  'boundary-line',
]



function buildAccessPopData(geojson) {
  const tiers = {}
  ACCESS_TIERS.forEach(t => { tiers[t.key] = 0 })

  for (const f of geojson.features) {
    const p = f.properties
    if (!p) continue
    const typ = p.walk_typology ?? ''
    const pop = p.sal2023_est ?? 0
    if (tiers[typ] !== undefined) tiers[typ] += pop
  }

  const total = Object.values(tiers).reduce((a, b) => a + b, 0) || 1
  return ACCESS_TIERS.map(t => ({
    name: t.key,
    population: tiers[t.key],
    percent: Math.round((tiers[t.key] / total) * 1000) / 10,
    color: t.color,
  }))
}

function buildAccessByEAData(geojson) {
  const groups = {}

  for (const f of geojson.features) {
    const p = f.properties
    if (!p?.EA_TYPE) continue
    if (!CHART_EA_TYPES.has(p.EA_TYPE)) continue

    const type = p.EA_TYPE
    if (!groups[type]) {
      groups[type] = { type, total: 0 }
      ACCESS_TIERS.forEach(t => {
        groups[type][`walk_${t.key}`] = 0
        groups[type][`drive_${t.key}`] = 0
      })
    }
    const g = groups[type]
    const pop = p.sal2023_est ?? 0
    const walkTyp = p.walk_typology ?? ''
    const driveTyp = p.drive_typology ?? ''
    g.total += pop
    if (g[`walk_${walkTyp}`] !== undefined) g[`walk_${walkTyp}`] += pop
    if (g[`drive_${driveTyp}`] !== undefined) g[`drive_${driveTyp}`] += pop
  }

  return EA_TYPE_ORDER.filter(t => groups[t]).map(t => {
    const g = groups[t]
    const total = g.total || 1
    const row = { type: (EA_TYPE_LABELS[t] ?? t).replace('\n', ' '), population: g.total }
    ACCESS_TIERS.forEach(tier => {
      row[`walk_${tier.key}`] = Math.round((g[`walk_${tier.key}`] / total) * 100)
      row[`drive_${tier.key}`] = Math.round((g[`drive_${tier.key}`] / total) * 100)
    })
    return row
  })
}

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

function AccessByEAChart({ data }) {
  if (!data?.length) return null
  return (
    <div className="n5__chart-container">
      <p className="n5__chart-title">Access tier distribution by neighborhood type</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 30, bottom: 50, left: 10 }}>
          <XAxis
            dataKey="type"
            tick={{ fontSize: 9, fill: '#555' }}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#999' }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(val, name) => [`${val}%`, name]}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
          />
          {ACCESS_TIERS.slice().reverse().map(t => (
            <Bar key={t.key} dataKey={t.key} stackId="a" fill={t.color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <p className="n5__chart-source">Combined Gauteng + KZN · % of population per EA_TYPE</p>
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
    id: `${side}-walk-typology`, type: 'fill',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: { 'fill-color': WALK_TYPOLOGY_COLOR, 'fill-opacity': 0.8 },
  })

  map.addLayer({
    id: `${side}-drive-typology`, type: 'fill',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: { 'fill-color': DRIVE_TYPOLOGY_COLOR, 'fill-opacity': 0.8 },
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

export default function N5() {
  const mapLeftContainer  = useRef(null)
  const mapRightContainer = useRef(null)
  const mapLeft   = useRef(null)
  const mapRight  = useRef(null)
  const loadedCount = useRef(0)

  const [activeStep,    setActiveStep]    = useState(0)
  const [mapLoaded,     setMapLoaded]     = useState(false)
  const [showChart,     setShowChart]     = useState(false)
  const [accessPopData, setAccessPopData] = useState(null)
  const [accessEAData,  setAccessEAData]  = useState(null)

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
      if (loadedCount.current === 2) setMapLoaded(true)
    }

    mapLeft.current.on('load', () => onLoad(mapLeft.current, 'left', GAUTENG_GEOJSON))
    mapRight.current.on('load', () => onLoad(mapRight.current, 'right', KZN_GEOJSON))

    return () => {
      mapLeft.current?.remove();  mapLeft.current  = null
      mapRight.current?.remove(); mapRight.current = null
    }
  }, [])

  useEffect(() => {
    Promise.all([
      fetch(GAUTENG_GEOJSON).then(r => r.json()),
      fetch(KZN_GEOJSON).then(r => r.json()),
    ]).then(([gp, kzn]) => {
      const combined = { type: 'FeatureCollection', features: [...gp.features, ...kzn.features] }
      setAccessPopData(buildAccessPopData(combined))
      setAccessEAData(buildAccessByEAData(combined))
    }).catch(() => {})
  }, [])

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

        if (progress > 0.75) {
          setShowChart(true)
        } else {
          setShowChart(false)
        }
      })
      .onStepExit(({ index }) => {
        if (STEPS[index].showChart) {
          setShowChart(false)
        }
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  const step = STEPS[activeStep]

  return (
  <section className="n5" id="n5">
    <div className="n5__scroll">          {/* ← this wrapper was missing */}
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

        {step?.legend && !showChart && (
          <MapLegend items={step.legend} title={step.legendTitle} />
        )}

        {showChart && step?.chartType === 'access-pop' && (
          <div className="n5__chart-overlay n5__chart-overlay--visible">
            <AccessPopChart data={accessPopData} />
          </div>
        )}

        {showChart && step?.chartType === 'access-by-ea' && (
          <div className="n5__chart-overlay n5__chart-overlay--visible">
            <AccessByEAChart data={accessEAData} />
          </div>
        )}
      </div>
    </div>
  </section>
)
}