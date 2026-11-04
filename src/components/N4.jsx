import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import * as d3 from 'd3'
import StepCard from './StepCard'
import './n4.css'
import {
  ACCESS_TYPOLOGY_CLASSES,
  ACCESS_TYPOLOGY_COLORS,
  EMPTY_TYPOLOGY_NOTE,
  POPULATION_GROUPS,
  SETTLEMENT_TYPES,
  SETTLEMENT_TYPE_COLORS,
  beyondThresholdExpression,
  isBeyondThreshold,
  settlementTypeOf,
} from '../constants/dataContract'
import { PHARMACY_DOT_PAINT, RACE_COLORS } from '../constants/mapStyles'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
const BASE = import.meta.env.BASE_URL || '/'

const TOWNSHIPS = {
  ohb: {
    label: 'Olievenhoutbosch, Gauteng',
    data: `${BASE}data/olievenhoutbosch.geojson`,
    center: [28.09933, -25.91161],
    zoom: 12,
  },
  kwamashu: {
    label: 'KwaMashu, KwaZulu-Natal',
    data: `${BASE}data/kwamashu.geojson`,
    center: [30.999595108490706, -29.742955059262513],
    zoom: 12.5,
  },
}

const SHOW_TYPOLOGY_SHARES = false

const EMPTY_FEATURE_COLLECTION = { type: 'FeatureCollection', features: [] }

const POPULATION_GROUP_KEYS = POPULATION_GROUPS.map(group => group.key)

const POPULATION_GROUP_FIELD_BY_KEY = Object.fromEntries(
  POPULATION_GROUPS.map(group => [group.key, group.field]),
)

const ACCESS_TYPOLOGY_DEFINITIONS = {
  'Pharmacy Desert': 'The area is far from pharmacies by walking.',
  'Access Gap': 'Walking access to a pharmacy is limited.',
  'Connectivity Gap': 'Road or network connectivity limits access.',
  'Demand Overcrowding': 'Pharmacy access is strained by high local demand.',
  'Artifact Zone': 'A high access score is driven by low local demand.',
  'Well-Served': 'Walking access to pharmacies is good.',
}

const DISTANCE_LEGEND = [
  { color: '#C0392B', label: '>3 km to nearest pharmacy' },
  { color: '#2980B9', label: '≤3 km to nearest pharmacy' },
  { color: PHARMACY_DOT_PAINT['circle-color'], label: 'Pharmacy' },
]

const SETTLEMENT_TYPE_FILL_EXPRESSION = [
  'match',
  ['get', 'settlement'],
  ...SETTLEMENT_TYPES.flatMap(type => [type, SETTLEMENT_TYPE_COLORS[type]]),
  SETTLEMENT_TYPE_COLORS['No Dwellings (2011)'],
]

const ACCESS_TYPOLOGY_FILL_EXPRESSION = [
  'match',
  ['get', 'wlk_type'],
  ...ACCESS_TYPOLOGY_CLASSES.flatMap(type => [type, ACCESS_TYPOLOGY_COLORS[type]]),
  '#CCCCCC',
]

const DISTANCE_3KM_COLOR = [
  'case',
  beyondThresholdExpression('wlk_k1_km', 'walk'),
  '#C0392B',
  '#2980B9',
]

function settlementTypeLegendItems(analysis) {
  if (!analysis) return []
  return SETTLEMENT_TYPES
    .filter(type => analysis.settlementCounts[type])
    .map(type => ({ color: SETTLEMENT_TYPE_COLORS[type], label: type }))
}

function typologyLegendItems(analysis) {
  if (!analysis) return []
  return ACCESS_TYPOLOGY_CLASSES
    .filter(type => analysis.typologyCounts[type])
    .map(type => ({ color: ACCESS_TYPOLOGY_COLORS[type], label: type }))
}

function legendForStep(step, analysis) {
  if (step.topic === 'distance') return DISTANCE_LEGEND
  if (step.topic === 'typology') {
    return analysis
      ? [...typologyLegendItems(analysis), { color: PHARMACY_DOT_PAINT['circle-color'], label: 'Pharmacy' }]
      : []
  }
  if (step.topic === 'ea-type' || step.topic === 'race') {
    return settlementTypeLegendItems(analysis)
  }
  return []
}

