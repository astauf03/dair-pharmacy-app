import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import * as d3 from 'd3'
import StepCard from './StepCard'
import './n4.css'
import {
  CHART_EA_TYPES,
  EA_TYPE_ORDER,
  EA_TYPE_LABELS,
  RACE_KEYS,
  RACE_COLORS,
  RACE_LABELS,
  EA_TYPE_FILL_EXPRESSION,
} from '../constants/mapStyles'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const GAUTENG_GEOJSON  = '/data/gauteng_polygons.geojson'
const KZN_GEOJSON      = '/data/kzn_polygons.geojson'
const OHB_GEOJSON      = '/data/olievenhoutbosch.geojson'
const KWAMASHU_GEOJSON = '/data/kwamashu.geojson'
const PHARMACIES       = '/data/pharmacies.geojson'

const LEFT_DEFAULT  = { center: [28.09933, -25.91161], zoom: 12, label: 'Olievenhoutbosch · Gauteng' }
const RIGHT_DEFAULT = { center: [30.96, -29.80], zoom: 12, label: 'KwaMashu · Durban' }

const OHB_BBOX      = [27.94, -26.12, 28.24, -25.82]
const KWAMASHU_BBOX  = [30.81, -29.93, 31.11, -29.63]

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

const EXCEEDS_WALK_COLOR = [
  'match', ['get', 'exceeds_walk_k1_3km'],
  'True', '#C0392B',
  'False', '#3498DB',
  '#999999',
]

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

const STEPS = [
  //labels about study area names?
  {
    eyebrow: 'Township Deep Dive: Olievenhoutbosch and KwaMashu',
    heading: 'What surrounds each township?',
    body: "Olievenhoutbosch is a rapidly growing township in the Tshwane municipality of Gauteng, sitting at the edge of formal and informal settlement patterns. Its residential makeup is predominantly formal township housing, with a smaller informal residential component on its fringes [9].",
    body2: 'KwaMashu is a township located approximately 19 km north of Durban. It was formed between 1958 and 1965 from the displacement of communities living in the informal settlements of Umkhumbane (Cato Manor). Its founding was a deliberate product of apartheid spatial engineering [10].',
    leftFly:  { center: [28.09933, -25.91161], zoom: 12 },
    rightFly: { center: [30.96037, -29.75753], zoom: 12 },
    layers: ['township-outline', 'township-fill', 'ea-type', 'ea-type-line'],
    legend: EA_TYPE_LEGEND,
    legendTitle: 'Neighborhood type',
  },
  {
    eyebrow: 'Demographics',
    heading: 'Racial composition by neighborhood type',
    body: 'Demographically, Olievenhoutbosch has a racial distribution of roughly 98.0% Black African, 11 sub-places and 82 enumeration areas, of which 66 EAs are "Township" (68,564 people). 88% of its areas are classified as non-wealthy [11].',
    body2: 'KwaMashu spans 7 sub-places and 131 enumeration areas. Of these, 60 EAs are classified as "Township" (48,867 people), with 22 additional EAs classified as "Informal residential" (13,763 people). It is 99.6% Black African, and 86% of its areas are economically classified as non-wealthy [12].',
    leftFly:  { center: [28.09933, -25.91161], zoom: 11 },
    rightFly: { center: [30.96037, -29.75753], zoom: 11 },
    layers: ['township-outline', 'ea-type', 'ea-type-line'],
    showChart: true,
    showDensity: true,
  },
  //Fix Binary layout.. currently it is gray, should be blue and red True or False fill colors.
  {
    eyebrow: 'First Look at Access from a Distance',
    heading: 'Areas with a walking distance greater than 3 km to nearest pharmacy',
    body: 'Red polygons mark SALs where the nearest pharmacy is more than 3 km away on foot. These aren\'t empty fields — they are dense residential zones.',
    leftFly:  { center: [28.09933, -25.91161], zoom: 12 },
    rightFly: { center: [30.96037, -29.75753], zoom: 12 },
    layers: ['township-outline', 'access-binary', 'pharmacies'],
    legend: [
      { color: '#C0392B', label: '>3 km to nearest pharmacy' },
      { color: '#3498DB', label: '≤3 km to nearest pharmacy' },
      { color: '#007A4D', label: 'Pharmacy' },
    ],
    legendTitle: 'Walk distance',
  },
  {
    eyebrow: 'Walking Access Typology',
    heading: 'The pharmacy desert',
    body: 'Each SAL classified by walk-mode access typology. The darkest red zones a formal phrearmacy deserts — a direct legacy of where infrastructure was never built. Also there needs to be more discussion on what living in a pharmacy desert may mean compared to a "Well-served" area. What might contribute to some SALs have pharmacies but have less access than their neighbors? ',
    leftFly:  { center: [28.09933, -25.91161], zoom: 12 },
    rightFly: { center: [30.96037, -29.75753], zoom: 12 },
    layers: ['township-outline', 'walk-typology', 'pharmacies'],
    legend: [
      { color: '#8B0000', label: 'Pharmacy desert' },
      { color: '#C0392B', label: 'Connectivity gap' },
      { color: '#E67E22', label: 'Demand overcrowding' },
      { color: '#F1C40F', label: 'Underserved' },
      { color: '#82C46C', label: 'Adequate' },
      { color: '#27AE60', label: 'Well-served' },
      { color: '#007A4D', label: 'Pharmacy' },
    ],
    legendTitle: 'Walk access typology',
  },
]

