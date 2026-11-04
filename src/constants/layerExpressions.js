// layerExpressions.js
// All Mapbox GL JS paint expressions for the DAIR pharmacy access map.
import {
  DENSITY_COLOR_STOPS,
} from './mapStyles'
import {
  ACCESS_TYPOLOGY_COLORS,
  SETTLEMENT_TYPE_COLORS,
  beyondThresholdExpression,
} from './dataContract'

// ── Walk distance ramps ──────────────────────────────────────────────────────

export const WALK_DIST_K1_STOPS = [
  { value: 0, color: '#d4a030' },
  { value: 1, color: '#e8c97a' },
  { value: 3, color: '#c8d8e8' },
  { value: 5, color: '#4a80c4' },
  { value: 10, color: '#002395' },
  { value: 50, color: '#001060' },
]

export const WALK_DIST_K3_STOPS = [
  { value: 0, color: '#d4a030' },
  { value: 3, color: '#e8c97a' },
  { value: 10, color: '#c8d8e8' },
  { value: 20, color: '#4a80c4' },
  { value: 50, color: '#002395' },
]

// ── Exceeds walk threshold — binary disparity layer ──────────────────────────

export const EXCEEDS_WALK_COLORS = {
  true: '#C0392B',
  false: '#2980B9',
  fallback: '#C8B89A',
}

export const EXCEEDS_WALK_OPACITY = 0.75

// ── Snap flag — data quality overlay ──────────────────────────────────────────

export const SNAP_FLAG_COLOR = '#c73c16'
export const SNAP_FLAG_OPACITY_VALUE = 0.30

// ── % Black African — warm earth ramp ─────────────────────────────────────────

export const PCT_BLACK_STOPS = [
  { value: 0.0, color: '#f2f0f7' },
  { value: 0.25, color: '#cbc9e2' },
  { value: 0.5, color: '#9e9ac8' },
  { value: 0.75, color: '#756bb1' },
  { value: 1.0, color: '#54278f' },
]

// ── Population density ────────────────────────────────────────────────────────

export const POP_DENSITY_STOPS = DENSITY_COLOR_STOPS

// ── Wealth Class ──────────────────────────────────────────────────────────────

export const WEALTH_CLASS_COLORS = {
  Wealthy: '#7B3294',
  Non_Wealthy: '#E66101',
  Non_Residential: '#BDBDBD',
}

// ── Transport gap — bivariate: walk vs drive ──────────────────────────────────

export const TRANSPORT_GAP_COLORS = {
  walkDesertDriveServed: '#c73c16',
  noAccessEitherMode: '#262323',
}

export const TRANSPORT_GAP_OPACITY = 0.85

// ── Shared zoom-dependent opacity (for choropleth fill layers) ────────────────

export const CHOROPLETH_OPACITY = [
  'interpolate', ['linear'], ['zoom'],
  4,  0.15,
  7,  0.65,
  11, 0.80,
]

// ── Access Typology ───────────────────────────────────────────────────────────

export const WALK_TYPOLOGY_COLOR = [
  'match', ['get', 'wlk_type'],
  ...Object.entries(ACCESS_TYPOLOGY_COLORS).flat(),
  '#CCCCCC',
]

export const DRIVE_TYPOLOGY_COLOR = [
  'match', ['get', 'drv_type'],
  ...Object.entries(ACCESS_TYPOLOGY_COLORS).flat(),
  '#C8B89A',
]

// ── Walk distance layers ──────────────────────────────────────────────────────

export const WALK_DIST_K1_COLOR = [
  'case',
  ['==', ['get', 'wlk_k1_km'], null],
  '#001060',
  [
    'interpolate', ['linear'],
    ['to-number', ['get', 'wlk_k1_km'], 0],
    ...WALK_DIST_K1_STOPS.flatMap(({ value, color }) => [value, color]),
  ],
]

export const WALK_DIST_K3_COLOR = [
  'case',
  ['!=', ['get', 'wlk_k3_km'], null],
  [
    'interpolate', ['linear'],
    ['to-number', ['get', 'wlk_k3_km'], 0],
    ...WALK_DIST_K3_STOPS.flatMap(({ value, color }) => [value, color]),
  ],
  '#C8B89A',
]

export const EXCEEDS_WALK_COLOR = [
  'case',
  beyondThresholdExpression('wlk_k1_km', 'walk'),
  EXCEEDS_WALK_COLORS.true,
  EXCEEDS_WALK_COLORS.false,
]

