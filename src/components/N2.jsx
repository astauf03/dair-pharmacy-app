import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import * as d3 from 'd3'
import StepCard from './StepCard'
import './n2.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

// Province strings that match tileset PR_NAME value
const PROVINCE_NAMES = {
  gauteng: 'Gauteng',
  kzn: 'KwaZulu-Natal', 
}

// EA_TYPE filter, removed industrial and commerical types, focus on residential and rural types relevant to pharmacy access story
const CHART_EA_TYPES = new Set([
  'Township',
  'Informal residential',
  'Formal residential',
  'Traditional residential',
  'Smallholdings',
  'Farms',
  'Collective living quarters',
])

// Display labels for x-axis — left = raw EA_TYPE string, right = display ───
const EA_TYPE_LABELS = {
  'Township':                   'Township',
  'Informal residential':       'Informal\nresidential',
  'Formal residential':         'Suburban',
  'Traditional residential':    'Traditional\nresidential',
  'Smallholdings':              'Small\nholdings',
  'Farms':                      'Farms',
  'Collective living quarters':  'Collective\nliving',
}

// ── Preferred display order for bars left → right 
const EA_TYPE_ORDER = [
  'Township',
  'Informal residential',
  'Formal residential',
  'Traditional residential',
  'Smallholdings',
  'Farms',
  'Collective living quarters',
]

// ── Build chart data from live tileset features 
// querySourceFeatures returns all features currently in memory for a source.
// We group by EA_TYPE (stripping the _* tile-boundary-split suffix),
// sum population + area, then compute density and racial makeup percentages.
function buildChartData(map, province) {
  const sourceId    = 'dair-sal'       // must match your map.addSource() id
  const sourceLayer = 'dair_sal'       // exact source-layer name from Studio

  const features = map.querySourceFeatures(sourceId, { sourceLayer })
  const targetProvince = PROVINCE_NAMES[province]

  const groups = {}

  for (const f of features) {
    const p = f.properties
    if (!p || p.PR_NAME !== targetProvince) continue
    if (!p.EA_TYPE) continue

    // Strip the _* tile-split suffix so fragments merge with their parent type
    const rawType = p.EA_TYPE
    const type = rawType.endsWith('_*') ? rawType.slice(0, -2).trim() : rawType

    // Skip types we don't want in the chart (Commercial, Vacant, etc.)
    if (!CHART_EA_TYPES.has(type)) continue

    if (!groups[type]) {
      groups[type] = {
        type,
        pop_total:   0,
        area_km2:    0,
        Black_Afri:  0,
        Coloured:    0,
        Indian_Asi:  0,
        White:       0,
        Other:       0,
      }
    }

    const g = groups[type]
    g.pop_total  += p.pop_total  ?? 0
    g.area_km2   += p.area_km2   ?? 0
    g.Black_Afri += p.Black_Afri ?? 0
    g.Coloured   += p.Coloured   ?? 0
    g.Indian_Asi += p.Indian_Asi ?? 0
    g.White      += p.White      ?? 0
    g.Other      += p.Other      ?? 0
  }

  // Sort by preferred display order, then convert to chart rows
  return EA_TYPE_ORDER
    .filter(t => groups[t])   // only include types that exist in this province
    .map(t => {
      const g     = groups[t]
      const total = g.pop_total || 1   // avoid divide-by-zero

      return {
        type: EA_TYPE_LABELS[g.type] ?? g.type,   // display label with \n line breaks
        density: g.area_km2 > 0
          ? Math.round(g.pop_total / g.area_km2)
          : 0,
        makeup: {
          'Black African': Math.round((g.Black_Afri / total) * 100),
          'Coloured':      Math.round((g.Coloured   / total) * 100),
          'Indian/Asian':  Math.round((g.Indian_Asi / total) * 100),
          'White':         Math.round((g.White      / total) * 100),
          'Other':         Math.round((g.Other      / total) * 100),
        },
      }
    })
}

