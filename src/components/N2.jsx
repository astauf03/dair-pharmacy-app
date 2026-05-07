import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import * as d3 from 'd3'
import StepCard from './StepCard'
import './n2.css'
import {
  CHART_EA_TYPES,
  EA_TYPE_LABELS,
  EA_TYPE_ORDER,
  RACE_KEYS,
  RACE_COLORS,
  RACE_LABELS,
} from '../constants/mapStyles'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN


// ── Build chart data from live tileset features 
// querySourceFeatures returns all features currently in memory for a source.
// We group by EA_TYPE (stripping the _* tile-boundary-split suffix),
// sum population + area, then compute density and racial makeup percentages.
function buildChartDataFromGeoJSON(geojson) {
  const groups = {}

  for (const f of geojson.features) {
    const p = f.properties
    if (!p || !p.EA_TYPE) continue

    const type = p.EA_TYPE
    if (!CHART_EA_TYPES.has(type)) continue

    if (!groups[type]) {
      groups[type] = {
        type, sal2023_est: 0, area_km2: 0,
        Black_African: 0, Coloured: 0, Indian_Asian: 0, White: 0, Other: 0,
      }
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
      'Coloured':      Math.round((g.Coloured / total) * 100),
      'Indian/Asian':  Math.round((g.Indian_Asian / total) * 100),
      'White':         Math.round((g.White / total) * 100),
      'Other':         Math.round((g.Other / total) * 100),
    }
  })
}

// ── Scroll step definitions — each step can optionally specify a map flyTo, whether to show the chart, and which province's data to show
const STEPS = [
  {
    heading: 'Spatial Context: South Africa',
    body: 'South Africa encompasses 1.2 million square kilometers at the southern tip of Africa. With a population of ~ 62 million, it is the sixth most populated country on the continent and is consistently ranked as having the highest income inequality in the world [1]. It is marked by a complex post-apartheid landscape of racial disparity.',
    fly: { center: [25.0, -29.0], zoom: 5 },
  },
  {
    eyebrow: 'Spatial Context: Provinces',
    heading: 'Gauteng and KwaZulu-Natal',
    body: 'The focus provinces for this project are Gauteng and KwaZulu-Natal. Gauteng is the smallest but most populous province, containing major cities like Johannesburg and Pretoria, and serves as the economic and political hub of the country. [2] ',
    body2: 'KwaZulu-Natal is the second largest province by population, predominantly rural, with urban centers like Durban concentrated along the coast. Gauteng is home to ~1,453 registered pharmacists, while KZN has ~699. This is a ratio that suggests uneven geographic distribution of pharmaceutical capacity. [3]',
    fly: { center: [28.5, -27.5], zoom: 5.8 },
  },
  {
    eyebrow: 'Spatial Context: Neighborhoods',
    heading: 'What are the most common neighborhoods in Gauteng?',
    body: 'The urban layout of Gauteng is a direct product of apartheid spatial planning, resulting in a patchwork of neighborhood types in close proximity. Gated estates and walled suburbs concentrated in the wealthy core sit alongside former "whites-only" suburbs, while townships, and informal settlements. Historically non-white neighborhoods are pushed to the urban periphery.',
    fly: { center: [27.9943239, -26.0410534], zoom: 8 },
    province: 'gauteng',
    showChart: false,
    showDensity: false,
  },
  {
    eyebrow: 'Spatial Context: Neighborhoods and Population',
    heading: 'Population Density',
    body: 'Population in Gauteng is notably diverse in racial composition, with Black Africans comprising the large majority, followed by smaller but significant shares of White, Coloured, and Indian/Asian residents. This racial geography maps unevenly onto neighborhood type: the province spans affluent gated suburbs and middle-class neighborhoods through to established townships, informal settlements, and backyard dwellings. The latter of these categories house a disproportionate share of Black African residents as a direct legacy of apartheid-era spatial planning.',
    fly: { center: [27.9943239, -26.0410534], zoom: 8.5 },
    province: 'gauteng',
    showChart: true,
    showDensity: true,
  },
  {
    eyebrow: 'Spatial Context: Neighborhoods',
    heading: 'What are the most common neighborhoods in KwaZulu-Natal?',
    body: "The provincial layout of KwaZulu-Natal reflects a different but equally complex spatial legacy shaped by apartheid-era planning and the province's distinct geography. The population stretches from a densely populated coastal corridor anchored by Durban to vast rural interior regions of rugged, hilly terrain. Rather than a single concentrated urban core, KZN is characterized by a more dispersed settlement pattern where formal urban centers, peri-urban townships, and deeply rural traditional settlements coexist across a larger and more varied landscape.",
    fly: { center: [31.0, -29.0], zoom: 7 },
    province: 'kzn',
    showChart: false,
    showDensity: false,
  },
  {
    eyebrow: 'Spatial Context: Neighborhoods and Population',
    heading: 'Popualtion density in KZN',
    body: "KZN's population is more ethnically homogenous than Gauteng's, with Black Africans comprising an overwhelming majority of residents, alongside smaller communities of Indian/Asian descent (a demographic legacy of indentured labor in the colonial era), as well as White and Coloured residents. KZN's inequalities are as much rural-urban as they are neighborhood-to-neighborhood, with large populations in former KwaZulu homeland areas lacking access to services concentrated along the coast and in Durban's metropolitan core.",
    fly: { center: [31.0, -29.0], zoom: 7},
    province: 'kzn',
    showChart: true,
    showDensity: true,
  },
]


