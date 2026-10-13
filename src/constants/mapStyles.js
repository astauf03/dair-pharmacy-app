// mapStyles.js
// Shared map styling constants — imported by N2, N4, N5, and future sections.
// Do NOT redefine these inline in components; update here and import.
//
// Walk typology confirmed strings (from data, 2025-05):
//   'Well-served' | 'Access gap' | 'Demand overcrowding' | 'Connectivity gap' |
//   'Pharmacy desert' | 'Artifact zone' (high access score driven by low local demand)
//
// EA_TYPE confirmed strings (from gauteng/kzn polygon data):
//   'Township' | 'Informal residential' | 'Suburb' |
//   'Traditional residential' | 'Smallholdings' | 'Farms' |
//   'Commercial' | 'Industrial' | 'Vacant' | 'Collective living quarters'
// Township extracts also contain suffixed *_ values for clipped polygons.

// ── EA_TYPE colors ────────────────────────────────────────────────────────────

export const EA_TYPE_COLORS = {
  'Township':                '#702424',
  'Township_*':              '#702424',
  'Informal residential':    '#C4713A',
  'Informal residential_*':  '#C4713A',
  'Formal residential':      '#6B8FA8',  // kept for fallback compatibility
  'Formal residential_*':    '#6B8FA8',
  'Suburb':                  '#6B8FA8',
  'Suburb_*':                '#6B8FA8',
  'Traditional residential': '#4A7C6F',
  'Traditional residential_*': '#4A7C6F',
  'Smallholdings':           '#A89860',
  'Smallholdings_*':         '#A89860',
  'Small holdings':          '#A89860',
  'Small holdings_*':        '#A89860',
  'Farms':                   '#C8B878',
  'Farms_*':                 '#C8B878',
  'Commercial':              '#002395',
  'Commercial_*':            '#002395',
  'Industrial':              '#555566',
  'Industrial_*':            '#555566',
  'Vacant':                  '#E8E4DC',
  'Vacant_*':                '#E8E4DC',
  'Parks and recreation':    '#007A4D',
  'Parks and recreation_*':  '#007A4D',
  'Collective living quarters':   '#EBC159',
  'Collective living quarters_*': '#EBC159',
}

export const EA_TYPE_DEFAULT_COLOR = '#E8E4DC'

// Mapbox match expression for fill/circle layers.
// Used by N2, N4, N5 map layers and MapPage.
export const EA_TYPE_FILL_EXPRESSION = [
  'match', ['get', 'EA_TYPE'],
  'Township',                '#702424',
  'Township_*',              '#702424',
  'Informal residential',    '#C4713A',
  'Informal residential_*',  '#C4713A',
  'Formal residential',      '#6B8FA8',
  'Formal residential_*',    '#6B8FA8',
  'Suburb',                  '#6B8FA8',
  'Suburb_*',                '#6B8FA8',
  'Traditional residential', '#4A7C6F',
  'Traditional residential_*', '#4A7C6F',
  'Smallholdings',           '#A89860',
  'Smallholdings_*',         '#A89860',
  'Small holdings',          '#A89860',
  'Small holdings_*',        '#A89860',
  'Farms',                   '#C8B878',
  'Farms_*',                 '#C8B878',
  'Commercial',              '#002395',
  'Commercial_*',            '#002395',
  'Industrial',              '#555566',
  'Industrial_*',            '#555566',
  'Vacant',                  '#E8E4DC',
  'Vacant_*',                '#E8E4DC',
  'Parks and recreation',    '#007A4D',
  'Parks and recreation_*',  '#007A4D',
  'Collective living quarters',   '#EBC159',
  'Collective living quarters_*', '#EBC159',
  '#E8E4DC',
]

// ── Race keys, colors, labels ────────────────────────────────────────────────

export const RACE_KEYS = ['Black African', 'Coloured', 'Indian/Asian', 'White', 'Other']

export const RACE_COLORS = {
  'Black African': '#8DD3C7',
  'Coloured':      '#FFFFB3',
  'Indian/Asian':  '#BEBADA',
  'White':         '#C97B4B',
  'Other':         '#80B1D3',
}

export const RACE_LABELS = {
  'Black African': 'Black African',
  'Coloured':      'Coloured',
  'Indian/Asian':  'Indian / Asian',
  'White':         'White',
  'Other':         'Other',
}

export const RACE_PROPERTY_MAP = {
  'Black_African': 'Black African',
  'Coloured':      'Coloured',
  'Indian_Asian':  'Indian/Asian',
  'White':         'White',
  'Other':         'Other',
}

// ── EA_TYPE chart order and labels ───────────────────────────────────────────
// EA_TYPE_ORDER controls bar order in D3 charts (N2, N4).
// EA_TYPE_LABELS maps raw EA_TYPE strings to display strings.
// \n characters are intentional — D3 splits on them for x-axis label wrapping.

export const EA_TYPE_ORDER = [
  'Township',
  'Informal residential',
  'Suburb',
  'Traditional residential',
  'Smallholdings',
  'Farms',
  'Commercial',
  'Industrial',
]

export const EA_TYPE_LABELS = {
  'Township':                'Township',
  'Informal residential':    'Informal\nresidential',
  'Formal residential':      'Formal\nresidential',
  'Suburb':                  'Suburb',
  'Traditional residential': 'Traditional\nresidential',
  'Smallholdings':           'Small\nholdings',
  'Farms':                   'Farms',
  'Commercial':              'Commercial',
  'Industrial':              'Industrial',
  'Vacant':                  'Vacant',
  'Collective living quarters': 'Collective living\nquarters',
}