// ── Scroll step definitions — each step can optionally specify a map flyTo, whether to show the chart, and which province's data to show
const STEPS = [
  {
    heading: 'Spatial Context: South Africa',
    body: 'South Africa sits at the southern tip of the continent, home to over 60 million people across nine provinces.',
    fly: { center: [25.0, -29.0], zoom: 3.8 },
  },
  {
    eyebrow: 'Spatial Context: Provinces',
    heading: 'Gauteng and KwaZulu-Natal',
    body: 'Gauteng is the smallest province by area but the most dense, economic center of the country. KZN stretches along the coast, less dense overall.',
    fly: { center: [28.5, -27.5], zoom: 5.2 },
  },
  {
    eyebrow: 'Spatial Context: Neighborhoods',
    heading: 'What are the most common neighborhoods in Gauteng?',
    body: 'List the neighborhood typologies, with a brief description of each.',
    fly: { center: [27.9943239, -26.0410534], zoom: 7.5 },
    province: 'gauteng',
    showChart: false,
    showDensity: false,
  },
  {
    eyebrow: 'Spatial Context: Neighborhoods and Population',
    heading: 'Racial composition by neighborhood type in Gauteng',
    body: 'Explain why density metric is useful. Chart incoming.',
    fly: { center: [27.9943239, -26.0410534], zoom: 7.5 },
    province: 'gauteng',
    showChart: true,
    showDensity: true,
  },
  {
    eyebrow: 'Spatial Context: Neighborhoods',
    heading: 'What are the most common neighborhoods in KwaZulu-Natal?',
    body: 'List the neighborhood typologies, with a brief description of each.',
    fly: { center: [31.0, -29.0], zoom: 6.0 },
    province: 'kzn',
    showChart: false,
    showDensity: false,
  },
  {
    eyebrow: 'Spatial Context: Neighborhoods and Population',
    heading: 'How does population density vary by neighborhood type across KZN?',
    body: 'How does this compare to Gauteng? What might explain the differences?',
    fly: { center: [31.0, -29.0], zoom: 6.5 },
    province: 'kzn',
    showChart: true,
    showDensity: true,
  },
  {
    eyebrow: 'Conclusion',
    heading: 'Takeaway about neighborhood types and population',
    body: '...',
    fly: { center: [25.0, -29.0], zoom: 3.8 },
    showChart: false,
    showDensity: false,
  },
]

// ── Chart constants ───────────────────────────────────────────────────────────
const RACE_KEYS   = ['Black African', 'Coloured', 'Indian/Asian', 'White', 'Other']
const RACE_COLORS = {
  'Black African': '#2C3E6B',
  'Coloured':      '#7EB8C9',
  'Indian/Asian':  '#C97B4B',
  'White':         '#D4C5A9',
  'Other':         '#A9A9A9',
}
const RACE_LABELS = {
  'Black African': 'Black African',
  'Coloured':      'Coloured',
  'Indian/Asian':  'Indian / Asian',
  'White':         'White',
  'Other':         'Other',
}

const MARGIN    = { top: 24, right: 28, bottom: 60, left: 8 }
const BAR_MAX_H = 180