const EA_FILL_EXPRESSION = [
  'match', ['get', 'EA_TYPE'],
  'Township',                '#8B2500',
  'Informal residential',    '#C4713A',
  'Formal residential',      '#6B8FA8',
  'Traditional residential', '#4A7C6F',
  'Smallholdings',           '#A89860',
  'Small holdings',          '#A89860',
  'Farms',                   '#C8B878',
  'Commercial',              '#002395',
  'Industrial',              '#555566',
  '#E8E4DC',
]

const MARGIN    = { top: 24, right: 28, bottom: 60, left: 8 }
const BAR_MAX_H = 180

// D3 draw function: renders the stacked bar chart in the SVG element based on the provided data and display options
function drawChart(svgEl, width, showDensity, chartData) {
  if (!svgEl || !width || !chartData || chartData.length === 0) return

  const height    = BAR_MAX_H + MARGIN.top + MARGIN.bottom
  const maxChartW = Math.min(width, 700)
  const offsetX   = (width - maxChartW) / 2
  const innerW    = maxChartW - MARGIN.left - MARGIN.right
  const innerH    = BAR_MAX_H

  const svg = d3.select(svgEl)
    .attr('width', width)
    .attr('height', height)

  const isFirstDraw = svg.select('g.chart-root').empty()

  const g = isFirstDraw
    ? svg.append('g').attr('class', 'chart-root')
        .attr('transform', `translate(${offsetX + MARGIN.left},${MARGIN.top})`)
    : svg.select('g.chart-root')
        .attr('transform', `translate(${offsetX + MARGIN.left},${MARGIN.top})`)

  const xScale = d3.scaleBand()
    .domain(chartData.map(d => d.type))
    .range([0, innerW])
    .paddingInner(0.3)
    .paddingOuter(0.1)

  const maxDensity = d3.max(chartData, d => d.density)
  const yScale = d3.scaleLinear()
    .domain([0, maxDensity])
    .range([0, innerH])

  const barH = d => showDensity ? yScale(d.density) : innerH

  const stack = d3.stack()
  .keys(RACE_KEYS)
  .value((d, key) => d[key] ?? 0)
  const layers = stack(chartData)

  // Gridlines — draw once only
  if (isFirstDraw) {
    g.selectAll('.gl')
      .data([25, 50, 75])
      .join('line')
      .attr('class', 'gl')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => innerH - (d / 100) * innerH)
      .attr('y2', d => innerH - (d / 100) * innerH)
      .attr('stroke', 'rgba(60,60,80,0.08)')
      .attr('stroke-dasharray', '3,4')
      .attr('stroke-width', 1)

    g.selectAll('.gl-lbl')
      .data([25, 50, 75])
      .join('text')
      .attr('class', 'gl-lbl')
      .attr('x', innerW + 5)
      .attr('y', d => innerH - (d / 100) * innerH + 4)
      .attr('font-size', '9px')
      .attr('font-family', 'inherit')
      .attr('fill', 'rgba(60,60,80,0.3)')
      .text(d => d + '%')
  }

  // Bar groups
  const bg = g.selectAll('.bg')
    .data(chartData, d => d.type)
    .join(
      enter => enter.append('g')
        .attr('class', 'bg')
        .attr('transform', d => `translate(${xScale(d.type)},0)`),
      update => update
        .attr('transform', d => `translate(${xScale(d.type)},0)`)
    )

  // Stacked segments
  layers.forEach((layer, li) => {
    const key = layer.key

    bg.selectAll(`.seg-${li}`)
      .data(d => {
        const seg = layer.find(s => s.data.type === d.type)
        return [{ d, seg, key }]
      })
      .join(
        enter => enter.append('rect')
          .attr('class', `seg-${li}`)
          .attr('x', 0)
          .attr('width', xScale.bandwidth())
          .attr('fill', RACE_COLORS[key])
          .attr('y', () => innerH)
          .attr('height', 0)
          .call(enter => enter.transition()
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
          ),
        update => update
          .transition()
          .duration(700)
          .ease(d3.easeCubicInOut)
          .attr('width', xScale.bandwidth())
          .attr('y', ({ d, seg }) => {
            const h = barH(d)
            return innerH - h + (seg[0] / 100) * h
          })
          .attr('height', ({ d, seg }) => {
            const h = barH(d)
            return Math.max(0, ((seg[1] - seg[0]) / 100) * h)
          })
      )
  })

  // Density labels above bars
  bg.selectAll('.density-lbl')
    .data(d => [d])
    .join(
      enter => enter.append('text').attr('class', 'density-lbl'),
      update => update
    )
    .attr('x', xScale.bandwidth() / 2)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('font-family', 'inherit')
    .attr('fill', '#2C3E6B')
    .attr('font-weight', '600')
    .text(d => d.density >= 1000 ? `${(d.density / 1000).toFixed(1)}k` : `${d.density}`)
    .transition()
    .duration(400)
    .delay(showDensity ? 500 : 0)
    .attr('y', d => innerH - barH(d) - 6)
    .attr('opacity', showDensity ? 1 : 0)

  // X-axis labels — only on first draw (svg is wiped on province change)
  bg.selectAll('.x-lbl-line')
  .data(d => d.type.split('\n').map((line, i) => ({ line, i, bw: xScale.bandwidth() })))
  .join('text')
  .attr('class', 'x-lbl-line')
  .attr('x', ({ bw }) => bw / 2)
  .attr('y', ({ i }) => innerH + 14 + i * 11)
  .attr('text-anchor', 'middle')
  .attr('font-size', '8.5px')
  .attr('font-family', 'inherit')
  .attr('fill', 'rgba(40,40,60,0.5)')
  .text(({ line }) => line)
}




