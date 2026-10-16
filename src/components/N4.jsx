import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import * as d3 from 'd3'
import StepCard from './StepCard'
import './n4.css'
import {
  EA_TYPE_FILL_EXPRESSION,
  EA_TYPE_COLORS,
  EA_TYPE_LABELS,
  EA_TYPE_ORDER,
  RACE_KEYS,
  RACE_COLORS,
  RACE_LABELS,
  RACE_PROPERTY_MAP,
  WALK_TYPOLOGY_COLORS,
} from '../constants/mapStyles'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
const BASE = import.meta.env.BASE_URL || '/'

const TOWNSHIPS = {
  ohb: {
    label: 'Olievenhoutbosch / Gauteng',
    data: `${BASE}data/olievenhoutbosch.geojson`,
    center: [28.09933, -25.91161],
    zoom: 12,
  },
  kwamashu: {
    label: 'KwaMashu / KwaZulu-Natal',
    data: `${BASE}data/kwamashu.geojson`,
    center: [30.999595108490706, -29.742955059262513],
    zoom: 12.5,
  },
}

const EMPTY_FEATURE_COLLECTION = { type: 'FeatureCollection', features: [] }

const EA_TYPE_LEGEND = [
  { color: EA_TYPE_COLORS.Township, label: 'Township' },
  { color: EA_TYPE_COLORS['Informal residential'], label: 'Informal residential' },
  { color: EA_TYPE_COLORS['Formal residential'], label: 'Formal residential / suburb' },
  { color: EA_TYPE_COLORS.Vacant, label: 'Vacant' },
  { color: EA_TYPE_COLORS['Collective living quarters'], label: 'Collective living quarters' },
]

const DISTANCE_LEGEND = [
  { color: '#C0392B', label: '>3 km to nearest pharmacy' },
  { color: '#2980B9', label: '≤3 km to nearest pharmacy' },
  { color: '#B0A090', label: 'No routed distance' },
  { color: '#007A4D', label: 'Pharmacy' },
]

const WALK_TYPOLOGY_LEGEND = [
  ...Object.entries(WALK_TYPOLOGY_COLORS).map(([label, color]) => ({ label, color })),
  { color: '#007A4D', label: 'Pharmacy' },
]

const WALK_TYPOLOGY_COLOR = [
  'match',
  ['get', 'walk_typology'],
  ...Object.entries(WALK_TYPOLOGY_COLORS).flat(),
  '#CCCCCC',
]

const DISTANCE_3KM_COLOR = [
  'case',
  ['==', ['get', 'walk_dist_k1_km'], null], '#B0A090',
  ['>', ['get', 'walk_dist_k1_km'], 3], '#C0392B',
  '#2980B9',
]