const STEPS = [
  {
    township: 'ohb',
    topic: 'extent',
    eyebrow: 'Olievenhoutbosch, City of Tshwane, Gauteng',
    heading: 'Olievenhoutbosch Study Area',
    body: 'There are 82 SALs in the Olievenhoutbosch township. Olievenhoutbosch is located between major cities like Midrand, Centurion, and Pretoria. Let us examine the pharmacy access conditions.  ',
    layers: ['extent-fill', 'extent-line'],
    zoom: 12.2,
  },
  {
    township: 'ohb',
    topic: 'ea-type',
    eyebrow: 'Olievenhoutbosch, City of Tshwane, Gauteng / Neighborhood type',
    heading: 'Census neighborhood types across Olievenhoutbosch',
    body: 'The neighborhood type classification filtered to Olievenhoutbosch shows Township, Informal Settlement, and No Dwellings (2011) areas. These metrics are derived from the South African census data.',
    layers: ['extent-fill', 'extent-line', 'ea-type', 'ea-type-line'],
    legendTitle: 'Settlement Type',
    zoom: 13,
  },
  {
    township: 'ohb',
    topic: 'race',
    eyebrow: 'Olievenhoutbosch, Gauteng / Population',
    heading: 'Population Group composition by neighborhood type',
    body: 'Beyond this portion shows a bar chart of the Population Group mix (2011 Census) by neighborhood type in Olievenhoutbosch. The Population Group mix of Olievenhoutbosch is as follows: Black African 98.0%, Coloured 0.6%, Indian/Asian 0.2%, White 0.1%, and Other 1.2%.',
    layers: ['extent-fill', 'extent-line', 'ea-type', 'ea-type-line'],
    legendTitle: 'Settlement Type',
    showChart: true,
    zoom: 13.5,
  },
  {
    township: 'ohb',
    topic: 'distance',
    eyebrow: 'Olievenhoutbosch, Gauteng / Walking distance',
    heading: 'Which areas are more than 3 km from a pharmacy?',
    body: 'There are about 4 private pharmacies in Olievenhoutbosch, 81 of 82 SALs are within a 3 km walk of a pharmacy. ',
    layers: ['extent-line', 'distance', 'pharmacies'],
    legendTitle: 'Walking Distance to Nearest Pharmacy',
    zoom: 12.5,
  },
  {
    township: 'ohb',
    topic: 'typology',
    eyebrow: 'Olievenhoutbosch, Gauteng / Walk access',
    heading: 'Walk-access typology',
    body: 'The final layer distinguishes Pharmacy Deserts from other access conditions. These are the walking metrics. 30 of the 82 SALs are classified as "Well-Served". Distance is not the problem, crowding is. Half of residents live where a pharmacy is close but shared by many people, and only 43.5% live in Well-Served areas.',
    layers: ['extent-line', 'walk-typology', 'pharmacies'],
    legendTitle: 'Walking Access Typology',
    zoom: 12.5,
  },
  {
    township: 'kwamashu',
    topic: 'extent',
    eyebrow: 'KwaMashu, KwaZulu-Natal',
    heading: 'KwaMashu study area',
    body: 'Moving on to KwaMashu, this is a township in KwaZulu-Natal. KwaMashu is located west of Durban and has more SALs than Olievenhoutbosch. Let us examine the pharmacy access conditions.',
    layers: ['extent-fill', 'extent-line'],
    zoom: 12,
  },
  {
    township: 'kwamashu',
    topic: 'ea-type',
    eyebrow: 'KwaMashu, KwaZulu-Natal / Neighborhood type',
    heading: 'Census neighborhood types across KwaMashu',
    body: 'The neighborhood type classification filtered to KwaMashu shows Township, Informal Settlement, and No Dwellings (2011) areas.',
    layers: ['extent-fill', 'extent-line', 'ea-type', 'ea-type-line'],
    legendTitle: 'Settlement Type',
    zoom: 12.2,
  },
  {
    township: 'kwamashu',
    topic: 'race',
    eyebrow: 'KwaMashu, KwaZulu-Natal / Population',
    heading: 'Population Group composition by neighborhood type',
    body: 'Below this portion shows a bar chart of the Population Group mix (2011 Census) by neighborhood type in KwaMashu. The Population Group mix of KwaMashu is as follows: Black African 98.6%, Coloured 0.2%, Indian/Asian 1.0%, White 0.1%, and Other 0.1%.',
    layers: ['extent-fill', 'extent-line', 'ea-type', 'ea-type-line'],
    legendTitle: 'Settlement Type',
    showChart: true,
    zoom: 12.25,
  },
  {
    township: 'kwamashu',
    topic: 'distance',
    eyebrow: 'KwaMashu, KwaZulu-Natal / Walking distance',
    heading: 'Which areas are more than 3 km from a pharmacy?',
    body: 'The SALs are classified from their measured walking distance to the nearest pharmacy. About 8.3% of the SALs in KwaMashu (21 of 253) are more than 3 km from a pharmacy on foot, mostly in the east. The farthest is 4.4 km',
    layers: ['extent-line', 'distance', 'pharmacies'],
    legendTitle: 'Walking Distance to Nearest Pharmacy',
    zoom: 12.4,
  },
  {
    township: 'kwamashu',
    topic: 'typology',
    eyebrow: 'KwaMashu, KwaZulu-Natal / Walk access',
    heading: 'Walk-access typology',
    body: 'Only 36.4% of residents live in a Well-Served area. The 21 SALs beyond 3 km are all Pharmacy Deserts.',
    layers: ['extent-line', 'walk-typology', 'pharmacies'],
    legendTitle: 'Walking Access Typology',
    zoom: 12.5,
  },
]