export const SNAP_FLAG_OPACITY = [
  'case',
  ['==', ['get', 'wlk_snapfl'], true],
  SNAP_FLAG_OPACITY_VALUE,
  0,
]

// ── Settlement Type ───────────────────────────────────────────────────────────

const SETTLEMENT_TYPE_MATCH = [
  'match', ['get', 'EA_TYPE'],
  'Suburb', SETTLEMENT_TYPE_COLORS['Suburb'],
  'Township', SETTLEMENT_TYPE_COLORS['Township'],
  'Informal residential', SETTLEMENT_TYPE_COLORS['Informal Settlement'],
  'Traditional residential', SETTLEMENT_TYPE_COLORS['Traditional (Former Homeland)'],
  'Collective living quarters', SETTLEMENT_TYPE_COLORS['Collective Living Quarters'],
  'Farms', SETTLEMENT_TYPE_COLORS['Farms & Smallholdings'],
  'Smallholdings', SETTLEMENT_TYPE_COLORS['Farms & Smallholdings'],
  'Small holdings', SETTLEMENT_TYPE_COLORS['Farms & Smallholdings'],
  'Commercial', SETTLEMENT_TYPE_COLORS['Non-Residential'],
  'Industrial', SETTLEMENT_TYPE_COLORS['Non-Residential'],
  'Parks and recreation', SETTLEMENT_TYPE_COLORS['Non-Residential'],
  'Vacant', SETTLEMENT_TYPE_COLORS['Non-Residential'],
  SETTLEMENT_TYPE_COLORS['No Dwellings (2011)'],
]

export const SETTLEMENT_TYPE_COLOR = [
  'case',
  [
    'all',
    ['==', ['typeof', ['get', 'EA_TYPE']], 'string'],
    ['==', ['slice', ['get', 'EA_TYPE'], ['-', ['length', ['get', 'EA_TYPE']], 2]], '_*'],
  ],
  SETTLEMENT_TYPE_COLORS['No Dwellings (2011)'],
  SETTLEMENT_TYPE_MATCH,
]

// ── % Black African ───────────────────────────────────────────────────────────

export const PCT_BLACK_COLOR = [
  'case',
  [
    'all',
    ['has', 'Black_Afr'],
    ['has', 'pop2011sum'],
    ['!=', ['get', 'Black_Afr'], null],
    ['!=', ['get', 'pop2011sum'], null],
    ['>', ['to-number', ['get', 'pop2011sum'], 0], 0],
  ],
  [
    'interpolate', ['linear'],
    [
      '/',
      ['to-number', ['get', 'Black_Afr'], 0],
      ['max', ['to-number', ['get', 'pop2011sum'], 0], 1],
    ],
    ...PCT_BLACK_STOPS.flatMap(({ value, color }) => [value, color]),
  ],
  '#C8B89A',
]

// ── Population density ────────────────────────────────────────────────────────

export const POP_DENSITY_COLOR = [
  'interpolate', ['linear'],
  ['/', ['to-number', ['get', 'pop2023est'], 0],
        ['max', ['to-number', ['get', 'area_km2'], 0], 0.01]],
  ...POP_DENSITY_STOPS.flatMap(({ value, color }) => [value, color]),
]

// ── Wealth Class ──────────────────────────────────────────────────────────────

export const WEALTH_CLASS_COLOR = [
  'match', ['get', 'econ_stat'],
  ...Object.entries(WEALTH_CLASS_COLORS).flat(),
  SETTLEMENT_TYPE_COLORS['No Dwellings (2011)'],
]

// ── Transport gap ─────────────────────────────────────────────────────────────

export const TRANSPORT_GAP_COLOR = [
  'case',
  ['all',
    ['==', ['get', 'wlk_type'], 'Pharmacy Desert'],
    ['any',
      ['==', ['get', 'drv_type'], 'Well-Served'],
      ['==', ['get', 'drv_type'], 'Demand Overcrowding'],
    ],
  ], TRANSPORT_GAP_COLORS.walkDesertDriveServed,
  ['all',
    ['==', ['get', 'wlk_type'], 'Pharmacy Desert'],
    ['==', ['get', 'drv_type'], 'Pharmacy Desert'],
  ], TRANSPORT_GAP_COLORS.noAccessEitherMode,
  'rgba(0,0,0,0)',
]