// Component 
export default function N2() {
  const mapContainer = useRef(null)
  const map          = useRef(null)
  const svgRef       = useRef(null)
  const chartRef     = useRef(null)

  const [activeStep,     setActiveStep]     = useState(0)
  const [mapLoaded,      setMapLoaded]      = useState(false)
  const [showChart,      setShowChart]      = useState(false)
  const [showDensity,    setShowDensity]    = useState(false)
  const [activeProvince, setActiveProvince] = useState('gauteng')
  // Store both provinces at load time — GeoJSON is fully in memory
  const [allChartData, setAllChartData] = useState({ gauteng: null, kzn: null })  

  const chartData = allChartData[activeProvince]

  // 1. Map init 
  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [28.0, -26.2],
      zoom: 6,
      interactive: false,
    })

    map.current.on('load', () => {
      window._map = map.current // for debugging
      // SA outline
      map.current.addSource('south_africa', {
        type: 'geojson',
        data: '/data/south_africa.geojson',
      })
      map.current.addLayer({
        id: 'sa',
        type: 'fill',
        source: 'south_africa',
        paint: { 'fill-color': '#C8B89A', 'fill-opacity': 0.25 },
      })

      // Gauteng boundary
      map.current.addSource('gauteng_boundary', {
        type: 'geojson',
        data: '/data/gauteng_boundary.geojson',
      })
      map.current.addLayer({
        id: 'gauteng',
        type: 'line',
        source: 'gauteng_boundary',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#2E3E6C', 'line-width': 2 },
      })

      // KZN boundary
      map.current.addSource('kzn_boundary', {
        type: 'geojson',
        data: '/data/kzn_boundary.geojson',
      })
      map.current.addLayer({
        id: 'kzn',
        type: 'line',
        source: 'kzn_boundary',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#ebc159', 'line-width': 2 },
      })

      // SAL data - one per province, with EA_TYPE and population attributes for chart
      map.current.addSource('gauteng-data', {
        type: 'geojson',
        data: '/data/gauteng.geojson',
      })
      
      map.current.addSource('kzn-data', {
        type: 'geojson',
        data: '/data/kzn.geojson',
      })

      

map.current.addLayer({
  id: 'gauteng-ea-type',
  type: 'circle',
  source: 'gauteng-data',
  layout: { visibility: 'none' },
  paint: {
    'circle-color': [
      'match', ['get', 'EA_TYPE'],
      'Township',               '#8B2500',
      'Informal residential',   '#C4713A',
      'Formal residential',     '#6B8FA8',
      'Suburb',                 '#6B8FA8',
      'Traditional residential','#4A7C6F',
      'Smallholdings',          '#A89860',
      'Farms',                  '#C8B878',
      'Commercial',             '#002395',
      'Industrial',             '#555566',
      '#E8E4DC'
    ],
  'circle-radius': [
  'interpolate', ['linear'], ['zoom'],
  6,  ['interpolate', ['linear'],
       ['/', ['coalesce', ['get', 'sal2023_est'], 0], ['max', ['coalesce', ['get', 'area_km2'], 1], 1]],
       0, 0.5, 500, 1.5, 2000, 3, 8000, 5],
  10, ['interpolate', ['linear'],
       ['/', ['coalesce', ['get', 'sal2023_est'], 0], ['max', ['coalesce', ['get', 'area_km2'], 1], 1]],
       0, 1, 500, 3, 2000, 6, 8000, 10],
],
  },
})

map.current.addLayer({
  id: 'kzn-ea-type',
  type: 'circle',
  source: 'kzn-data',
  layout: { visibility: 'none' },
  paint: {
    'circle-color': [
      'match', ['get', 'EA_TYPE'],
      'Township',               '#8B2500',
      'Informal residential',   '#C4713A',
      'Formal residential',     '#6B8FA8',
      'Suburb',                 '#6B8FA8',
      'Traditional residential','#4A7C6F',
      'Smallholdings',          '#A89860',
      'Farms',                  '#C8B878',
      'Commercial',             '#002395',
      'Industrial',             '#555566',
      '#E8E4DC'
    ],
'circle-radius': [
  'interpolate', ['linear'], ['zoom'],
  6,  ['interpolate', ['linear'],
       ['/', ['coalesce', ['get', 'sal2023_est'], 0], ['max', ['coalesce', ['get', 'area_km2'], 1], 1]],
       0, 0.5, 500, 1.5, 2000, 3, 8000, 5],
  10, ['interpolate', ['linear'],
       ['/', ['coalesce', ['get', 'sal2023_est'], 0], ['max', ['coalesce', ['get', 'area_km2'], 1], 1]],
       0, 1, 500, 3, 2000, 6, 8000, 10],
],
  },
})

const densityOpacity = [
    'interpolate', ['linear'],
    ['/',
      ['coalesce', ['get', 'sal2023_est'], 0],
      ['max', ['coalesce', ['get', 'area_km2'], 1], 1]
    ],
    0, 0, 500, 0.15, 2000, 0.35, 6000, 0.6, 12000, 0.85,
  ]
      map.current.addLayer({
        id: 'gauteng-density',
        type: 'fill',
        source: 'gauteng-data',
        layout: { visibility: 'none' },
        paint: { 'fill-color': '#1a1a2e', 'fill-opacity': densityOpacity },
      })
      map.current.addLayer({
        id: 'kzn-density',
        type: 'fill',
        source: 'kzn-data',
        layout: { visibility: 'none' },
        paint: { 'fill-color': '#1a1a2e', 'fill-opacity': densityOpacity },
})
       

      setMapLoaded(true)
    })

    return () => { map.current?.remove(); map.current = null }
  }, [])

