import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import scrollama from 'scrollama'
import StepCard from './StepCard'
import './n5.css'
import {
  DENSITY_COLOR_EXPRESSION,
  DENSITY_COLOR_STOPS,
  DENSITY_CIRCLE_RADIUS,
  EA_TYPE_COLORS,
  EA_TYPE_FILL_EXPRESSION,
  EA_TYPE_LABELS,
  EA_TYPE_ORDER,
  WALK_TYPOLOGY_COLORS,
} from '../constants/mapStyles'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
const BASE = import.meta.env.BASE_URL || '/'
const EMPTY_FEATURE_COLLECTION = { type: 'FeatureCollection', features: [] }
const NUMBER_FORMAT = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 })

const PROVINCES = {
  gauteng: {
    label: 'Gauteng',
    data: `${BASE}data/gauteng.geojson`,
    boundary: `${BASE}data/gauteng_boundary.geojson`,
    center: [28.13, -26.02],
    zoom: 8,
  },
  kzn: {
    label: 'KwaZulu-Natal',
    data: `${BASE}data/kzn.geojson`,
    boundary: `${BASE}data/kzn_boundary.geojson`,
    center: [30.88, -28.94],
    zoom: 7,
  },
}

const PHARMACIES_DATA = `${BASE}data/pharmacies.geojson`
const AREA_LAYER_IDS = ['n5-ea-type', 'n5-walk-typology', 'n5-density']
const BOUNDARY_LAYER_IDS = ['n5-gauteng-boundary', 'n5-kzn-boundary']

const WALK_TYPOLOGY_COLOR_EXPRESSION = [
  'match',
  ['get', 'walk_typology'],
  ...Object.entries(WALK_TYPOLOGY_COLORS).flat(),
  'rgba(0, 0, 0, 0)',
]

const STEPS = [
  {
    province: 'gauteng',
    topic: 'ea-type',
    heading: 'Gauteng: EA_TYPE',
    body: 'Circles are colored by the EA_TYPE recorded for each point. ', // TODO: Rewrite placeholder story copy.
  },
  {
    province: 'kzn',
    topic: 'ea-type',
    heading: 'KwaZulu-Natal: EA_TYPE',
    body: 'Circles are colored by the EA_TYPE recorded for each point. ', // TODO: Rewrite placeholder story copy.
  },
  {
    province: 'gauteng',
    topic: 'ea-type',
    showPharmacies: true,
    heading: 'Gauteng: EA_TYPE and pharmacies',
    body: 'EA_TYPE circles and pharmacy points are visible together. ', // TODO: Rewrite placeholder story copy.
  },
  {
    province: 'kzn',
    topic: 'ea-type',
    showPharmacies: true,
    heading: 'KwaZulu-Natal: EA_TYPE and pharmacies',
    body: 'EA_TYPE circles and pharmacy points are visible together. ', // TODO: Rewrite placeholder story copy.
  },
  {
    province: 'gauteng',
    topic: 'walk-typology',
    heading: 'Gauteng: walk access typology',
    body: 'Circles are colored by their recorded walk-access typology. ', // TODO: Rewrite placeholder story copy.
  },
  {
    province: 'gauteng',
    topic: 'walk-typology',
    showPharmacies: true,
    heading: 'Gauteng: walk access and pharmacies',
    body: 'Walk-access typology circles and pharmacy points are visible together. ', // TODO: Rewrite placeholder story copy.
  },
  {
    province: 'kzn',
    topic: 'walk-typology',
    heading: 'KwaZulu-Natal: walk access typology',
    body: 'Circles are colored by their recorded walk-access typology. ', // TODO: Rewrite placeholder story copy.
  },
  {
    province: 'kzn',
    topic: 'walk-typology',
    showPharmacies: true,
    heading: 'KwaZulu-Natal: walk access and pharmacies',
    body: 'Walk-access typology circles and pharmacy points are visible together. ', // TODO: Rewrite placeholder story copy.
  },
  {
    province: 'gauteng',
    topic: 'density',
    heading: 'Gauteng: population density',
    body: 'Circle size represents estimated population per square kilometre. ', // TODO: Rewrite placeholder story copy.
  },
  {
    province: 'kzn',
    topic: 'density',
    heading: 'KwaZulu-Natal: population density',
    body: 'Circle size represents estimated population per square kilometre. ', // TODO: Rewrite placeholder story copy.
  },
]