//D3 data chart is broken, redo with Rechart or delete 

const ALL_LAYERS = [
  'township-fill',
  'township-outline',
  'ea-type',
  'ea-type-line',
  'access-binary',
  'walk-typology',
  'pharmacies',
]

function buildChartDataFromGeoJSON(geojson, bbox) {
  const [minLng, minLat, maxLng, maxLat] = bbox
  const groups = {}

  for (const f of geojson.features) {
    const p = f.properties
    if (!p?.EA_TYPE) continue
    if (!CHART_EA_TYPES.has(p.EA_TYPE)) continue

    const centroid = getCentroid(f.geometry)
    if (centroid) {
      const [lng, lat] = centroid
      if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue
    }

    const type = p.EA_TYPE
    if (!groups[type]) {
      groups[type] = { type, sal2023_est: 0, area_km2: 0, Black_African: 0, Coloured: 0, Indian_Asian: 0, White: 0, Other: 0 }
    }
    const g = groups[type]
    g.sal2023_est   += p.sal2023_est   ?? 0
    g.area_km2      += p.area_km2      ?? 0
    g.Black_African += p.Black_African ?? 0
    g.Coloured      += p.Coloured      ?? 0
    g.Indian_Asian  += p.Indian_Asian  ?? 0
    g.White         += p.White         ?? 0
    g.Other         += p.Other         ?? 0
  }

  return EA_TYPE_ORDER.filter(t => groups[t]).map(t => {
    const g = groups[t]
    const total = g.sal2023_est || 1
    return {
      type: EA_TYPE_LABELS[g.type] ?? g.type,
      density: g.area_km2 > 0 ? Math.round(g.sal2023_est / g.area_km2) : 0,
      'Black African': Math.round((g.Black_African / total) * 100),
      'Coloured':      Math.round((g.Coloured      / total) * 100),
      'Indian/Asian':  Math.round((g.Indian_Asian  / total) * 100),
      'White':         Math.round((g.White         / total) * 100),
      'Other':         Math.round((g.Other         / total) * 100),
    }
  })
}

function getCentroid(geometry) {
  if (!geometry) return null
  if (geometry.type === 'Point') return geometry.coordinates
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0]
    let lng = 0, lat = 0
    for (const [x, y] of ring) { lng += x; lat += y }
    return [lng / ring.length, lat / ring.length]
  }
  if (geometry.type === 'MultiPolygon') {
    const ring = geometry.coordinates[0][0]
    let lng = 0, lat = 0
    for (const [x, y] of ring) { lng += x; lat += y }
    return [lng / ring.length, lat / ring.length]
  }
  return null
}