// Allowlist for chart aggregation — features with EA_TYPE not in this set are skipped.
export const CHART_EA_TYPES = new Set([
  'Township',
  'Informal residential',
  'Suburb',
  'Traditional residential',
  'Smallholdings',
  'Farms',
  'Commercial',
  'Industrial',
])

// ── Density expressions ───────────────────────────────────────────────────────
// Used by N2 circle layers and density fill layers.
// Density = sal2023_est / area_km2 (population per square kilometre).

export const DENSITY_CIRCLE_RADIUS = [
  'interpolate', ['linear'], ['zoom'],
  6,  ['interpolate', ['linear'],
        ['/', ['coalesce', ['get', 'sal2023_est'], 0],
              ['max', ['coalesce', ['get', 'area_km2'], 1], 1]],
        0, 0.5, 500, 1.5, 2000, 3, 8000, 5],
  10, ['interpolate', ['linear'],
        ['/', ['coalesce', ['get', 'sal2023_est'], 0],
              ['max', ['coalesce', ['get', 'area_km2'], 1], 1]],
        0, 1, 500, 3, 2000, 6, 8000, 10],
]

export const DENSITY_OPACITY = [
  'interpolate', ['linear'],
  ['/', ['coalesce', ['get', 'sal2023_est'], 0],
        ['max', ['coalesce', ['get', 'area_km2'], 1], 1]],
  0, 0, 500, 0.15, 2000, 0.35, 6000, 0.6, 12000, 0.85,
]

export const DENSITY_COLOR_STOPS = [
  { value: 0, color: '#440154', label: '0' },
  { value: 500, color: '#3B528B', label: '500' },
  { value: 2000, color: '#21918C', label: '2,000' },
  { value: 5000, color: '#5EC962', label: '5,000' },
  { value: 10000, color: '#FDE725', label: '10,000+' },
]

export const DENSITY_COLOR_EXPRESSION = [
  'interpolate',
  ['linear'],
  [
    '/',
    ['coalesce', ['get', 'sal2023_est'], 0],
    ['max', ['coalesce', ['get', 'area_km2'], 1], 1],
  ],
  ...DENSITY_COLOR_STOPS.flatMap(({ value, color }) => [value, color]),
]

// ── Walk typology ─────────────────────────────────────────────────────────────
// Confirmed typology strings from data. Severity order:
//   Well-served → Access gap → Demand overcrowding → Connectivity gap → Pharmacy desert
//   Artifact zone = far from pharmacies, with a high access score driven by low local demand.
//   Routing uncertainty is recorded separately by walk_snap_flag.
//
// The shared expression below uses the truncated tileset field; point GeoJSON uses
// walk_typology and should use WALK_TYPOLOGY_COLORS with that full property name.

export const WALK_TYPOLOGY_COLORS = {
  'Well-served':     '#D4A030',
  'Access gap':      '#4A80C4',
  'Demand overcrowding': '#E8C97A',
  'Connectivity gap': '#8AB0D8',
  'Pharmacy desert': '#002395',
  'Artifact zone':   '#ADADAC',
}

// delete?
export const WALK_TYPOLOGY_EXPRESSION = [
  'match', ['get', 'walk_typol'],
  'Well-served',     '#D4A030',
  'Access gap',      '#4A80C4',
  'Demand overcrowding', '#E8C97A',
  'Connectivity gap', '#8AB0D8',
  'Pharmacy desert', '#002395',
  'Artifact zone',   '#ADADAC',
  '#CCCCCC',
]

// Drive typology — same strings, blue→gold ramp (distinct from walk)
export const DRIVE_TYPOLOGY_EXPRESSION = [
  'match', ['get', 'drive_typology'],
  'Well-served',          '#d4a030',
  'Access gap',           '#4A80C4',
  'Demand overcrowding',  '#E8C97A',
  'Connectivity gap',     '#8AB0D8',
  'Pharmacy desert',      '#002395',
  'Artifact zone',        '#ADADAC',
  '#C8B89A',
]

// ── Walk distance color ramp ──────────────────────────────────────────────────
// Continuous km ramp: near = green (good), far = dark red (bad).
// property defaults to full field name; MapPage uses truncated 'walk_dist_'.
export const WALK_DIST_COLOR_EXPRESSION = (property = 'walk_dist_k1_km') => [
  'interpolate', ['linear'], ['coalesce', ['get', property], 0],
  0,   '#1a9641',
  1,   '#a6d96a',
  2,   '#ffffbf',
  3,   '#fdae61',
  5,   '#d7191c',
  10,  '#7b0000',
]

// ── Binary access flag ────────────────────────────────────────────────────────
// exceeds_walk_k1_3km: 'True' = nearest pharmacy > 3km walk (red), 'False' = accessible (blue).
// Values are STRINGS not booleans (Python export capitalises True/False).
export const EXCEEDS_WALK_COLOR_EXPRESSION = [
  'match', ['get', 'exceeds_walk_k1_3km'],
  'True',  '#C0392B',
  '#2980B9',
]

// ── Snap flag ─────────────────────────────────────────────────────────────────
// walk_snap_flag: 'True' = snapped >500m (lower confidence routing).
// Rendered as reduced opacity overlay on whatever layer is beneath.
export const SNAP_FLAG_OPACITY_EXPRESSION = [
  'match', ['get', 'walk_snap_flag'],
  'True', 0.25,
  0.85,
]