const AREA_LAYERS = [
  'extent-fill',
  'extent-line',
  'ea-type',
  'ea-type-line',
  'distance',
  'walk-typology',
]

function numericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function removeExactDuplicateFeatures(features) {
  const seen = new Set()
  return features.filter(feature => {
    const code = feature.properties?.EA_CODE
    if (code == null || !feature.geometry) return true

    const key = `${code}:${JSON.stringify(feature.geometry)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildTownshipAnalysis(geojson) {
  if (!Array.isArray(geojson?.features)) {
    throw new Error('Township data is not a GeoJSON FeatureCollection.')
  }

  const features = removeExactDuplicateFeatures(geojson.features)
  const groups = new Map()
  const settlementCounts = {}
  const typologyCounts = {}
  const typologyPopulation = {}
  const walkDistances = []
  const distance = { over3km: 0, within3km: 0 }
  let population = 0

  for (const feature of features) {
    const properties = feature.properties ?? {}
    const settlement = settlementTypeOf(properties.EA_TYPE)
    const featurePopulation = numericValue(properties.pop2023est)
    population += featurePopulation

    if (settlement) settlementCounts[settlement] = (settlementCounts[settlement] ?? 0) + 1

    const rawDistance = properties.wlk_k1_km
    const walkDistance = typeof rawDistance === 'number'
      ? rawDistance
      : typeof rawDistance === 'string' && rawDistance.trim()
        ? Number(rawDistance)
        : Number.NaN

    if (Number.isFinite(walkDistance)) walkDistances.push(walkDistance)
    if (isBeyondThreshold(walkDistance, 'walk')) distance.over3km += 1
    else distance.within3km += 1

    const typology = properties.wlk_type
    if (typeof typology === 'string') {
      typologyCounts[typology] = (typologyCounts[typology] ?? 0) + 1
      typologyPopulation[typology] =
        (typologyPopulation[typology] ?? 0) + featurePopulation
    }

    if (!settlement) continue

    if (!groups.has(settlement)) {
      groups.set(settlement, {
        population: 0,
        area: 0,
        groups: Object.fromEntries(POPULATION_GROUP_KEYS.map(key => [key, 0])),
      })
    }

    const group = groups.get(settlement)
    group.population += featurePopulation
    group.area += numericValue(properties.area_km2)
    for (const [key, field] of Object.entries(POPULATION_GROUP_FIELD_BY_KEY)) {
      group.groups[key] += numericValue(properties[field])
    }
  }

  const chartTypes = SETTLEMENT_TYPES.filter(
    type => type !== 'No Dwellings (2011)' && groups.get(type)?.population > 0,
  )

  const chartData = chartTypes.map(type => {
    const group = groups.get(type)
    const groupTotal = POPULATION_GROUP_KEYS.reduce(
      (sum, key) => sum + group.groups[key],
      0,
    )

    return {
      type,
      density: group.area > 0 ? Math.round(group.population / group.area) : 0,
      ...Object.fromEntries(
        POPULATION_GROUP_KEYS.map(key => [
          key,
          groupTotal > 0 ? Math.round((group.groups[key] / groupTotal) * 100) : 0,
        ]),
      ),
    }
  })

  return {
    featureCount: features.length,
    sourceFeatureCount: geojson.features.length,
    duplicateFeatureCount: geojson.features.length - features.length,
    geojson: { ...geojson, features },
    settlementCounts,
    typologyCounts,
    typologyPopulation,
    population,
    distance: { ...distance, median: d3.median(walkDistances) },
    chartData,
  }
}

const CHART_MARGIN = { top: 24, right: 32, bottom: 60, left: 8 }
const CHART_MAX_HEIGHT = 150

function drawTownshipChart(svgElement, width, chartData) {
  if (!svgElement || !width || !chartData?.length) return

  const height = CHART_MAX_HEIGHT + CHART_MARGIN.top + CHART_MARGIN.bottom
  const maxWidth = Math.min(width, 760)
  const offsetX = (width - maxWidth) / 2
  const innerWidth = maxWidth - CHART_MARGIN.left - CHART_MARGIN.right
  const svg = d3.select(svgElement).attr('width', width).attr('height', height)
  svg.selectAll('*').remove()

  const root = svg.append('g')
    .attr('transform', `translate(${offsetX + CHART_MARGIN.left},${CHART_MARGIN.top})`)
  const x = d3.scaleBand()
    .domain(chartData.map(row => row.type))
    .range([0, innerWidth])
    .paddingInner(0.3)
    .paddingOuter(0.1)
  const maxDensity = d3.max(chartData, row => row.density) || 1
  const densityScale = d3.scaleLinear().domain([0, maxDensity]).range([0, CHART_MAX_HEIGHT])
  const stack = d3.stack().keys(POPULATION_GROUP_KEYS).value((row, key) => row[key] ?? 0)
  const layers = stack(chartData)

  root.selectAll('.n4-chart-gridline')
    .data([25, 50, 75])
    .join('line')
    .attr('class', 'n4-chart-gridline')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', value => CHART_MAX_HEIGHT - (value / 100) * CHART_MAX_HEIGHT)
    .attr('y2', value => CHART_MAX_HEIGHT - (value / 100) * CHART_MAX_HEIGHT)
    .attr('stroke', 'rgba(60,60,80,0.08)')
    .attr('stroke-dasharray', '3,4')

  const bars = root.selectAll('.n4-chart-bar')
    .data(chartData, row => row.type)
    .join('g')
    .attr('class', 'n4-chart-bar')
    .attr('transform', row => `translate(${x(row.type)},0)`)

  layers.forEach((layer, index) => {
    bars.selectAll(`.n4-chart-segment-${index}`)
      .data(row => [{
        row,
        segment: layer.find(item => item.data.type === row.type),
      }])
      .join('rect')
      .attr('class', `n4-chart-segment-${index}`)
      .attr('x', 0)
      .attr('width', x.bandwidth())
      .attr('fill', RACE_COLORS[layer.key])
      .attr('y', ({ row, segment }) =>
        CHART_MAX_HEIGHT - densityScale(row.density) +
        (segment[0] / 100) * densityScale(row.density))
      .attr('height', ({ row, segment }) =>
        Math.max(0, ((segment[1] - segment[0]) / 100) * densityScale(row.density)))
  })

  bars.append('text')
    .attr('class', 'n4-chart-density')
    .attr('x', x.bandwidth() / 2)
    .attr('y', row => CHART_MAX_HEIGHT - densityScale(row.density) - 5)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('font-weight', '600')
    .attr('fill', '#2C3E6B')
    .text(row => row.density >= 1000
      ? `${(row.density / 1000).toFixed(1)}k people/km²`
      : `${row.density.toLocaleString('en-ZA')} people/km²`)

  bars.selectAll('.n4-chart-x-label')
    .data(row => row.type.split('\n').map((line, index) => ({ line, index })))
    .join('text')
    .attr('class', 'n4-chart-x-label')
    .attr('x', x.bandwidth() / 2)
    .attr('y', ({ index }) => CHART_MAX_HEIGHT + 14 + index * 11)
    .attr('text-anchor', 'middle')
    .attr('font-size', '8.5px')
    .attr('fill', 'rgba(40,40,60,0.55)')
    .text(({ line }) => line)
}

function addAreaLayers(map, township) {
  const source = `${township}-areas`
  map.addSource(source, { type: 'geojson', data: EMPTY_FEATURE_COLLECTION })

  map.addLayer({
    id: `${township}-extent-fill`,
    type: 'fill',
    source,
    layout: { visibility: 'none' },
    paint: { 'fill-color': '#8B2500', 'fill-opacity': 0.07 },
  })
  map.addLayer({
    id: `${township}-extent-line`,
    type: 'line',
    source,
    layout: { visibility: 'none' },
    paint: {
      'line-color': '#4A342E',
      'line-width': 1.5,
      'line-dasharray': [2, 1],
      'line-opacity': 0.8,
    },
  })
  map.addLayer({
    id: `${township}-ea-type`,
    type: 'fill',
    source,
    layout: { visibility: 'none' },
    paint: { 'fill-color': SETTLEMENT_TYPE_FILL_EXPRESSION, 'fill-opacity': 0.76 },
  })
  map.addLayer({
    id: `${township}-ea-type-line`,
    type: 'line',
    source,
    layout: { visibility: 'none' },
    paint: { 'line-color': '#ffffff', 'line-width': 0.45, 'line-opacity': 0.55 },
  })
  map.addLayer({
    id: `${township}-distance`,
    type: 'fill',
    source,
    layout: { visibility: 'none' },
    paint: { 'fill-color': DISTANCE_3KM_COLOR, 'fill-opacity': 0.78 },
  })
  map.addLayer({
    id: `${township}-walk-typology`,
    type: 'fill',
    source,
    layout: { visibility: 'none' },
    paint: { 'fill-color': ACCESS_TYPOLOGY_FILL_EXPRESSION, 'fill-opacity': 0.84 },
  })
}

function setStepLayers(map, step) {
  for (const township of Object.keys(TOWNSHIPS)) {
    for (const layer of AREA_LAYERS) {
      const id = `${township}-${layer}`
      if (map.getLayer(id)) {
        const visible = township === step.township && step.layers.includes(layer)
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
      }
    }
  }

  if (map.getLayer('pharmacies')) {
    map.setLayoutProperty(
      'pharmacies',
      'visibility',
      step.layers.includes('pharmacies') ? 'visible' : 'none',
    )
  }
}

function MapLegend({ items, title, compact = false, note = null }) {
  return (
    <div className={`n4__map-legend ${compact ? 'n4__map-legend--typology' : ''}`}>
      {title && <span className="n4__map-legend-title">{title}</span>}
      {items.map(({ color, label }) => (
        <span key={label} className="n4__map-legend-item">
          <span className="n4__map-legend-swatch" style={{ background: color }} />
          {label}
        </span>
      ))}
      {note && <span className="n4__map-legend-note">{note}</span>}
    </div>
  )
}

function MapSummary({ step, analysis }) {
  if (!analysis) return null
  const typologyRows = step.topic === 'typology'
    ? ACCESS_TYPOLOGY_CLASSES
      .filter(type => analysis.typologyCounts[type])
      .map(type => [type, ACCESS_TYPOLOGY_DEFINITIONS[type]])
    : []

  let rows = []
  if (step.topic === 'ea-type' || step.topic === 'race') {
    rows = SETTLEMENT_TYPES
      .filter(type => analysis.settlementCounts[type])
      .map(type => [type, analysis.settlementCounts[type]])
  } else if (step.topic === 'typology') {
    rows = ACCESS_TYPOLOGY_CLASSES
      .filter(type => analysis.typologyCounts[type])
      .map(type => [type, analysis.typologyCounts[type]])
  }

  return (
    <div className="n4__map-summary" aria-live="polite">
      <span className="n4__map-summary-title">
        {TOWNSHIPS[step.township].label}
      </span>
      <span>
        {analysis.featureCount} {analysis.featureCount === 1 ? 'area' : 'areas'}
      </span>
      {step.topic === 'distance' ? (
        <>
          <strong>
            {analysis.distance.within3km} of {analysis.distance.within3km + analysis.distance.over3km} areas within 3 km
          </strong>
          <span>
            {analysis.distance.over3km} {analysis.distance.over3km === 1 ? 'area' : 'areas'} beyond 3 km
          </span>
        </>
      ) : (
        <ul>
          {rows.map(([label, count]) => (
            <li key={label}><span>{label}</span><strong>{count}</strong></li>
          ))}
        </ul>
      )}
      {step.topic === 'typology' && (
        <details className="n4__map-summary-definitions">
          <summary>What these mean</summary>
          <ul>
            {typologyRows.map(([type, definition]) => (
              <li key={type}>
                <span><strong>{type}</strong> — {definition}</span>
                {SHOW_TYPOLOGY_SHARES && (
                  <strong>
                    {analysis.population > 0
                      ? `${((analysis.typologyPopulation[type] / analysis.population) * 100).toLocaleString('en-ZA', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}%`
                      : '0.0%'}
                  </strong>
                )}
              </li>
            ))}
          </ul>
          <span className="n4__map-summary-note">
          </span>
        </details>
      )}
    </div>
  )
}

export default function N4() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const chartContainer = useRef(null)
  const svgRef = useRef(null)

  const [activeStep, setActiveStep] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [analysisByTownship, setAnalysisByTownship] = useState({})
  const [chartError, setChartError] = useState(null)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    const storyMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: TOWNSHIPS.ohb.center,
      zoom: TOWNSHIPS.ohb.zoom,
      interactive: false,
    })
    map.current = storyMap

    storyMap.on('load', () => {
      if (map.current !== storyMap) return

      addAreaLayers(storyMap, 'ohb')
      addAreaLayers(storyMap, 'kwamashu')
      storyMap.addSource('pharmacy-points', {
        type: 'geojson',
        data: `${BASE}data/pharmacies.geojson`,
      })
      storyMap.addLayer({
        id: 'pharmacies',
        type: 'circle',
        source: 'pharmacy-points',
        layout: { visibility: 'none' },
        paint: {
          ...PHARMACY_DOT_PAINT,
        },
      })

      window._map = storyMap
      storyMap.resize()
      setMapLoaded(true)
    })
    storyMap.on('error', event => console.warn('N4 map error:', event.error ?? event))

    return () => {
      storyMap.remove()
      if (map.current === storyMap) map.current = null
      if (window._map === storyMap) delete window._map
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadAnalysis = async () => {
      try {
        const responses = await Promise.all(
          Object.entries(TOWNSHIPS).map(async ([key, township]) => {
            const response = await fetch(township.data)
            if (!response.ok) {
              throw new Error(`Unable to load ${township.label} data (${response.status}).`)
            }
            return [key, buildTownshipAnalysis(await response.json())]
          }),
        )
        if (!cancelled) setAnalysisByTownship(Object.fromEntries(responses))
      } catch (error) {
        console.error('N4 township analysis data failed to load:', error)
        if (!cancelled) setChartError(error)
      }
    }

    loadAnalysis()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !map.current) return

    for (const [township, analysis] of Object.entries(analysisByTownship)) {
      const source = map.current.getSource(`${township}-areas`)
      if (source && 'setData' in source) source.setData(analysis.geojson)
    }
  }, [mapLoaded, analysisByTownship])

  useEffect(() => {
    if (!mapLoaded || !map.current) return

    const scroller = scrollama()
    scroller
      .setup({ step: '.n4 .step-card', offset: 0.8, progress: true })
      .onStepEnter(({ index }) => {
        const step = STEPS[index]
        if (!step) return

        setActiveStep(index)
        setShowChart(false)
        setStepLayers(map.current, step)
        map.current.flyTo({
          center: TOWNSHIPS[step.township].center,
          zoom: step.zoom,
          duration: 2200,
          essential: true,
        })
      })
      .onStepProgress(({ index, progress }) => {
        setShowChart(Boolean(STEPS[index]?.showChart && progress > 0.72))
      })
      .onStepExit(() => {
        setShowChart(false)
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  const step = STEPS[activeStep]
  const analysis = analysisByTownship[step.township]
  const chartData = analysis?.chartData
  const legendItems = legendForStep(step, analysis)

  useEffect(() => {
    if (!showChart || !chartContainer.current || !svgRef.current || !chartData) return
    drawTownshipChart(
      svgRef.current,
      chartContainer.current.getBoundingClientRect().width,
      chartData,
    )
  }, [showChart, chartData])

  useEffect(() => {
    if (!chartContainer.current) return
    const observer = new ResizeObserver(() => {
      if (!showChart || !chartContainer.current || !svgRef.current || !chartData) return
      drawTownshipChart(
        svgRef.current,
        chartContainer.current.getBoundingClientRect().width,
        chartData,
      )
    })
    observer.observe(chartContainer.current)
    return () => observer.disconnect()
  }, [showChart, chartData])

  return (
    <section className="n4" id="n4">
      <div className="n4__steps">
        {STEPS.map((storyStep, index) => (
          <StepCard
            key={`${storyStep.township}-${storyStep.topic}`}
            {...storyStep}
            isActive={activeStep === index}
            variant="pharmacy"
          />
        ))}
      </div>

      <div className="n4__graphic">
        <span className="n4__map-label">{TOWNSHIPS[step.township].label}</span>
        <div
          ref={mapContainer}
          className="n4__map"
          style={{
            opacity: showChart ? 0.62 : 1,
            transition: 'opacity 0.7s ease',
          }}
        />

        {legendItems.length > 0 && !showChart && (
          <MapLegend
            items={legendItems}
            title={step.legendTitle}
            compact={step.topic === 'typology'}
            note={step.topic === 'typology' ? EMPTY_TYPOLOGY_NOTE : null}
          />
        )}
        <MapSummary step={step} analysis={analysis} />

        <div
          ref={chartContainer}
          className={`n4__chart-overlay ${showChart ? 'n4__chart-overlay--visible' : ''}`}
        >
          <div className="n4__chart-header">
            <p className="n4__chart-eyebrow">
              {TOWNSHIPS[step.township].label} / Population Density and Population Group Composition by Settlement Type
            </p>
            {showChart && (
              <div className="n4__chart-legend">
                {POPULATION_GROUPS.map(group => (
                  <span key={group.key} className="n4__legend-item">
                    <span className="n4__legend-swatch" style={{ background: RACE_COLORS[group.key] }} />
                    {group.label}
                  </span>
                ))}
              </div>
            )}
          </div>


          {showChart && chartError && (
            <p className="n4__chart-error" role="alert">
              Township demographics could not be loaded: {chartError.message}
            </p>
          )}
          {showChart && !chartError && !chartData && (
            <p className="n4__chart-loading">Loading township demographics...</p>
          )}
          <svg ref={svgRef} style={{ display: 'block', overflow: 'visible' }} />
          <p className="n4__chart-source">
            Population Group (2011 Census) counts and Settlement Type from township SAL polygons; density uses 2023 modeled population / km².
          </p>
        </div>
      </div>
    </section>
  )
}