const MARGIN    = { top: 24, right: 36, bottom: 60, left: 8 }
const BAR_MAX_H = 160

function drawDualChart(svgEl, width, showDensity, leftData, rightData) {
  if (!svgEl || !width || !leftData?.length || !rightData?.length) return

  const height    = BAR_MAX_H + MARGIN.top + MARGIN.bottom + 20
  const maxChartW = Math.min(width, 800)
  const offsetX   = (width - maxChartW) / 2
  const gapW      = 40
  const halfW     = (maxChartW - MARGIN.left - MARGIN.right - gapW) / 2
  const innerH    = BAR_MAX_H

  const svg = d3.select(svgEl).attr('width', width).attr('height', height)
  svg.selectAll('*').remove()

  const allDensities = [...leftData, ...rightData].map(d => d.density)
  const maxDensity   = d3.max(allDensities) || 1
  const yScale       = d3.scaleLinear().domain([0, maxDensity]).range([0, innerH])
  const barH         = d => showDensity ? yScale(d.density) : innerH

  function drawHalf(parent, data, xOffset, label) {
    const g = parent.append('g').attr('transform', `translate(${xOffset},${MARGIN.top})`)

    g.append('text')
      .attr('x', halfW / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#2C3E6B')
      .text(label)

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.type))
      .range([0, halfW])
      .paddingInner(0.25)
      .paddingOuter(0.05)

    g.selectAll('.gl')
      .data([25, 50, 75])
      .join('line')
      .attr('x1', 0).attr('x2', halfW)
      .attr('y1', d => innerH - (d / 100) * innerH)
      .attr('y2', d => innerH - (d / 100) * innerH)
      .attr('stroke', 'rgba(60,60,80,0.06)')
      .attr('stroke-dasharray', '3,4')

    const stack  = d3.stack().keys(RACE_KEYS).value((d, key) => d[key] ?? 0)
    const layers = stack(data)

    const bg = g.selectAll('.bg')
      .data(data, d => d.type)
      .join('g')
      .attr('class', 'bg')
      .attr('transform', d => `translate(${xScale(d.type)},0)`)

    layers.forEach((layer, li) => {
      const key = layer.key
      bg.selectAll(`.seg-${li}`)
        .data(d => {
          const seg = layer.find(s => s.data.type === d.type)
          return [{ d, seg, key }]
        })
        .join('rect')
        .attr('class', `seg-${li}`)
        .attr('x', 0)
        .attr('width', xScale.bandwidth())
        .attr('fill', RACE_COLORS[key])
        .attr('y', innerH)
        .attr('height', 0)
        .transition()
        .duration(550)
        .delay(li * 80)
        .ease(d3.easeCubicOut)
        .attr('y', ({ d, seg }) => {
          const h = barH(d)
          return innerH - h + (seg[0] / 100) * h
        })
        .attr('height', ({ d, seg }) => {
          const h = barH(d)
          return Math.max(0, ((seg[1] - seg[0]) / 100) * h)
        })
    })

    bg.append('text')
      .attr('class', 'density-lbl')
      .attr('x', xScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#2C3E6B')
      .attr('font-weight', '600')
      .text(d => d.density >= 1000 ? `${(d.density / 1000).toFixed(1)}k` : `${d.density}`)
      .attr('y', innerH)
      .attr('opacity', 0)
      .transition()
      .duration(400)
      .delay(showDensity ? 500 : 0)
      .attr('y', d => innerH - barH(d) - 5)
      .attr('opacity', showDensity ? 1 : 0)

    bg.selectAll('.x-lbl-line')
      .data(d => d.type.split('\n').map((line, i) => ({ line, i, bw: xScale.bandwidth() })))
      .join('text')
      .attr('class', 'x-lbl-line')
      .attr('x', ({ bw }) => bw / 2)
      .attr('y', ({ i }) => innerH + 12 + i * 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '7.5px')
      .attr('fill', 'rgba(40,40,60,0.5)')
      .text(({ line }) => line)
  }

  const root = svg.append('g')

  drawHalf(root, leftData,  offsetX + MARGIN.left, LEFT_DEFAULT.label)
  drawHalf(root, rightData, offsetX + MARGIN.left + halfW + gapW, RIGHT_DEFAULT.label)

  root.append('line')
    .attr('x1', offsetX + MARGIN.left + halfW + gapW / 2)
    .attr('x2', offsetX + MARGIN.left + halfW + gapW / 2)
    .attr('y1', MARGIN.top - 12)
    .attr('y2', MARGIN.top + innerH)
    .attr('stroke', 'rgba(60,60,80,0.12)')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,3')
}

