import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import * as d3 from 'd3'
import StepCard from './StepCard'
import './n4.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const LEFT_MAP_DEFAULT = {
  center: [-25.94714303695501, 28.091840714079556],
  zoom: 9,
  label: 'Olievenhoutbosch, Gauteng',
}

const RIGHT_MAP_DEFAULT = {
  center: [-29.833280830627167, 30.895854008125134],
  zoom: 12,
  label: 'KwaMashu, Durban',
}

const STEPS = [
  {
    eyebrow: 'Pharmacy Access: Neighborhoods',
    heading: 'Olievenhoutbosch & KwaMashu',
    body: 'Two township geographies shaped by the same apartheid planning logic, expressing different pharmacy access patterns today.',
    fly: { center: [25.0, -29.0], zoom: 5.5 },
  },
  {
    eyebrow: 'Pharmacy Access: Townships',
    heading: 'Neighborhoods in Context',
    body: 'Neighborhood demographic information text form.',
    leftFly: { center: [27.9547, -25.9747], zoom: 13 },
    rightFly: { center: [30.9614, -29.7969], zoom: 13 },
  },
  {
    eyebrow: 'Pharmacy Access · Access Gap and Density',
    heading: 'Access gaps by neighborhood type',
    body: 'Traditional residential areas show the starkest gap between population density and pharmacy access.',
    leftFly: { center: [27.9547, -25.9747], zoom: 11 },
    rightFly: { center: [30.9614, -29.7969], zoom: 11 },
    showChart: true,
    showDensity: true,
  },
]

const CHART_DATA = [
  { type: 'Traditional\nresidential', density: 312, makeup: { 'No Access': 72, 'Low Access': 18, 'Medium Access': 7, 'High Access': 3 } },
  { type: 'Informal\nsettlement', density: 4800, makeup: { 'No Access': 81, 'Low Access': 12, 'Medium Access': 5, 'High Access': 2 } },
  { type: 'Formal\nurban', density: 2100, makeup: { 'No Access': 24, 'Low Access': 31, 'Medium Access': 28, 'High Access': 17 } },
  { type: 'Suburban', density: 820, makeup: { 'No Access': 8, 'Low Access': 19, 'Medium Access': 33, 'High Access': 40 } },
  { type: 'Mixed-use\ncity', density: 6400, makeup: { 'No Access': 31, 'Low Access': 28, 'Medium Access': 24, 'High Access': 17 } },
  { type: 'Rural\nagricultural', density: 48, makeup: { 'No Access': 91, 'Low Access': 6, 'Medium Access': 2, 'High Access': 1 } },
]

const ACCESS_KEYS = ['No Access', 'Low Access', 'Medium Access', 'High Access']
const ACCESS_COLORS = {
  'No Access': '#C0392B',
  'Low Access': '#E67E22',
  'Medium Access': '#F1C40F',
  'High Access': '#27AE60',
}
const ACCESS_LABELS = {
  'No Access': 'No Access',
  'Low Access': 'Low Access',
  'Medium Access': 'Medium Access',
  'High Access': 'High Access',
}

const MARGIN = { top: 24, right: 28, bottom: 60, left: 8 }
const BAR_MAX_H = 180

