// mapStyles.js
// Shared map styling constants — imported by N2, N4, N5, and future sections.
// Do NOT redefine these inline in components; update here and import.

import { SETTLEMENT_TYPE_COLORS } from './dataContract'

// v2 Settlement Type fill expression. The story's point extracts carry a
// precomputed `settlement` property, so this matches on the display label
// rather than the raw EA_TYPE value.
export const SETTLEMENT_TYPE_FILL_EXPRESSION = [
  'match',
  ['get', 'settlement'],
  ...Object.entries(SETTLEMENT_TYPE_COLORS).flat(),
  '#E8E4DC',
]

// ── Population Group keys and colors ──────────────────────────────────────────

export const RACE_COLORS = {
  'Black African': '#8DD3C7',
  'Coloured':      '#FFFFB3',
  'Indian/Asian':  '#BEBADA',
  'White':         '#C97B4B',
  'Other':         '#80B1D3',
}

// ── Density expressions ───────────────────────────────────────────────────────
// Density = pop2023est / area_km2 (population per square kilometer).

export const DENSITY_COLOR_STOPS = [
  { value: 0, color: '#440154', label: '0' },
  { value: 500, color: '#3B528B', label: '500' },
  { value: 2000, color: '#21918C', label: '2,000' },
  { value: 5000, color: '#5EC962', label: '5,000' },
  { value: 10000, color: '#FDE725', label: '10,000+' },
]

export const PHARMACY_DOT_PAINT = {
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 1.5, 12, 5],
  'circle-color': '#007A4D',
  'circle-stroke-color': '#ffffff',
  'circle-stroke-width': 0.75,
  'circle-opacity': 0.9,
}

export const DENSITY_CIRCLE_RADIUS = [
  'interpolate', ['linear'], ['zoom'],
  6,  ['interpolate', ['linear'],
        ['/', ['coalesce', ['get', 'pop2023est'], 0],
              ['max', ['coalesce', ['get', 'area_km2'], 1], 1]],
        0, 0.5, 500, 1.5, 2000, 3, 8000, 5],
  10, ['interpolate', ['linear'],
        ['/', ['coalesce', ['get', 'pop2023est'], 0],
              ['max', ['coalesce', ['get', 'area_km2'], 1], 1]],
        0, 1, 500, 3, 2000, 6, 8000, 10],
]

export const DENSITY_COLOR_EXPRESSION = [
  'interpolate',
  ['linear'],
  [
    '/',
    ['coalesce', ['get', 'pop2023est'], 0],
    ['max', ['coalesce', ['get', 'area_km2'], 1], 1],
  ],
  ...DENSITY_COLOR_STOPS.flatMap(({ value, color }) => [value, color]),
]