// D3 draw function: renders the stacked bar chart in the SVG element based on the provided data and display options
function drawChart(svgEl, width, showDensity, keys, colors, chartData) {
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
    .keys(keys)
    .value((d, key) => d.makeup[key] ?? 0)
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
  if (isFirstDraw) {
    bg.append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', innerH + 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8.5px')
      .attr('font-family', 'inherit')
      .attr('fill', 'rgba(40,40,60,0.5)')
      .selectAll('tspan')
      .data(d => d.type.split('\n'))
      .join('tspan')
        .attr('x', function () { return d3.select(this.parentNode).attr('x') })
        .attr('dy', (_, i) => i === 0 ? 0 : '1.3em')
        .text(t => t)
  }
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
  const [chartData,      setChartData]      = useState(null)   

  // 1. Map init 
  useEffect(() => {
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: STEPS[0].fly.center,
      zoom: STEPS[0].fly.zoom,
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
        type: 'fill',
        source: 'gauteng_boundary',
        layout: { visibility: 'none' },
        paint: { 'fill-color': '#2E3E6C', 'fill-opacity': 0.6 },
      })

      // KZN boundary
      map.current.addSource('kzn_boundary', {
        type: 'geojson',
        data: '/data/kzn_boundary.geojson',
      })
      map.current.addLayer({
        id: 'kzn',
        type: 'fill',
        source: 'kzn_boundary',
        layout: { visibility: 'none' },
        paint: { 'fill-color': '#ebc159', 'fill-opacity': 0.6 },
      })

      // SAL tileset — source only, no layer here
      // Add your choropleth layer in N5; here we just need the source
      // for querySourceFeatures to work in buildChartData
      map.current.addSource('dair-sal', {
        type: 'vector',
        url: 'mapbox://astauf03.dair-sal',   // ← replace with your actual tileset ID
      })

      map.current.addLayer({
        id: 'dair-sal-dummy',
        type: 'fill',
        source: 'dair-sal',
        'source-layer': 'dair_sal',
        layout: { visibility: 'none' },
        paint: { 'fill-color': '#000', 'fill-opacity': 0.001 }, // invisible layer just to load the source
      })

      setMapLoaded(true)
    })

    return () => { map.current?.remove(); map.current = null }
  }, [])

  // 2. Scrollama 
  useEffect(() => {
    if (!mapLoaded) return

    const scroller = scrollama()
    scroller
      .setup({ step: '.n2 .step-card', offset: 0.8, progress: true })
.onStepEnter(({ index }) => {
  setActiveStep(index)
  const step = STEPS[index]

  if (map.current && step.fly) {
    map.current.flyTo({ ...step.fly, duration: 2000, essential: true })
  }

  if (step.province) {
    setActiveProvince(step.province)

    // Show the matching province boundary, hide the other
    map.current.setLayoutProperty('gauteng', 'visibility',
      step.province === 'gauteng' ? 'visible' : 'none')
    map.current.setLayoutProperty('kzn', 'visibility',
      step.province === 'kzn' ? 'visible' : 'none')
  }

  setShowChart(false)
  setShowDensity(false)
})
      .onStepProgress(({ index, progress }) => {
        const step = STEPS[index]
        if (!step.showChart) {
          setShowChart(false)
          return
        }
        if (progress > 0.75) {
          setShowChart(true)
          setShowDensity(!!step.showDensity)
        } else {
          setShowChart(false)
        }
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  //3. Wipe SVG when province changes so x-axis labels redraw fresh
  useEffect(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove()
    }
  }, [activeProvince])

  // 4. Build chart data from tileset 
  // querySourceFeatures only returns tiles currently in memory.
  // If the map hasn't flown into the province yet, tiles won't be loaded —
  // the idle retry catches that case.
useEffect(() => {
  if (!mapLoaded || !map.current) return

  const tryBuild = () => {
    const data = buildChartData(map.current, activeProvince)
    console.log('tryBuild fired, features:', data.length)  // ← add this temporarily
    if (data.length > 0) {
      setChartData(data)
      map.current.off('moveend', tryBuild)
      map.current.off('idle', tryBuild)
    }
  }

  map.current.on('moveend', tryBuild)
  map.current.on('idle', tryBuild)

  return () => {
    map.current?.off('moveend', tryBuild)
    map.current?.off('idle', tryBuild)
  }
}, [mapLoaded, activeProvince])

  // 5. D3 draw — fires when chart visible, density mode, province, or data changes
  useEffect(() => {
    if (!showChart || !chartRef.current || !svgRef.current || !chartData) return
    const w = chartRef.current.getBoundingClientRect().width
    drawChart(svgRef.current, w, showDensity, RACE_KEYS, RACE_COLORS, chartData)
  }, [showChart, showDensity, activeProvince, chartData])   

  // 6. ResizeObserver 
  useEffect(() => {
    if (!chartRef.current) return
    const ro = new ResizeObserver(() => {
      if (!showChart || !svgRef.current || !chartData) return   
      const w = chartRef.current.getBoundingClientRect().width
      drawChart(svgRef.current, w, showDensity, RACE_KEYS, RACE_COLORS, chartData)
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