function drawChart(svgEl, width, showDensity, keys, colors) {
  if (!svgEl || !width) return

  const height = BAR_MAX_H + MARGIN.top + MARGIN.bottom
  const maxChartW = Math.min(width, 700)
  const offsetX = (width - maxChartW) / 2
  const innerW = maxChartW - MARGIN.left - MARGIN.right
  const innerH = BAR_MAX_H

  const svg = d3.select(svgEl)
    .attr('width', width)
    .attr('height', height)

  const isFirstDraw = svg.select('g.chart-root').empty()

  const g = isFirstDraw
    ? svg.append('g').attr('class', 'chart-root').attr('transform', `translate(${offsetX + MARGIN.left},${MARGIN.top})`)
    : svg.select('g.chart-root').attr('transform', `translate(${offsetX + MARGIN.left},${MARGIN.top})`)

  const xScale = d3.scaleBand()
    .domain(CHART_DATA.map(d => d.type))
    .range([0, innerW])
    .paddingInner(0.3)
    .paddingOuter(0.1)

  const maxDensity = d3.max(CHART_DATA, d => d.density)
  const yScale = d3.scaleLinear()
    .domain([0, maxDensity])
    .range([0, innerH])

  const barH = d => showDensity ? yScale(d.density) : innerH

  const stack = d3.stack()
    .keys(keys)
    .value((d, key) => d.makeup[key] ?? 0)
  const layers = stack(CHART_DATA)

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
    .data(CHART_DATA)
    .join(
      enter => enter.append('g')
        .attr('class', 'bg')
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
          .attr('fill', colors[key])
          .attr('y', ({ d }) => innerH)
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

export default function N4() {
  const mapLeftContainer = useRef(null)
  const mapRightContainer = useRef(null)
  const mapLeft = useRef(null)
  const mapRight = useRef(null)
  const loadedCount = useRef(0)
  const mapHasFired = useRef(false)
  const svgRef = useRef(null)
  const chartRef = useRef(null)

  const [activeStep, setActiveStep] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [showDensity, setShowDensity] = useState(false)

  useEffect(() => {
    if (mapLeft.current || mapRight.current) return

    mapLeft.current = new mapboxgl.Map({
      container: mapLeftContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: LEFT_MAP_DEFAULT.center,
      zoom: LEFT_MAP_DEFAULT.zoom,
      interactive: false,
    })

    mapRight.current = new mapboxgl.Map({
      container: mapRightContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: RIGHT_MAP_DEFAULT.center,
      zoom: RIGHT_MAP_DEFAULT.zoom,
      interactive: false,
    })

    const handleLoad = () => {
      loadedCount.current += 1
      if (loadedCount.current === 2) {
        setMapLoaded(true)
      }
    }

    mapLeft.current.on('load', handleLoad)
    mapRight.current.on('load', handleLoad)

    return () => {
      mapLeft.current?.remove()
      mapLeft.current = null
      mapRight.current?.remove()
      mapRight.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded) return

    const scroller = scrollama()
    scroller
      .setup({ step: '.n4 .step-card', offset: 1, progress: true })
      .onStepEnter(({ index }) => {
        setActiveStep(index)
        const step = STEPS[index]
        mapHasFired.current = false
        setShowChart(false)
        setShowDensity(false)

        if (!step.showChart) {
          if (mapLeft.current) {
            const lFly = step.leftFly || step.fly
            if (lFly) {
              mapLeft.current.flyTo({ ...lFly, duration: 2000, essential: true })
            }
          }
          if (mapRight.current) {
            const rFly = step.rightFly || step.fly
            if (rFly) {
              mapRight.current.flyTo({ ...rFly, duration: 2000, essential: true })
            }
          }
        }
      })
      .onStepProgress(({ index, progress }) => {
        const step = STEPS[index]
        if (!step.showChart) return

        if (progress > 0.2 && !mapHasFired.current) {
          const lFly = step.leftFly || step.fly
          const rFly = step.rightFly || step.fly

          if (mapLeft.current && lFly) {
            mapLeft.current.flyTo({ ...lFly, duration: 2000, essential: true })
          }
          if (mapRight.current && rFly) {
            mapRight.current.flyTo({ ...rFly, duration: 2000, essential: true })
          }
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
        const step = STEPS[index]
        if (step.showChart) {
          setShowChart(false)
          setShowDensity(false)
          mapHasFired.current = false
        }
      })

    return () => scroller.destroy()
  }, [mapLoaded])

  useEffect(() => {
    if (!showChart || !chartRef.current || !svgRef.current) return
    const w = chartRef.current.getBoundingClientRect().width
    drawChart(svgRef.current, w, showDensity, ACCESS_KEYS, ACCESS_COLORS)
  }, [showChart, showDensity])

  useEffect(() => {
    if (!chartRef.current) return
    const ro = new ResizeObserver(() => {
      if (!showChart || !svgRef.current) return
      const w = chartRef.current.getBoundingClientRect().width
      drawChart(svgRef.current, w, showDensity, ACCESS_KEYS, ACCESS_COLORS)
    })
    ro.observe(chartRef.current)
    return () => ro.disconnect()
  }, [showChart, showDensity])

  return (
    <section className="n4" id="n4">
      <div className="n4__steps">
        {STEPS.map((step, i) => (
          <StepCard key={i} {...step} isActive={activeStep === i} variant="pharmacy" />
        ))}
      </div>

      <div className="n4__graphic">
        <div className="n4__map-panel">
          <span className="n4__map-label">{LEFT_MAP_DEFAULT.label}</span>
          <div
            ref={mapLeftContainer}
            className="n4__map"
            style={{ opacity: showChart ? 0.18 : 1, transition: 'opacity 0.7s ease' }}
          />
        </div>

        <div className="n4__map-divider" />

        <div className="n4__map-panel">
          <span className="n4__map-label">{RIGHT_MAP_DEFAULT.label}</span>
          <div
            ref={mapRightContainer}
            className="n4__map"
            style={{ opacity: showChart ? 0.18 : 1, transition: 'opacity 0.7s ease' }}
          />
        </div>

        <div
          ref={chartRef}
          className={`n4__chart-overlay ${showChart ? 'n4__chart-overlay--visible' : ''}`}
        >
          <div className="n4__chart-header">
            <p className="n4__chart-eyebrow">
              {showDensity
                ? 'Neighborhood type · access + density'
                : 'Neighborhood type · pharmacy access'}
            </p>
            <div className="n4__chart-legend">
              {ACCESS_KEYS.map(k => (
                <span key={k} className="n4__legend-item">
                  <span className="n4__legend-swatch" style={{ background: ACCESS_COLORS[k] }} />
                  {ACCESS_LABELS[k]}
                </span>
              ))}
            </div>
          </div>
          <svg ref={svgRef} style={{ display: 'block', overflow: 'visible' }} />
          <p className="n4__chart-source">
            Placeholder data · Stats SA Census 2022 · swap buildPharmacyChartData() when ready
          </p>
        </div>
      </div>
    </section>
  )
}
