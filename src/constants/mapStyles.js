// mapStyles.js
// Shared map styling constants — imported by N2, N4, N5, and future sections.
// Do NOT redefine these inline in components; update here and import.
//
// Walk typology confirmed strings (from data, 2025-05):
//   'Well-served' | 'Overcrowded' | 'Fragile' | 'Underserved' |
//   'Pharmacy desert' | 'Data-uncertain'
//
// EA_TYPE confirmed strings (from gauteng/kzn polygon data):
//   'Township' | 'Informal residential' | 'Suburb' |
//   'Traditional residential' | 'Smallholdings' | 'Farms' |
//   'Commercial' | 'Industrial'
//   Note: 'Formal residential' and 'Collective living quarters'
//   do not appear in the actual data and have been removed.

// ── EA_TYPE colors ────────────────────────────────────────────────────────────

export const EA_TYPE_COLORS = {
  'Township':                '#8B2500',
  'Informal residential':    '#C4713A',
  'Formal residential':      '#6B8FA8',  // kept for fallback compatibility
  'Suburb':                  '#6B8FA8',
  'Traditional residential': '#4A7C6F',
  'Smallholdings':           '#A89860',
  'Small holdings':          '#A89860',
  'Farms':                   '#C8B878',
  'Commercial':              '#002395',
  'Industrial':              '#555566',
}

export const EA_TYPE_DEFAULT_COLOR = '#E8E4DC'

// Mapbox match expression for fill/circle layers.
// Used by N2, N4, N5 map layers and MapPage.
export const EA_TYPE_FILL_EXPRESSION = [
  'match', ['get', 'EA_TYPE'],
  'Township',                '#8B2500',
  'Informal residential',    '#C4713A',
  'Formal residential',      '#6B8FA8',
  'Suburb',                  '#6B8FA8',
  'Traditional residential', '#4A7C6F',
  'Smallholdings',           '#A89860',
  'Small holdings',          '#A89860',
  'Farms',                   '#C8B878',
  'Commercial',              '#002395',
  'Industrial',              '#555566',
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
  'Suburb':                  'Suburb',
  'Traditional residential': 'Traditional\nresidential',
  'Smallholdings':           'Small\nholdings',
  'Farms':                   'Farms',
  'Commercial':              'Commercial',
  'Industrial':              'Industrial',
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

// ── Walk typology ─────────────────────────────────────────────────────────────
// Confirmed typology strings from data. Severity order:
//   Well-served → Overcrowded → Fragile → Underserved → Pharmacy desert
//   Data-uncertain = measurement uncertainty, not an access tier.
//
// Note: WALK_TYPOLOGY_EXPRESSION uses 'walk_typology' (full field name).
// MapPage uses layerExpressions.js which uses 'walk_typol' (truncated tileset name).
// N4/N5 use their own inline WALK_TYPOLOGY_COLOR with the full field name.

export const WALK_TYPOLOGY_COLORS = {
  'Well-served':     '#27AE60',
  'Overcrowded':     '#82C46C',
  'Fragile':         '#F1C40F',
  'Underserved':     '#E67E22',
  'Pharmacy desert': '#8B0000',
  'Data-uncertain':  '#B0A090',
}

export const WALK_TYPOLOGY_EXPRESSION = [
  'match', ['get', 'walk_typology'],
  'Well-served',     '#27AE60',
  'Overcrowded',     '#82C46C',
  'Fragile',         '#F1C40F',
  'Underserved',     '#E67E22',
  'Pharmacy desert', '#8B0000',
  'Data-uncertain',  '#B0A090',
  '#CCCCCC',
]

// Drive typology — same strings, blue→gold ramp (distinct from walk)
export const DRIVE_TYPOLOGY_EXPRESSION = [
  'match', ['get', 'drive_typology'],
  'Well-served',     '#d4a030',
  'Overcrowded',     '#e8c97a',
  'Fragile',         '#c8d8e8',
  'Underserved',     '#4a80c4',
  'Pharmacy desert', '#002395',
  'Data-uncertain',  '#aaaaaa',
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