// 2. Scrollama
  useEffect(() => {
    if (!mapLoaded) return

    const toggle = (layerId, visible) => {
      if (map.current?.getLayer(layerId))
        map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
    }

    const scroller = scrollama()
    scroller
      .setup({ step: '.n2 .step-card', offset: 0.8, progress: true })
      .onStepEnter(({ index }) => {
        console.log('Step entered:', index, allChartData)
        setActiveStep(index)
        const step = STEPS[index]

        if (map.current && step.fly) {
          map.current.flyTo({ ...step.fly, duration: 3500, essential: true })
        }

        // Province boundaries
        toggle('gauteng', [1, 2, 3].includes(index))
        toggle('kzn',     [1, 4, 5].includes(index))

        // EA_TYPE — show only the active province's layers
        toggle('gauteng-ea-type',      [2, 3].includes(index))
        toggle('kzn-ea-type',          [4, 5].includes(index))

        // Density
        toggle('gauteng-density', index === 3)
        toggle('kzn-density',     index === 5)

        if (step.province) setActiveProvince(step.province)
        setShowChart(false)
        setShowDensity(false)
      })
      .onStepProgress(({ index, progress }) => {
        const step = STEPS[index]
        if (!step.showChart) { setShowChart(false); return }
        if (progress > 0.75) {
          setShowChart(true)
          setShowDensity(!!step.showDensity)
        } else {
          setShowChart(false)
        }
      })
      .onStepExit(({ index, direction }) => {
          // Scrolling past the last real step going down — reset chart
        if (direction === 'down' && index === STEPS.length - 1) {
          setShowChart(false)
          setShowDensity(false)
      toggle('gauteng-ea-type', false)
      toggle('kzn-ea-type',     false)
      toggle('gauteng-density', false)
      toggle('kzn-density',     false)
  }
})

    return () => scroller.destroy()
  }, [mapLoaded])

 // Fetch GeoJSON for charts (independent of map)
  useEffect(() => {
    Promise.all([
      fetch('/data/gauteng.geojson').then(r => r.json()),
      fetch('/data/kzn.geojson').then(r => r.json()),
    ]).then(([gp, kzn]) => {
      const result = {
        gauteng: buildChartDataFromGeoJSON(gp),
        kzn:     buildChartDataFromGeoJSON(kzn),
      }
      console.log('Chart data loaded:', result)
      setAllChartData(result)
    })
  }, [])

   // 3. Wipe SVG when province changes so x-axis labels redraw fresh
  useEffect(() => {
    if (svgRef.current) d3.select(svgRef.current).selectAll('*').remove()
  }, [activeProvince])



    // 4. D3 draw
  useEffect(() => {
    if (!showChart || !chartRef.current || !svgRef.current || !chartData) return
    const w = chartRef.current.getBoundingClientRect().width
    drawChart(svgRef.current, w, showDensity, chartData)
  }, [showChart, showDensity, activeProvince, chartData])

  // 5. ResizeObserver
  useEffect(() => {
    if (!chartRef.current) return
    const ro = new ResizeObserver(() => {
      if (!showChart || !svgRef.current || !chartData) return
      const w = chartRef.current.getBoundingClientRect().width
      drawChart(svgRef.current, w, showDensity, chartData)
    })
    ro.observe(chartRef.current)
    return () => ro.disconnect()
  }, [showChart, showDensity, activeProvince, chartData])

  // Render
  return (
    <section className="n2" id="n2">
      <div className="n2__steps">
        {STEPS.map((step, i) => (
          <StepCard key={i} {...step} isActive={activeStep === i} />
        ))}
      </div>

      <div className="n2__graphic">
        <div
          ref={mapContainer}
          className="n2__map"
          style={{
            opacity: showChart ? 0.18 : 1,
            transition: 'opacity 0.7s ease',
          }}
        />

        <div
          ref={chartRef}
          className={`n2__chart-overlay ${showChart ? 'n2__chart-overlay--visible' : ''}`}
        >
          <div className="n2__chart-header">
            <p className="n2__chart-eyebrow">
              {showDensity
                ? 'Neighborhood type · composition + density'
                : 'Neighborhood type · racial composition'}
            </p>
            <div className="n2__chart-legend">
              {RACE_KEYS.map(k => (
                <span key={k} className="n2__legend-item">
                  <span className="n2__legend-swatch" style={{ background: RACE_COLORS[k] }} />
                  {RACE_LABELS[k]}
                </span>
              ))}
            </div>
          </div>

          <svg ref={svgRef} style={{ display: 'block', overflow: 'visible' }} />

          {/* Swap this caption once data is confirmed live */}
          <p className="n2__chart-source">
            DAIR, 2011 SAL + 2023 WARD raw data, 2023 predicted data
          </p>
        </div>
      </div>
    </section>
  )
}