function addDataLayers(map, side, salSource) {
  map.addSource(`${side}-township`, {
    type: 'geojson',
    data: side === 'left' ? OHB_GEOJSON : KWAMASHU_GEOJSON,
  })
  map.addLayer({
    id: `${side}-township-fill`, type: 'fill',
    source: `${side}-township`,
    layout: { visibility: 'none' },
    paint: { 'fill-color': '#8B2500', 'fill-opacity': 0.04 },
  })
  map.addLayer({
    id: `${side}-township-outline`, type: 'line',
    source: `${side}-township`,
    layout: { visibility: 'none' },
    paint: { 'line-color': '#616161', 'line-width': 2.5, 'line-dasharray': [2, 1], 'line-opacity': 0.9 },
  })

  map.addSource(`${side}-sal`, {
    type: 'geojson',
    data: salSource,
  })

  map.addLayer({
    id: `${side}-ea-type`, type: 'fill',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: {
      'fill-color': EA_TYPE_FILL_EXPRESSION,
      'fill-opacity': 0.7,
    },
  })
  map.addLayer({
    id: `${side}-ea-type-line`, type: 'line',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: { 'line-color': '#ffffff', 'line-width': 0.3, 'line-opacity': 0.4 },
  })

  map.addLayer({
  id: `${side}-access-binary`,
  type: 'fill',
  source: `${side}-sal`,
  layout: { visibility: 'none' },
  paint: {
    'fill-color': [
      'match', ['get', 'exceeds_walk_k1_3km'],
      'TRUE', '#C0392B',
      'FALSE', '#3498DB',
      '#cccccc'
    ],
    'fill-opacity': 0.7
  }
})

  map.addLayer({
    id: `${side}-walk-typology`, type: 'fill',
    source: `${side}-sal`,
    layout: { visibility: 'none' },
    paint: {
      'fill-color': WALK_TYPOLOGY_COLOR,
      'fill-opacity': 0.8,
    },
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

export default function N4() {
  const mapLeftContainer  = useRef(null)
  const mapRightContainer = useRef(null)
  const mapLeft   = useRef(null)
  const mapRight  = useRef(null)
  const loadedCount = useRef(0)
  const mapHasFired = useRef(false)
  const svgRef    = useRef(null)
  const chartRef  = useRef(null)

  const [activeStep,  setActiveStep]  = useState(0)
  const [mapLoaded,   setMapLoaded]   = useState(false)
  const [showChart,   setShowChart]   = useState(false)
  const [showDensity, setShowDensity] = useState(false)
  const [chartData,   setChartData]   = useState({ left: null, right: null })

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
      setChartData({
        left:  buildChartDataFromGeoJSON(gp, OHB_BBOX),
        right: buildChartDataFromGeoJSON(kzn, KWAMASHU_BBOX),
      })
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
      .setup({ step: '.n4 .step-card', offset: 0.85, progress: true })
      .onStepEnter(({ index }) => {
        setActiveStep(index)
        const step = STEPS[index]
        mapHasFired.current = false
        setShowChart(false)
        setShowDensity(false)
        applyStep(index)

        if (!step.showChart) {
          mapLeft.current?.flyTo({ ...(step.leftFly ?? step.fly ?? {}), duration: 2200, essential: true })
          mapRight.current?.flyTo({ ...(step.rightFly ?? step.fly ?? {}), duration: 2200, essential: true })
        }
      })
      .onStepProgress(({ index, progress }) => {
        const step = STEPS[index]
        if (!step.showChart) return

        if (progress > 0.2 && !mapHasFired.current) {
          mapLeft.current?.flyTo({ ...(step.leftFly ?? step.fly ?? {}), duration: 2200, essential: true })
          mapRight.current?.flyTo({ ...(step.rightFly ?? step.fly ?? {}), duration: 2200, essential: true })
          mapHasFired.current = true
        }

        if (progress > 0.85) {
          setShowChart(true)
          setShowDensity(!!step.showDensity)
        } else {
          setShowChart(false)
        }
      })
      .onStepExit(({ index }) => {
        if (STEPS[index].showChart) {
          setShowChart(false)
          setShowDensity(false)
          mapHasFired.current = false
        }
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  useEffect(() => {
    if (svgRef.current) d3.select(svgRef.current).selectAll('*').remove()
  }, [chartData])

  useEffect(() => {
    if (!showChart || !chartRef.current || !svgRef.current) return
    if (!chartData.left || !chartData.right) return
    const w = chartRef.current.getBoundingClientRect().width
    drawDualChart(svgRef.current, w, showDensity, chartData.left, chartData.right)
  }, [showChart, showDensity, chartData])

  useEffect(() => {
    if (!chartRef.current) return
    const ro = new ResizeObserver(() => {
      if (!showChart || !svgRef.current || !chartData.left || !chartData.right) return
      const w = chartRef.current.getBoundingClientRect().width
      drawDualChart(svgRef.current, w, showDensity, chartData.left, chartData.right)
    })
    ro.observe(chartRef.current)
    return () => ro.disconnect()
  }, [showChart, showDensity, chartData])

  const step = STEPS[activeStep]
  const chartEyebrow = showDensity
    ? 'Neighborhood type · composition + density · side-by-side'
    : 'Neighborhood type · racial composition · side-by-side'

  return (
    <section className="n4" id="n4">
      <div className="n4__steps">
        {STEPS.map((s, i) => (
          <StepCard key={i} {...s} isActive={activeStep === i} variant="pharmacy" />
        ))}
      </div>

      <div className="n4__graphic">
        <div className="n4__map-panel">
          <span className="n4__map-label">{LEFT_DEFAULT.label}</span>
          <div
            ref={mapLeftContainer}
            className="n4__map"
            style={{ opacity: showChart ? 0.18 : 1, transition: 'opacity 0.7s ease' }}
          />
        </div>

        <div className="n4__map-divider" />

        <div className="n4__map-panel">
          <span className="n4__map-label">{RIGHT_DEFAULT.label}</span>
          <div
            ref={mapRightContainer}
            className="n4__map"
            style={{ opacity: showChart ? 0.18 : 1, transition: 'opacity 0.7s ease' }}
          />
        </div>

        {step?.legend && !showChart && (
          <MapLegend
            items={step.legend}
            title={step.legendTitle}
          />
        )}

        <div
          ref={chartRef}
          className={`n4__chart-overlay ${showChart ? 'n4__chart-overlay--visible' : ''}`}
        >
          <div className="n4__chart-header">
            <p className="n4__chart-eyebrow">{chartEyebrow}</p>
            {showChart && (
              <div className="n4__chart-legend">
                {RACE_KEYS.map(k => (
                  <span key={k} className="n4__legend-item">
                    <span className="n4__legend-swatch" style={{ background: RACE_COLORS[k] }} />
                    {RACE_LABELS[k]}
                  </span>
                ))}
              </div>
            )}
          </div>

          <svg ref={svgRef} style={{ display: 'block', overflow: 'visible' }} />

          <p className="n4__chart-source">
            DAIR, 2011 SAL + 2023 WARD raw data, 2023 predicted data
          </p>
        </div>
      </div>
    </section>
  )
}