// TODO: Add any later data-story beats after these ten map beats.

function numericValue(value, field, featureCode) {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid ${field} value for enumeration area ${featureCode ?? '(unknown)'}.`)
  }
  return number
}

function normalizeEAType(value) {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/_\*$/, '')
  return normalized === 'Small holdings' ? 'Smallholdings' : normalized
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

function orderedEntries(stats) {
  const keys = [
    ...EA_TYPE_ORDER,
    ...Object.keys(EA_TYPE_LABELS),
    ...[...stats.keys()].sort(),
  ]
  return [...new Set(keys)]
    .filter(key => stats.has(key))
    .map(key => [key, stats.get(key)])
}

function buildProvinceAnalysis(geojson, provinceKey) {
  if (geojson?.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error(`${PROVINCES[provinceKey].label} data is not a GeoJSON FeatureCollection.`)
  }

  const uniqueFeatures = removeExactDuplicateFeatures(geojson.features)
  const pointFeatures = uniqueFeatures.filter(feature => feature.geometry?.type === 'Point')
  const excludedNonPointFeatureCount = uniqueFeatures.length - pointFeatures.length
  const nullWalkTypologyFeatureCount = uniqueFeatures.filter(
    feature => feature.properties?.walk_typology == null,
  ).length
  const eaTypeStats = new Map()
  const walkTypologyStats = new Map()
  let population = 0
  let area = 0

  const normalizedFeatures = pointFeatures.map(feature => {
    const properties = feature.properties ?? {}
    const eaType = normalizeEAType(properties.EA_TYPE)
    const code = properties.EA_CODE

    if (!eaType || !Object.hasOwn(EA_TYPE_COLORS, eaType)) {
      throw new Error(`Unknown EA_TYPE "${properties.EA_TYPE}" in ${PROVINCES[provinceKey].label}.`)
    }

    const featurePopulation = numericValue(properties.sal2023_est, 'sal2023_est', code)
    const featureArea = numericValue(properties.area_km2, 'area_km2', code)
    const walkTypology = properties.walk_typology

    population += featurePopulation
    area += featureArea

    const eaStats = eaTypeStats.get(eaType) ?? { count: 0, population: 0 }
    eaStats.count += 1
    eaStats.population += featurePopulation
    eaTypeStats.set(eaType, eaStats)

    if (typeof walkTypology === 'string' && walkTypology.trim()) {
      if (!Object.hasOwn(WALK_TYPOLOGY_COLORS, walkTypology)) {
        throw new Error(`Unknown walk_typology "${walkTypology}" in ${PROVINCES[provinceKey].label}.`)
      }
      const typologyStats = walkTypologyStats.get(walkTypology) ?? { count: 0, population: 0 }
      typologyStats.count += 1
      typologyStats.population += featurePopulation
      walkTypologyStats.set(walkTypology, typologyStats)
    }

    return {
      ...feature,
      properties: { ...properties, EA_TYPE: eaType },
    }
  })

  if (!pointFeatures.length) {
    throw new Error(`${PROVINCES[provinceKey].label} data contains no Point features.`)
  }

  const analysis = {
    provinceKey,
    sourceFeatureCount: geojson.features.length,
    uniqueFeatureCount: uniqueFeatures.length,
    duplicateFeatureCount: geojson.features.length - uniqueFeatures.length,
    pointFeatureCount: normalizedFeatures.length,
    excludedNonPointFeatureCount,
    nullWalkTypologyFeatureCount,
    eaTypeStats,
    walkTypologyStats,
    population,
    area,
    density: area > 0 ? population / area : 0,
    geojson: { type: 'FeatureCollection', features: normalizedFeatures },
  }

  console.info(
    `N5 ${PROVINCES[provinceKey].label}: ${analysis.sourceFeatureCount.toLocaleString()} source features, ` +
    `${analysis.uniqueFeatureCount.toLocaleString()} unique features ` +
    `(${analysis.pointFeatureCount.toLocaleString()} mapped points; ` +
    `${analysis.duplicateFeatureCount.toLocaleString()} exact duplicates).`,
  )
  return analysis
}

function normalizeProvince(value) {
  const normalized = typeof value === 'string'
    ? value.toLowerCase().replace(/[^a-z]/g, '')
    : ''
  if (normalized === 'gauteng') return 'gauteng'
  if (normalized === 'kwazulunatal') return 'kzn'
  return null
}

function buildPharmacyAnalysis(geojson) {
  if (geojson?.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error('Pharmacy data is not a GeoJSON FeatureCollection.')
  }

  const pharmaciesByProvince = { gauteng: [], kzn: [] }
  let unassignedCount = 0

  for (const feature of geojson.features) {
    const province = normalizeProvince(feature.properties?.PROVINCE)
    if (province && feature.geometry?.type === 'Point') {
      pharmaciesByProvince[province].push(feature)
    } else {
      unassignedCount += 1
    }
  }

  return {
    sourceFeatureCount: geojson.features.length,
    counts: {
      gauteng: pharmaciesByProvince.gauteng.length,
      kzn: pharmaciesByProvince.kzn.length,
    },
    unassignedCount,
    byProvince: Object.fromEntries(
      Object.entries(pharmaciesByProvince).map(([key, features]) => [
        key,
        { type: 'FeatureCollection', features },
      ]),
    ),
  }
}

let dataLoadPromise

function loadN5Data() {
  if (!dataLoadPromise) {
    dataLoadPromise = Promise.all([
      ...Object.entries(PROVINCES).map(async ([key, province]) => {
        const response = await fetch(province.data)
        if (!response.ok) {
          throw new Error(`Unable to load ${province.label} data (${response.status}).`)
        }
        return [key, buildProvinceAnalysis(await response.json(), key)]
      }),
      (async () => {
        const response = await fetch(PHARMACIES_DATA)
        if (!response.ok) {
          throw new Error(`Unable to load pharmacy data (${response.status}).`)
        }
        return ['pharmacies', buildPharmacyAnalysis(await response.json())]
      })(),
    ]).then(entries => {
      const data = Object.fromEntries(entries)
      console.info(
        `N5 pharmacies: ${data.pharmacies.counts.gauteng.toLocaleString()} assigned to Gauteng, ` +
        `${data.pharmacies.counts.kzn.toLocaleString()} assigned to KwaZulu-Natal, ` +
        `${data.pharmacies.unassignedCount.toLocaleString()} unassigned.`,
      )
      return data
    }).catch(error => {
      dataLoadPromise = null
      throw error
    })
  }
  return dataLoadPromise
}

function formatNumber(value) {
  return NUMBER_FORMAT.format(value)
}

function formatPercent(value) {
  return `${value.toLocaleString('en-ZA', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function formatArea(value) {
  return `${value.toLocaleString('en-ZA', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km2`
}

function displayEAType(type) {
  return (EA_TYPE_LABELS[type] ?? type).replace(/\n/g, ' ')
}

function buildLegend(step, provinceAnalysis) {
  let items
  if (step.topic === 'ea-type') {
    items = orderedEntries(provinceAnalysis.eaTypeStats).map(([type]) => ({
      color: EA_TYPE_COLORS[type],
      label: displayEAType(type),
    }))
  } else if (step.topic === 'walk-typology') {
    items = Object.keys(WALK_TYPOLOGY_COLORS)
      .filter(type => provinceAnalysis.walkTypologyStats.has(type))
      .map(type => ({ color: WALK_TYPOLOGY_COLORS[type], label: type }))
  } else {
    return []
  }

  if (step.showPharmacies) {
    items.push({
      color: EA_TYPE_COLORS['Parks and recreation'],
      label: 'Pharmacy',
    })
  }
  return items
}

function MapLegend({ items, title }) {
  return (
    <div className="n5__map-legend">
      <span className="n5__map-legend-title">{title}</span>
      {items.map(({ color, label }) => (
        <span key={label} className="n5__map-legend-item">
          <span
            className="n5__map-legend-swatch"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          {label}
        </span>
      ))}
    </div>
  )
}

function DensityLegend() {
  return (
    <div className="n5__map-legend">
      <span className="n5__map-legend-title">Population density (people/km2)</span>
      {DENSITY_COLOR_STOPS.map(({ color, label }) => (
        <span key={label} className="n5__map-legend-item">
          <span
            className="n5__map-legend-swatch"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          {label}
        </span>
      ))}
    </div>
  )
}

function MapSummary({ step, provinceAnalysis, pharmacyAnalysis }) {
  const province = PROVINCES[step.province]
  const eaRows = step.topic === 'ea-type'
    ? orderedEntries(provinceAnalysis.eaTypeStats)
    : []
  const typologyRows = step.topic === 'walk-typology'
    ? Object.entries(WALK_TYPOLOGY_COLORS)
      .filter(([type]) => provinceAnalysis.walkTypologyStats.has(type))
      .map(([type]) => [type, provinceAnalysis.walkTypologyStats.get(type)])
    : []

  return (
    <aside className="n5__map-summary" aria-live="polite">
      <span className="n5__map-summary-title">{province.label} / map data</span>
      {step.topic === 'ea-type' && (
        <>
          <ul className="n5__summary-metrics">
            <li>
              <span>Unique mapped areas</span>
              <strong>{formatNumber(provinceAnalysis.pointFeatureCount)}</strong>
            </li>
            <li>
              <span>Population (sal2023_est)</span>
              <strong>{formatNumber(provinceAnalysis.population)}</strong>
            </li>
          </ul>
          <div className="n5__map-summary-columns">
            <span>EA_TYPE</span><span>Areas</span><span>Population</span>
          </div>
          <ul>
            {eaRows.map(([type, stats]) => (
              <li key={type}>
                <span>{displayEAType(type)}</span>
                <strong>{formatNumber(stats.count)}</strong>
                <strong>{formatNumber(stats.population)}</strong>
              </li>
            ))}
          </ul>
        </>
      )}

      {step.topic === 'walk-typology' && (
        <>
          <div className="n5__map-summary-columns">
            <span>Walk typology</span><span>Areas</span><span>Population / share</span>
          </div>
          <ul>
            {typologyRows.map(([type, stats]) => (
              <li key={type}>
                <span>{type}</span>
                <strong>{formatNumber(stats.count)}</strong>
                <strong>
                  {formatNumber(stats.population)} / {formatPercent(
                    provinceAnalysis.population > 0
                      ? (stats.population / provinceAnalysis.population) * 100
                      : 0,
                  )}
                </strong>
              </li>
            ))}
          </ul>
          <p className="n5__map-summary-note">
            Artifact zone reflects high access scores in low-demand areas; routing uncertainty is
            recorded separately by walk_snap_flag.
          </p>
        </>
      )}

      {step.topic === 'density' && (
        <ul className="n5__summary-metrics">
          <li><span>Population</span><strong>{formatNumber(provinceAnalysis.population)}</strong></li>
          <li><span>Total area</span><strong>{formatArea(provinceAnalysis.area)}</strong></li>
          <li>
            <span>Overall density</span>
            <strong>
              {provinceAnalysis.density.toLocaleString('en-ZA', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })} people/km2
            </strong>
          </li>
        </ul>
      )}

      {step.showPharmacies && (
        <ul className="n5__summary-metrics">
          <li>
            <span>Pharmacies</span>
            <strong>{formatNumber(pharmacyAnalysis.counts[step.province])}</strong>
          </li>
        </ul>
      )}

      <p className="n5__map-summary-note">
        {formatNumber(provinceAnalysis.pointFeatureCount)} mapped points from{' '}
        {formatNumber(provinceAnalysis.sourceFeatureCount)} source features;{' '}
        {formatNumber(provinceAnalysis.duplicateFeatureCount)} exact duplicates removed and{' '}
        {formatNumber(provinceAnalysis.excludedNonPointFeatureCount)} non-point feature(s) excluded.
        {' '}{formatNumber(provinceAnalysis.nullWalkTypologyFeatureCount)} source feature(s) have no
        walk typology and are excluded from tier counts.
      </p>
      <p className="n5__map-summary-note">
        Unassigned pharmacies: {formatNumber(pharmacyAnalysis.unassignedCount)}.
      </p>
    </aside>
  )
}

function addMapLayers(map) {
  map.addSource('n5-areas', {
    type: 'geojson',
    data: EMPTY_FEATURE_COLLECTION,
  })
  map.addSource('n5-pharmacies', {
    type: 'geojson',
    data: EMPTY_FEATURE_COLLECTION,
  })
  map.addSource('n5-gauteng-boundary-source', {
    type: 'geojson',
    data: PROVINCES.gauteng.boundary,
  })
  map.addSource('n5-kzn-boundary-source', {
    type: 'geojson',
    data: PROVINCES.kzn.boundary,
  })

  map.addLayer({
    id: 'n5-gauteng-boundary',
    type: 'line',
    source: 'n5-gauteng-boundary-source',
    layout: { visibility: 'none' },
    paint: { 'line-color': EA_TYPE_COLORS.Industrial, 'line-width': 1.5, 'line-opacity': 0.8 },
  })
  map.addLayer({
    id: 'n5-kzn-boundary',
    type: 'line',
    source: 'n5-kzn-boundary-source',
    layout: { visibility: 'none' },
    paint: { 'line-color': EA_TYPE_COLORS.Industrial, 'line-width': 1.5, 'line-opacity': 0.8 },
  })
  map.addLayer({
    id: 'n5-ea-type',
    type: 'circle',
    source: 'n5-areas',
    layout: { visibility: 'none' },
    paint: {
      'circle-color': EA_TYPE_FILL_EXPRESSION,
      'circle-radius': DENSITY_CIRCLE_RADIUS,
      'circle-opacity': 0.82,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 0.25,
    },
  })
  map.addLayer({
    id: 'n5-density',
    type: 'circle',
    source: 'n5-areas',
    layout: { visibility: 'none' },
    paint: {
      'circle-color': DENSITY_COLOR_EXPRESSION,
      'circle-radius': DENSITY_CIRCLE_RADIUS,
      'circle-opacity': 0.72,
    },
  })
  map.addLayer({
    id: 'n5-walk-typology',
    type: 'circle',
    source: 'n5-areas',
    filter: ['all', ['has', 'walk_typology'], ['!=', ['get', 'walk_typology'], null]],
    layout: { visibility: 'none' },
    paint: {
      'circle-color': WALK_TYPOLOGY_COLOR_EXPRESSION,
      'circle-radius': 2.5,
      'circle-opacity': 0.82,
    },
  })
  map.addLayer({
    id: 'n5-pharmacies',
    type: 'circle',
    source: 'n5-pharmacies',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': 4,
      'circle-color': EA_TYPE_COLORS['Parks and recreation'],
      'circle-opacity': 0.95,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  })
}

export default function N5() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [activeStep, setActiveStep] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [dataError, setDataError] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadN5Data()
      .then(data => {
        if (!cancelled) setAnalysis(data)
      })
      .catch(error => {
        console.error('N5 analysis data failed to load:', error)
        if (!cancelled) setDataError(error)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (map.current || !mapContainer.current) return undefined

    const storyMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: PROVINCES.gauteng.center,
      zoom: PROVINCES.gauteng.zoom,
      interactive: false,
    })
    map.current = storyMap

    storyMap.on('load', () => {
      if (map.current !== storyMap) return
      addMapLayers(storyMap)
      storyMap.resize()
      setMapLoaded(true)
    })
    storyMap.on('error', event => console.warn('N5 map error:', event.error ?? event))

    return () => {
      storyMap.remove()
      if (map.current === storyMap) map.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !analysis || !map.current) return undefined
    const storyMap = map.current

    const applyStep = index => {
      const step = STEPS[index]
      if (!step) return

      const provinceAnalysis = analysis[step.province]
      storyMap.getSource('n5-areas').setData(provinceAnalysis.geojson)
      storyMap.getSource('n5-pharmacies').setData(analysis.pharmacies.byProvince[step.province])

      const visibleAreaLayer = step.topic === 'ea-type'
        ? 'n5-ea-type'
        : step.topic === 'walk-typology'
          ? 'n5-walk-typology'
          : 'n5-density'
      for (const layerId of AREA_LAYER_IDS) {
        storyMap.setLayoutProperty(layerId, 'visibility', layerId === visibleAreaLayer ? 'visible' : 'none')
      }
      for (const layerId of BOUNDARY_LAYER_IDS) {
        const isActiveBoundary = layerId === `n5-${step.province}-boundary`
        storyMap.setLayoutProperty(layerId, 'visibility', isActiveBoundary ? 'visible' : 'none')
      }
      storyMap.setLayoutProperty('n5-pharmacies', 'visibility', step.showPharmacies ? 'visible' : 'none')
      storyMap.flyTo({
        center: PROVINCES[step.province].center,
        zoom: PROVINCES[step.province].zoom,
        duration: 2000,
        essential: true,
      })
      setActiveStep(index)
    }

    applyStep(0)
    const scroller = scrollama()
    scroller
      .setup({ step: '.n5 .step-card', offset: 0.8 })
      .onStepEnter(({ index }) => applyStep(index))

    return () => scroller.destroy()
  }, [mapLoaded, analysis])

  const step = STEPS[activeStep]
  const provinceAnalysis = analysis?.[step.province]
  const legend = provinceAnalysis ? buildLegend(step, provinceAnalysis) : []

  return (
    <section className="n5" id="n5">
      <div className="n5__scroll">
        <div className="n5__steps">
          {STEPS.map((storyStep, index) => (
            <StepCard
              key={`${storyStep.province}-${storyStep.topic}-${index}`}
              {...storyStep}
              eyebrow={PROVINCES[storyStep.province].label}
              isActive={activeStep === index}
              variant="disparity"
            />
          ))}
        </div>

        <div className="n5__graphic">
          <div ref={mapContainer} className="n5__map" />
          <span className="n5__map-label">
            {PROVINCES[step.province].label}
          </span>

          {dataError && (
            <p className="n5__error" role="alert">
              Province analysis could not be loaded: {dataError.message}
            </p>
          )}
          {!dataError && !analysis && (
            <p className="n5__loading">Loading province data...</p>
          )}

          {provinceAnalysis && analysis && (
            <>
              <MapSummary
                step={step}
                provinceAnalysis={provinceAnalysis}
                pharmacyAnalysis={analysis.pharmacies}
              />
              {step.topic === 'density'
                ? <DensityLegend />
                : <MapLegend
                    items={legend}
                    title={step.topic === 'ea-type' ? 'EA_TYPE' : 'Walk access typology'}
                  />}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
