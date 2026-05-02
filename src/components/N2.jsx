import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import * as d3 from 'd3'
import StepCard from './StepCard'
import './n2.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

// ── Chart data, one entry per province ───────────────────────────────────────
const CHART_DATA_BY_PROVINCE = {
  gauteng: [
    { type: 'Traditional\nresidential', density: 312,  makeup: { 'Black African': 97, Coloured: 1, 'Indian/Asian': 0,  White: 2  } },
    { type: 'Informal\nsettlement',     density: 4800, makeup: { 'Black African': 95, Coloured: 3, 'Indian/Asian': 1,  White: 1  } },
    { type: 'Formal\nurban',            density: 2100, makeup: { 'Black African': 61, Coloured: 8, 'Indian/Asian': 18, White: 13 } },
    { type: 'Suburban',                 density: 820,  makeup: { 'Black African': 22, Coloured: 6, 'Indian/Asian': 14, White: 58 } },
    { type: 'Mixed-use\ncity',          density: 6400, makeup: { 'Black African': 68, Coloured: 9, 'Indian/Asian': 12, White: 11 } },
    { type: 'Rural\nagricultural',      density: 48,   makeup: { 'Black African': 88, Coloured: 4, 'Indian/Asian': 1,  White: 7  } },
  ],
  kzn: [
    { type: 'Tribal\ntraditional',      density: 285,  makeup: { 'Black African': 98, Coloured: 1, 'Indian/Asian': 0,  White: 1  } },
    { type: 'Informal\nsettlement',     density: 3900, makeup: { 'Black African': 91, Coloured: 3, 'Indian/Asian': 5,  White: 1  } },
    { type: 'Formal\nurban',            density: 1800, makeup: { 'Black African': 55, Coloured: 5, 'Indian/Asian': 28, White: 12 } },
    { type: 'Suburban',                 density: 740,  makeup: { 'Black African': 18, Coloured: 4, 'Indian/Asian': 32, White: 46 } },
    { type: 'Coastal\nresort',          density: 420,  makeup: { 'Black African': 30, Coloured: 5, 'Indian/Asian': 15, White: 50 } },
    { type: 'Rural\nagricultural',      density: 62,   makeup: { 'Black African': 82, Coloured: 2, 'Indian/Asian': 6,  White: 10 } },
  ],
}

const STEPS = [
  {
    heading: 'Spatial Context · South Africa',
    body: 'South Africa sits at the southern tip of the continent, home to over 60 million people across nine provinces.',
    fly: { center: [25.0, -29.0], zoom: 3.8 },
  },
  {
    eyebrow: 'Spatial Context · Provinces',
    heading: 'Gauteng and KwaZulu-Natal',
    body: 'Gauteng is the smallest province by area but the most dense, economic center of the country. KZN stretches along the coast, less dense overall.',
    fly: { center: [28.5, -27.5], zoom: 5.2 },
  },
  {
    eyebrow: 'Spatial Context · Neighborhoods',
    heading: 'What are the most common neighborhoods in Gauteng?',
    body: 'List the neighborhood typologies, with a brief description of each.',
    fly: { center: [27.9943239, -26.0410534], zoom: 7.5 },
    province: 'gauteng',
    showChart: false,
    showDensity: false,
  },
  {
    eyebrow: 'Spatial Context · Neighborhoods and Population',
    heading: 'Racial composition by neighborhood type in Gauteng',
    body: "Explain why density metric is usefull. Chart incoming",
    fly: { center: [27.9943239, -26.0410534], zoom: 7.5 },
    province: 'gauteng',
    showChart: true,
    showDensity: true,
  },
  {
    eyebrow: 'Spatial Context · Neighborhoods',
    heading: 'What are the most common neighborhoods in KwaZulu-Natal?',
    body: 'List the neighborhood typologies, with a brief description of each. Demo makeup of each?',
    fly: { center: [31.0, -29.0], zoom: 6.0 },
    province: 'kzn',
    showChart: false,
    showDensity: false,
  },
  {
    eyebrow: 'Spatial Context · Neighborhoods and Population',
    heading: 'How does population density vary by neighborhood type across KZN?',
    body: 'How does this compare to Gauteng? What might explain the differences?',
    fly: { center: [31.0, -29.0], zoom: 6.5 },
    province: 'kzn',
    showChart: true,
    showDensity: true,
  },
  {
  eyebrow: 'Conclusion',
  heading: 'Heading for your next section',
  body: '...',
  fly: { center: [25.0, -29.0], zoom: 3.8 },
  setShowChart: false,
  setShowDensity: false
},
]

