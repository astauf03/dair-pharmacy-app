// layerExpressions.js
// All Mapbox GL JS paint expressions for the DAIR pharmacy access map.
import {
  EA_TYPE_COLORS,
  EA_TYPE_DEFAULT_COLOR,
  WALK_TYPOLOGY_COLORS,
} from './mapStyles'

// FIELD NAME TRUNCATIONS (Tilesets CLI 10-char limit):
//   walk_typology       → walk_typol     walk_dist_k1_km  → walk_dist_
//   walk_dist_k3_km     → walk_dis_2     drive_typology   → drive_typo
//   exceeds_walk_k1_3km → exceeds_wa     walk_snap_flag   → walk_sna_1
//   sal2023_est         → sal2023_es     Black_African    → Black_Afri
//   econ_status         → econ_statu     pop_total_2011   → pop_total_
//
// Boolean fields ('True'/'False' strings, not JS booleans):
//   exceeds_wa, walk_sna_1, drive_sn_1
//
// Walk typology values (confirmed from data):
//   Well-served | Access gap | Demand overcrowding | Connectivity gap |
//   Pharmacy desert | Artifact zone

// ── 1. WALK TYPOLOGY ─────────────────────────────────────────────────────────
// Severity order: Well-served → Access gap → Demand overcrowding →
//                 Connectivity gap → Pharmacy desert → Artifact zone
export const WALK_TYPOLOGY_COLOR = [
  'match', ['get', 'walk_typol'],
  ...Object.entries(WALK_TYPOLOGY_COLORS).flat(),
  '#CCCCCC',
]

// ── 2. DRIVE TYPOLOGY ────────────────────────────────────────────────────────
export const DRIVE_TYPOLOGY_COLOR = [
  'match', ['get', 'drive_typo'],
  ...Object.entries(WALK_TYPOLOGY_COLORS).flat(),
  '#C8B89A',
]

// ── 3. WALK DISTANCE K=1 (nearest pharmacy) ──────────────────────────────────
export const WALK_DIST_K1_STOPS = [
  { value: 0, color: '#d4a030' },
  { value: 1, color: '#e8c97a' },
  { value: 3, color: '#c8d8e8' },
  { value: 5, color: '#4a80c4' },
  { value: 10, color: '#002395' },
  { value: 50, color: '#001060' },
]

export const WALK_DIST_K1_COLOR = [
  'interpolate', ['linear'], ['get', 'walk_dist_'],
  ...WALK_DIST_K1_STOPS.flatMap(({ value, color }) => [value, color]),
]

// ── 4. WALK DISTANCE K=3 (third nearest — fragility layer) ───────────────────
export const WALK_DIST_K3_STOPS = [
  { value: 0, color: '#d4a030' },
  { value: 3, color: '#e8c97a' },
  { value: 10, color: '#c8d8e8' },
  { value: 20, color: '#4a80c4' },
  { value: 50, color: '#002395' },
]

export const WALK_DIST_K3_COLOR = [
  'interpolate', ['linear'], ['get', 'walk_dis_2'],
  ...WALK_DIST_K3_STOPS.flatMap(({ value, color }) => [value, color]),
]

// ── 5. EXCEEDS WALK K1 3KM — binary disparity layer ──────────────────────────
export const EXCEEDS_WALK_COLORS = {
  true: '#C0392B',
  false: '#2980B9',
  fallback: '#C8B89A',
}

export const EXCEEDS_WALK_COLOR = [
  'match', ['get', 'exceeds_wa'],
  'True', EXCEEDS_WALK_COLORS.true,
  'False', EXCEEDS_WALK_COLORS.false,
  EXCEEDS_WALK_COLORS.fallback,
]

export const EXCEEDS_WALK_OPACITY = 0.75

// ── 6. SNAP FLAG — data quality overlay ──────────────────────────────────────
export const SNAP_FLAG_COLOR = '#c73c16'
export const SNAP_FLAG_OPACITY_VALUE = 0.30

export const SNAP_FLAG_OPACITY = [
  'match', ['get', 'walk_sna_1'],
  'True', SNAP_FLAG_OPACITY_VALUE,
  'False', 0,
  0,
]

// ── 7. EA_TYPE — settlement / apartheid footprint ────────────────────────────
export const EA_TYPE_COLOR = [
  'match', ['get', 'EA_TYPE'],
  ...Object.entries(EA_TYPE_COLORS).flat(),
  EA_TYPE_DEFAULT_COLOR,
]

// ── 8. % BLACK AFRICAN — warm earth ramp ────────────────────────────────────
export const PCT_BLACK_STOPS = [
  { value: 0.0, color: '#F5F0E8' },
  { value: 0.2, color: '#D4C4A0' },
  { value: 0.4, color: '#A89060' },
  { value: 0.6, color: '#7A6040' },
  { value: 0.8, color: '#4A3828' },
  { value: 1.0, color: '#1A1410' },
]

export const PCT_BLACK_COLOR = [
  'interpolate', ['linear'],
  ['/', ['get', 'Black_Afri'], ['max', ['get', 'pop_total_'], 1]],
  ...PCT_BLACK_STOPS.flatMap(({ value, color }) => [value, color]),
]

// ── 9. POPULATION DENSITY — sand (sparse) → dark brown (dense) ───────────────
export const POP_DENSITY_STOPS = [
  { value: 0, color: '#F5F0E8' },
  { value: 200, color: '#E8D5A0' },
  { value: 500, color: '#D4A850' },
  { value: 2000, color: '#B07820' },
  { value: 5000, color: '#7A4E10' },
  { value: 10000, color: '#3A2008' },
]

export const POP_DENSITY_COLOR = [
  'interpolate', ['linear'],
  ['/', ['to-number', ['get', 'sal2023_es'], 0],
        ['max', ['to-number', ['get', 'area_km2'], 0], 0.01]],
  ...POP_DENSITY_STOPS.flatMap(({ value, color }) => [value, color]),
]

// ── 10. ECONOMIC STATUS ──────────────────────────────────────────────────────
export const ECON_STATUS_COLORS = {
  Wealthy: '#d4a030',
  Non_Wealthy: '#6B5C4E',
  Non_Residential: '#C8B89A',
}

export const ECON_STATUS_COLOR = [
  'match', ['get', 'econ_statu'],
  ...Object.entries(ECON_STATUS_COLORS).flat(),
  '#F5F0E8',
]

// ── 11. TRANSPORT GAP — bivariate: walk vs drive ─────────────────────────────
export const TRANSPORT_GAP_COLORS = {
  walkDesertDriveServed: '#c73c16',
  noAccessEitherMode: '#262323',
}

export const TRANSPORT_GAP_COLOR = [
  'case',
  ['all',
    ['==', ['get', 'walk_typol'], 'Pharmacy desert'],
    ['any',
      ['==', ['get', 'drive_typo'], 'Well-served'],
      ['==', ['get', 'drive_typo'], 'Demand overcrowding'],
    ],
  ], TRANSPORT_GAP_COLORS.walkDesertDriveServed,
  ['all',
    ['==', ['get', 'walk_typol'], 'Pharmacy desert'],
    ['==', ['get', 'drive_typo'], 'Pharmacy desert'],
  ], TRANSPORT_GAP_COLORS.noAccessEitherMode,
  'rgba(0,0,0,0)',
]

export const TRANSPORT_GAP_OPACITY = 0.85

// ── Shared zoom-dependent opacity (for choropleth fill layers) ────────────────
export const CHOROPLETH_OPACITY = [
  'interpolate', ['linear'], ['zoom'],
  4,  0.15,
  7,  0.65,
  11, 0.80,
]