const STEPS = [
  {
    township: 'ohb',
    topic: 'extent',
    eyebrow: 'Olievenhoutbosch, City of Tshwane, Gauteng',
    heading: 'Olievenhoutbosch Study Area',
    body: 'There are 82 enumeration areas in the Olievenhoutbosch township. Olievenhoutbosch is located between major cities like Midrand, Centurion, and Pretoria. Let us examine the pharmacy access conditions.  ',
    layers: ['extent-fill', 'extent-line'],
    zoom: 13.5,
  },
  {
    township: 'ohb',
    topic: 'ea-type',
    eyebrow: 'Olievenhoutbosch, City of Tshwane, Gauteng / Neighborhood type',
    heading: 'Census neighborhood types across Olievenhoutbosch',
    body: 'The neighborhood type classification filtered to Olievenhoutbosch shows township, informal residential, and vacant areas. These metrics are derived from the South African census data.',
    layers: ['extent-fill', 'extent-line', 'ea-type', 'ea-type-line'],
    legend: EA_TYPE_LEGEND,
    legendTitle: 'Neighborhood type',
    zoom: 13.5,
  },
  {
    township: 'ohb',
    topic: 'race',
    eyebrow: 'Olievenhoutbosch, Gauteng / Population',
    heading: 'Racial composition by neighborhood type',
    body: 'Beyond this portion shows a barchart of the racial distribution by nieghborhood type in Olievenhoutbosch. Black Africans are the majority at [X% share], followed by [Y% share] of Coloured, [Z% share] of Indian/Asian.',
    layers: ['extent-fill', 'extent-line', 'ea-type', 'ea-type-line'],
    legend: EA_TYPE_LEGEND,
    legendTitle: 'Neighborhood type',
    showChart: true,
    zoom: 13.5,
  },
  {
    township: 'ohb',
    topic: 'distance',
    eyebrow: 'Olievenhoutbosch, Gauteng / Walking distance',
    heading: 'Which areas are more than 3 km from a pharmacy?',
    body: 'Polygons are classified from their measured walking distance to the nearest pharmacy. There are about 4 private pharmacies in Olievenhoutbosch, and almost all of the enumerated areas are within 3 km except the easternmost area. ',
    layers: ['extent-line', 'distance', 'pharmacies'],
    legend: DISTANCE_LEGEND,
    legendTitle: 'Nearest-pharmacy walking distance',
    zoom: 12.5,
  },
  {
    township: 'ohb',
    topic: 'typology',
    eyebrow: 'Olievenhoutbosch, Gauteng / Walk access',
    heading: 'Walk-access typology',
    body: 'The final layer distinguishes pharmacy deserts from other access conditions. These are the walking metrics. 30 of the 82 enumeartion areas are classified as "well-served"; this is not a majority. This means XYZ. But in regarding the historical context of townships, finding ABC.',
    layers: ['extent-line', 'walk-typology', 'pharmacies'],
    legend: WALK_TYPOLOGY_LEGEND,
    legendTitle: 'Walk-access typology',
    zoom: 12.5,
  },
  {
    township: 'kwamashu',
    topic: 'extent',
    eyebrow: 'KwaMashu, KwaZulu-Natal',
    heading: 'KwaMashu study area',
    body: 'Moving on to KwaMashu, this is a township in KwaZulu-Natal. KwaMashu is located west of Durban and has larger enumeration areas. Let us examine the pharmacy access conditions.',
    layers: ['extent-fill', 'extent-line'],
    zoom: 12,
  },
  {
    township: 'kwamashu',
    topic: 'ea-type',
    eyebrow: 'KwaMashu, KwaZulu-Natal / Neighborhood type',
    heading: 'Census neighborhood types across KwaMashu',
    body: 'The neighborhood type classification filtered to KwaMashu shows township, informal residential, formal residential and vacant census areas.',
    layers: ['extent-fill', 'extent-line', 'ea-type', 'ea-type-line'],
    legend: EA_TYPE_LEGEND,
    legendTitle: 'Neighborhood type',
    zoom: 12.2,
  },
  {
    township: 'kwamashu',
    topic: 'race',
    eyebrow: 'KwaMashu, KwaZulu-Natal / Population',
    heading: 'Racial composition by neighborhood type',
    body: 'Below this portion shows a barchart of the racial distribution by nieghborhood type in KwaMashu. Black Africans are the majority at [X% share], followed by [Y% share] of Coloured, [Z% share] of Indian/Asian.',
    layers: ['extent-fill', 'extent-line', 'ea-type', 'ea-type-line'],
    legend: EA_TYPE_LEGEND,
    legendTitle: 'Neighborhood type',
    showChart: true,
    zoom: 12.25,
  },
  {
    township: 'kwamashu',
    topic: 'distance',
    eyebrow: 'KwaMashu, KwaZulu-Natal / Walking distance',
    heading: 'Which areas are more than 3 km from a pharmacy?',
    body: 'The enumeration areas are classified from their measured walking distance to the nearest pharmacy. Almost all of the EAs in the eastern part of the township are more than 3 km from a pharmacy walking. That is over half the township.',
    layers: ['extent-line', 'distance', 'pharmacies'],
    legend: DISTANCE_LEGEND,
    legendTitle: 'Nearest-pharmacy walking distance',
    zoom: 12.4,
  },
  {
    township: 'kwamashu',
    topic: 'typology',
    eyebrow: 'KwaMashu, KwaZulu-Natal / Walk access',
    heading: 'Walk-access typology',
    body: 'The final layer distinguishes pharmacy deserts from other access conditions and routing-uncertain areas.',
    layers: ['extent-line', 'walk-typology', 'pharmacies'],
    legend: WALK_TYPOLOGY_LEGEND,
    legendTitle: 'Walk-access typology',
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

const RACE_PROPERTY_BY_LABEL = Object.fromEntries(
  Object.entries(RACE_PROPERTY_MAP).map(([property, label]) => [label, property]),
)

function normalizeEAType(value) {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/_\*$/, '')
  return normalized === 'Small holdings' ? 'Smallholdings' : normalized
}

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
  const eaTypeCounts = {}
  const typologyCounts = {}
  const distance = { over3km: 0, within3km: 0, unknown: 0 }

  for (const feature of features) {
    const properties = feature.properties ?? {}
    const type = normalizeEAType(properties.EA_TYPE)

    if (type) eaTypeCounts[type] = (eaTypeCounts[type] ?? 0) + 1

    const rawDistance = properties.walk_dist_k1_km
    const walkDistance = typeof rawDistance === 'number'
      ? rawDistance
      : typeof rawDistance === 'string' && rawDistance.trim()
        ? Number(rawDistance)
        : Number.NaN

    if (!Number.isFinite(walkDistance)) distance.unknown += 1
    else if (walkDistance > 3) distance.over3km += 1
    else distance.within3km += 1

    const typology = properties.walk_typology
    if (typeof typology === 'string') {
      typologyCounts[typology] = (typologyCounts[typology] ?? 0) + 1
    }

    if (!type) continue

    if (!groups.has(type)) {
      groups.set(type, {
        population: 0,
        area: 0,
        races: Object.fromEntries(RACE_KEYS.map(key => [key, 0])),
      })
    }

    const group = groups.get(type)
    group.population += numericValue(properties.sal2023_est)
    group.area += numericValue(properties.area_km2)
    for (const race of RACE_KEYS) {
      group.races[race] += numericValue(properties[RACE_PROPERTY_BY_LABEL[race]])
    }
  }

  const chartTypes = [
    ...EA_TYPE_ORDER.filter(type => groups.has(type)),
    ...[...groups.keys()].filter(type => !EA_TYPE_ORDER.includes(type)).sort(),
  ]
  const chartData = chartTypes.map(type => {
    const group = groups.get(type)

    const raceTotal = RACE_KEYS.reduce((sum, key) => sum + group.races[key], 0)

    return {
      type: EA_TYPE_LABELS[type] ?? type,
      density: group.area > 0 ? Math.round(group.population / group.area) : 0,
      ...Object.fromEntries(
        RACE_KEYS.map(key => [
          key,
          raceTotal > 0 ? Math.round((group.races[key] / raceTotal) * 100) : 0,
        ]),
      ),
    }
  })

  return {
    featureCount: features.length,
    sourceFeatureCount: geojson.features.length,
    duplicateFeatureCount: geojson.features.length - features.length,
    geojson: { ...geojson, features },
    eaTypeCounts,
    typologyCounts,
    distance,
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
  const stack = d3.stack().keys(RACE_KEYS).value((row, key) => row[key] ?? 0)
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
    .text(row => row.density >= 1000 ? `${(row.density / 1000).toFixed(1)}k` : row.density)

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
    paint: { 'fill-color': EA_TYPE_FILL_EXPRESSION, 'fill-opacity': 0.76 },
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
    paint: { 'fill-color': WALK_TYPOLOGY_COLOR, 'fill-opacity': 0.84 },
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

function MapLegend({ items, title }) {
  return (
    <div className="n4__map-legend">
      {title && <span className="n4__map-legend-title">{title}</span>}
      {items.map(({ color, label }) => (
        <span key={label} className="n4__map-legend-item">
          <span className="n4__map-legend-swatch" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

function MapSummary({ step, analysis }) {
  if (!analysis) return null

  let rows = []
  if (step.topic === 'ea-type' || step.topic === 'race') {
    rows = EA_TYPE_ORDER
      .filter(type => analysis.eaTypeCounts[type])
      .map(type => [`${EA_TYPE_LABELS[type] ?? type}`.replace('\n', ' '), analysis.eaTypeCounts[type]])
    for (const [type, count] of Object.entries(analysis.eaTypeCounts)) {
      if (!EA_TYPE_ORDER.includes(type)) rows.push([type.replace(/_\*$/, ''), count])
    }
  } else if (step.topic === 'typology') {
    rows = Object.entries(WALK_TYPOLOGY_COLORS)
      .filter(([type]) => analysis.typologyCounts[type])
      .map(([type]) => [type, analysis.typologyCounts[type]])
    for (const [type, count] of Object.entries(analysis.typologyCounts)) {
      if (!(type in WALK_TYPOLOGY_COLORS)) rows.push([type, count])
    }
  }

  return (
    <div className="n4__map-summary" aria-live="polite">
      <span className="n4__map-summary-title">
        {TOWNSHIPS[step.township].label} / {analysis.featureCount} unique EAs
      </span>
      <span>
        {analysis.sourceFeatureCount} source features
        {analysis.duplicateFeatureCount > 0 &&
          ` / ${analysis.duplicateFeatureCount} exact duplicate records excluded`}
      </span>
      {step.topic === 'distance' ? (
        <>
          <strong>{analysis.distance.over3km} areas over 3 km</strong>
          <span>{analysis.distance.within3km} within 3 km / {analysis.distance.unknown} unrouted</span>
        </>
      ) : (
        <ul>
          {rows.map(([label, count]) => (
            <li key={label}><span>{label}</span><strong>{count}</strong></li>
          ))}
        </ul>
      )}
      {step.topic === 'typology' && (
        <span className="n4__map-summary-note">
          Artifact zone reflects a high access score in a low-demand area; routing uncertainty is
          recorded separately by walk_snap_flag.
        </span>
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
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2, 12, 5],
          'circle-color': '#007A4D',
          'circle-opacity': 0.9,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
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

        {step.legend && !showChart && (
          <MapLegend items={step.legend} title={step.legendTitle} />
        )}
        <MapSummary step={step} analysis={analysis} />

        <div
          ref={chartContainer}
          className={`n4__chart-overlay ${showChart ? 'n4__chart-overlay--visible' : ''}`}
        >
          <div className="n4__chart-header">
            <p className="n4__chart-eyebrow">
              {TOWNSHIPS[step.township].label} / EA_TYPE / racial composition
            </p>
            {showChart && (
              <div className="n4__chart-legend">
                {RACE_KEYS.map(key => (
                  <span key={key} className="n4__legend-item">
                    <span className="n4__legend-swatch" style={{ background: RACE_COLORS[key] }} />
                    {RACE_LABELS[key]}
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
            Racial counts and EA_TYPE from township SAL polygons; density uses 2023 population estimate / km².
          </p>
        </div>
      </div>
    </section>
  )
}