const RACE_KEYS   = ['Black African', 'Coloured', 'Indian/Asian', 'White']
const RACE_COLORS = { 'Black African': '#2C3E6B', Coloured: '#7EB8C9', 'Indian/Asian': '#C97B4B', White: '#D4C5A9' }
const RACE_LABELS = { 'Black African': 'Black African', Coloured: 'Coloured', 'Indian/Asian': 'Indian / Asian', White: 'White' }

const MARGIN    = { top: 24, right: 28, bottom: 60, left: 8 }
const BAR_MAX_H = 180

// ── D3 chart draw function ────────────────────────────────────────────────────
// chartData is now passed in so it can differ by province
function drawChart(svgEl, width, showDensity, keys, colors, chartData) {
  if (!svgEl || !width || !chartData) return

  const height   = BAR_MAX_H + MARGIN.top + MARGIN.bottom
  const maxChartW = Math.min(width, 700)
  const offsetX   = (width - maxChartW) / 2
  const innerW    = maxChartW - MARGIN.left - MARGIN.right
  const innerH    = BAR_MAX_H

  const svg = d3.select(svgEl)
    .attr('width', width)
    .attr('height', height)

  const isFirstDraw = svg.select('g.chart-root').empty()

  const g = isFirstDraw
    ? svg.append('g').attr('class', 'chart-root').attr('transform', `translate(${offsetX + MARGIN.left},${MARGIN.top})`)
    : svg.select('g.chart-root').attr('transform', `translate(${offsetX + MARGIN.left},${MARGIN.top})`)

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

  const bg = g.selectAll('.bg')
    .data(chartData, d => d.type)   // key by type so D3 matches bars correctly
    .join(
      enter => enter.append('g')
        .attr('class', 'bg')
        .attr('transform', d => `translate(${xScale(d.type)},0)`),
      update => update
        .attr('transform', d => `translate(${xScale(d.type)},0)`)
    )

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

  // ── X-axis labels — redraw whenever province changes (svg was wiped) ─────────
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function N2() {
  const mapContainer = useRef(null)
  const map          = useRef(null)
  const svgRef       = useRef(null)
  const chartRef     = useRef(null)

  const [activeStep,      setActiveStep]      = useState(0)
  const [mapLoaded,       setMapLoaded]       = useState(false)
  const [showChart,       setShowChart]       = useState(false)
  const [showDensity,     setShowDensity]     = useState(false)
  const [activeProvince,  setActiveProvince]  = useState('gauteng')  // ← NEW



  // ── Map init ─────────────────────────────────────────────────────────────────
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
    // SA country outline — visible on step 0 only
    map.current.addSource('south_africa', {
      type: 'geojson',
      data: '/data/south_africa.geojson',
    })
    map.current.addLayer({
      id: 'sa',
      type: 'fill',
      source: 'south_africa',
      paint: {
        'fill-color': '#C8B89A',
        'fill-opacity': 0.25,
      },
    })
    setMapLoaded(true)
  })
  return () => { map.current?.remove(); map.current = null }
}, [])

  // ── Scrollama ────────────────────────────────────────────────────────────────
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

        // ── Update province BEFORE resetting chart visibility ──────────────
        if (step.province) setActiveProvince(step.province)

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

  // ── Wipe SVG when province changes so x-axis labels redraw ───────────────────
  useEffect(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove()
    }
  }, [activeProvince])   // ← NEW effect

  // ── D3 draw — fires when chart becomes visible, density mode, or province ────
  useEffect(() => {
    if (!showChart || !chartRef.current || !svgRef.current) return
    const w    = chartRef.current.getBoundingClientRect().width
    const data = CHART_DATA_BY_PROVINCE[activeProvince]
    drawChart(svgRef.current, w, showDensity, RACE_KEYS, RACE_COLORS, data)
  }, [showChart, showDensity, activeProvince])   // ← added activeProvince

  // ── ResizeObserver ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return
    const ro = new ResizeObserver(() => {
      if (!showChart || !svgRef.current) return
      const w    = chartRef.current.getBoundingClientRect().width
      const data = CHART_DATA_BY_PROVINCE[activeProvince]
      drawChart(svgRef.current, w, showDensity, RACE_KEYS, RACE_COLORS, data)
    })
    ro.observe(chartRef.current)
    return () => ro.disconnect()
  }, [showChart, showDensity, activeProvince])   // ← added activeProvince

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
              {showDensity ? 'Neighborhood type · composition + density' : 'Neighborhood type · racial composition'}
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

          <p className="n2__chart-source">
            Placeholder data · Stats SA Census 2022 · swap buildChartData() when ready
          </p>
        </div>
      </div>
    </section>
  )
}