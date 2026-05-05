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

const DENSITY_FILL_COLOR = [
  'interpolate', ['linear'],
  ['/', ['get', 'sal2023_est'], ['max', ['get', 'area_km2'], 0.001]],
  0,     '#002395',  // --data-access-1 / --color-blue: near-zero density, rural
  500,   '#4a80c4',  // --data-access-3: low density
  2000,  '#c8d8e8',  // --data-access-5: medium density
  5000,  '#e8c97a',  // --data-access-6: high-density transition
  10000, '#d4a030',  // --data-access-8 / --color-gold-dark: urban core, highest density
]

const DENSITY_LEGEND = [
  { color: '#002395', label: '0 ppl/km²' },   // --data-access-1
  { color: '#4a80c4', label: '500' },           // --data-access-3
  { color: '#c8d8e8', label: '2,000' },         // --data-access-5
  { color: '#e8c97a', label: '5,000' },         // --data-access-6
  { color: '#d4a030', label: '10,000+' },       // --data-access-8
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

  // Step 0: Neighborhood type overview — the apartheid spatial pattern before any
  // pharmacy data appears. Reader needs this social geography baseline to understand
  // why the access map in step 2 looks the way it does.
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
  // Step 1: reveal pharmacy locations over the EA_TYPE for province context.
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

  // Step 2: Switch from social geography to access geography.
  // 17.6M people with no walkable pharmacy is the project's core headline statistic.
  {
    eyebrow: 'Walk Access',
    heading: '17.6 million with no walkable pharmacy',
    body: '72.1% of the combined population has zero walkable pharmacy access. Only 2.5% — about 609,000 people — are well-served on foot.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['walk-typology', 'boundary-line'],
    legend: WALK_TYPOLOGY_LEGEND,
    legendTitle: 'Walk access typology',
  },
  // Step 3: Add pharmacies back over walk typology — the spatial mismatch is now
  // visible. Pharmacies exist, but they cluster precisely where access is already adequate.
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
  // // Step 4: Split view — left=EA_TYPE (who lives where), right=walk-typology (access).
  // Side-by-side makes the apartheid correlation directly legible without a chart.
  // The splitLayers flag tells applyStep() to configure each map independently.
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
  // Step 5: Population density choropleth — gold zones are the densest areas.
  // High density + poor access = where the pharmacy desert hits hardest.
  // This layer uses a Mapbox interpolate expression (sal2023_est / area_km2);
  // no pre-computed density field is required in the GeoJSON.
  {
    eyebrow: 'Where People Actually Live',
    heading: 'Population density reveals the stakes',
    body: 'The gold zones are the densest — and often the most underserved. High population density without pharmacy access concentrates the burden of the gap.',
    leftFly:  { center: [28.09, -26.08], zoom: 8 },
    rightFly: { center: [30.96, -29.71], zoom: 9 },
    layers: ['density-fill', 'boundary-line'],
    showDensityLegend: true,
  },

  // Step 6: Recharts bar chart — population broken down by walk access tier.
  // showChart triggers the chart overlay; chartType selects which Recharts component.
  // The horizontal bar layout makes the 72% figure viscerally legible.
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
    rightFly: { center: [30.96, -29.71], zoom: 8 },
    layers: [],
    isClosing: true
  },
]


 //All layer suffixes managed by applyStep(). Each map uses these prefixed with
// 'left-' or 'right-'. boundary-line is included so the closing step can hide it.
const ALL_LAYERS = [
  'ea-type',
  'ea-type-line',
  'density-fill',
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
    layout: { visibility: 'none' },
    paint: { 'line-color': '#1A1A1A', 'line-width': 1.5, 'line-opacity': 0.6 },
  })

  //SAL polygon source, used by ea-type, density fill, walk typology 

  map.addSource(`${side}-sal`, {
    type: 'geojson',
    data: salSource,
  })

  //EA_TYPE layer with categorical fill and white outline for legibility

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
    paint: {
      'fill-color': DENSITY_FILL_COLOR,
      'fill-opacity': 0.82,
    },
  })

  map.addLayer({
    id: `${side}-walk-typology`, type: 'fill',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: { 'fill-color': WALK_TYPOLOGY_COLOR, 'fill-opacity': 0.8 },
  })

  // Pharmacies layer — point data from the GeoJSON source, styled as green circles with white outlines.

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
  const mapLeft   = useRef(null)
  const mapRight  = useRef(null)
  // tracks how many maps finisehd loading their data layers
  const loadedCount = useRef(0)

  // The chartFlyFired ref prevents the flyTo animation from triggering multiple times

  const chartFlyFired = useRef(false)

  const [activeStep,    setActiveStep]    = useState(0)
  const [mapLoaded,     setMapLoaded]     = useState(false)
  const [showChart,     setShowChart]     = useState(false)
  const [accessPopData, setAccessPopData] = useState(null)

  //Initializies both maps 

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
        // Resize both maps BEFORE setting mapLoaded.
        // Mapbox calculates canvas dimensions at initialization — if the component
        // mounts inside a sticky flex layout that has zero height at that moment
        // (common with SSR or deferred rendering), the canvas will be blank.
        // Calling resize() after both maps finish loading forces a recalculation
        // using the actual DOM dimensions that exist after layout settles.
        mapLeft.current.resize()
        mapRight.current.resize()
        setMapLoaded(true)
      }
    }

    mapLeft.current.on('load', () => onLoad(mapLeft.current, 'left', GAUTENG_GEOJSON))
    mapRight.current.on('load', () => onLoad(mapRight.current, 'right', KZN_GEOJSON))

    return () => {
      mapLeft.current?.remove();  mapLeft.current  = null
      mapRight.current?.remove(); mapRight.current = null
    }
  }, [])

  //Chart data fetch 

  useEffect(() => {
    Promise.all([
      fetch(GAUTENG_GEOJSON).then(r => r.json()),
      fetch(KZN_GEOJSON).then(r => r.json()),
    ]).then(([gp, kzn]) => {
      const combined = { type: 'FeatureCollection', features: [...gp.features, ...kzn.features] }
      setAccessPopData(buildAccessPopData(combined))
    }).catch(() => {})
  }, [])

  // Scrollama set up 

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
        if (STEPS[index].showChart) {
          setShowChart(false)
          chartFlyFired.current = false
        }
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

        {/* n5__graphic: position:sticky keeps it fixed while .n5__steps scrolls.
            position:relative is required for absolutely-positioned overlays inside. */}
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

         {/* Standard legend — shown when step has a legend, no chart, no special overlays */}
          {step?.legend && !showChart && !step?.showDensityLegend && !step?.isClosing && (
            <MapLegend items={step.legend} title={step.legendTitle} />
          )}

          {/* Density ramp legend — shown only for step 5 (density-fill layer) */}
          {step?.showDensityLegend && !showChart && !step?.isClosing && (
            <DensityLegend />
          )}

          {/* Chart overlay — covers the full graphic panel when showChart is true.
              position:absolute + inset:0 fills .n5__graphic (position:relative parent).
              background rgba provides legibility without fully hiding the map. */}
          {showChart && step?.chartType === 'access-pop' && (
            <div className="n5__chart-overlay n5__chart-overlay--visible">
              <AccessPopChart data={accessPopData} />
            </div>
          )}

          {/* Closing overlay — dark full-panel card for the final narrative step.
              Appears when step.isClosing is true; replaces map with a pull quote. */}
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