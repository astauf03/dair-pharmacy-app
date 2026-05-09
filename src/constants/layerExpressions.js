// layerExpressions.js
// All Mapbox GL JS paint expressions for the DAIR pharmacy access map.
//
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
//   'Well-served' | 'Overcrowded' | 'Fragile' | 'Underserved' |
//   'Pharmacy desert' | 'Data-uncertain'

// ── 1. WALK TYPOLOGY ─────────────────────────────────────────────────────────
// Severity order: Well-served → Overcrowded → Fragile → Underserved →
//                 Pharmacy desert → Data-uncertain (measurement uncertainty)
export const WALK_TYPOLOGY_COLOR = [
  'match', ['get', 'walk_typol'],
  'Well-served',     '#27AE60',
  'Overcrowded',     '#82C46C',
  'Fragile',         '#F1C40F',
  'Underserved',     '#E67E22',
  'Pharmacy desert', '#8B0000',
  'Data-uncertain',  '#B0A090',
  /* fallback */     '#CCCCCC',
]

// ── 2. DRIVE TYPOLOGY ────────────────────────────────────────────────────────
// Same typology strings as walk, different color ramp (blue → gold).
// Encodes drive-mode access independently of walk-mode.
export const DRIVE_TYPOLOGY_COLOR = [
  'match', ['get', 'drive_typo'],
  'Well-served',     '#d4a030',
  'Overcrowded',     '#e8c97a',
  'Fragile',         '#c8d8e8',
  'Underserved',     '#4a80c4',
  'Pharmacy desert', '#002395',
  'Data-uncertain',  '#aaaaaa',
  /* fallback */     '#C8B89A',
]

// ── 3. WALK DISTANCE K=1 (nearest pharmacy) ──────────────────────────────────
// Reversed ramp: near = gold (good), far = blue (bad).
// Continuous distance in km stored as walk_dist_ (truncated).
export const WALK_DIST_K1_COLOR = [
  'interpolate', ['linear'], ['get', 'walk_dist_'],
  0,   '#d4a030',
  1,   '#e8c97a',
  3,   '#c8d8e8',
  5,   '#4a80c4',
  10,  '#002395',
  50,  '#001060',
]

// ── 4. WALK DISTANCE K=3 (third nearest — fragility layer) ───────────────────
export const WALK_DIST_K3_COLOR = [
  'interpolate', ['linear'], ['get', 'walk_dis_2'],
  0,   '#d4a030',
  3,   '#e8c97a',
  10,  '#c8d8e8',
  20,  '#4a80c4',
  50,  '#002395',
]

// ── 5. EXCEEDS WALK K1 3KM — binary disparity layer ──────────────────────────
// 'True'  = nearest pharmacy > 3km walk → pharmacy desert (red)
// 'False' = within 3km → accessible (blue)
// Values are STRINGS not booleans (Python CSV export: capitalised True/False).
export const EXCEEDS_WALK_COLOR = [
  'match', ['get', 'exceeds_wa'],
  'True',  '#C0392B',
  'False', '#2980B9',
  /* fallback */ '#C8B89A',
]

export const EXCEEDS_WALK_OPACITY = 0.75

// ── 6. SNAP FLAG — data quality overlay ──────────────────────────────────────
// walk_sna_1 = 'True' means snap distance > 500m: interpret with caution.
// Rendered as semi-transparent warning wash over the active layer.
// 'True'  = flagged   → visible orange-red wash
// 'False' = clean     → fully transparent
export const SNAP_FLAG_COLOR = '#c73c16'

export const SNAP_FLAG_OPACITY = [
  'match', ['get', 'walk_sna_1'],
  'True',  0.30,
  'False', 0,
  0,
]

// ── 7. EA_TYPE — settlement / apartheid footprint ─────────────────────────────
// _* variants handle tile-boundary splits from Tilesets CLI.
export const EA_TYPE_COLOR = [
  'match', ['get', 'EA_TYPE'],
  'Township',                     '#8B2500',
  'Informal residential',         '#C4713A',
  'Informal residential_*',       '#C4713A',
  'Formal residential',           '#6B8FA8',
  'Formal residential_*',         '#6B8FA8',
  'Suburb',                       '#6B8FA8',
  'Traditional residential',      '#4A7C6F',
  'Traditional residential_*',    '#4A7C6F',
  'Smallholdings',                '#A89860',
  'Small holdings_*',             '#A89860',
  'Farms',                        '#C8B878',
  'Farms_*',                      '#C8B878',
  'Commercial',                   '#002395',
  'Industrial',                   '#555566',
  'Industrial_*',                 '#555566',
  'Vacant',                       '#E8E4DC',
  'Vacant_*',                     '#E8E4DC',
  'Parks and recreation',         '#007A4D',
  'Parks and recreation_*',       '#007A4D',
  'Collective living quarters',   '#ebc159',
  'Collective living quarters_*', '#ebc159',
  /* fallback */                  '#E8E4DC',
]

// ── 8. % BLACK AFRICAN — warm earth ramp ─────────────────────────────────────
// Parchment → amber → deep brown. Never confusable with access blue→gold ramp.
// Ratio computed from Black_Afri / pop_total_ (both truncated field names).
export const PCT_BLACK_COLOR = [
  'interpolate', ['linear'],
  ['/', ['get', 'Black_Afri'], ['max', ['get', 'pop_total_'], 1]],
  0.0, '#F5F0E8',
  0.2, '#D4C4A0',
  0.4, '#A89060',
  0.6, '#7A6040',
  0.8, '#4A3828',
  1.0, '#1A1410',
]

// ── 9. POPULATION DENSITY — sand (sparse) → dark brown (dense) ───────────────
// Replaces previous blue ramp to avoid conflict with access layer blue encoding.
// Formula: sal2023_es (population) / area_km2 = people per km².
// to-number guards handle string-encoded values from tileset exports.
// max(..., 0.01) prevents division-by-zero on zero-area polygons.
export const POP_DENSITY_COLOR = [
  'interpolate', ['linear'],
  ['/', ['to-number', ['get', 'sal2023_es'], 0],
        ['max', ['to-number', ['get', 'area_km2'], 0], 0.01]],
  0,     '#F5F0E8',
  200,   '#E8D5A0',
  500,   '#D4A850',
  2000,  '#B07820',
  5000,  '#7A4E10',
  10000, '#3A2008',
]

// ── 10. ECONOMIC STATUS ───────────────────────────────────────────────────────
export const ECON_STATUS_COLOR = [
  'match', ['get', 'econ_statu'],
  'Wealthy',         '#d4a030',
  'Non_Wealthy',     '#6B5C4E',
  'Non_Residential', '#C8B89A',
  /* fallback */     '#F5F0E8',
]

// ── 11. TRANSPORT GAP — bivariate: walk vs drive ─────────────────────────────
// Orange = walk pharmacy desert but drive well-served or overcrowded (car-dependent)
// Near-black = pharmacy desert by both modes (truly isolated)
// Transparent = everything else (not a gap zone)
export const TRANSPORT_GAP_COLOR = [
  'case',
  ['all',
    ['==', ['get', 'walk_typol'], 'Pharmacy desert'],
    ['any',
      ['==', ['get', 'drive_typo'], 'Well-served'],
      ['==', ['get', 'drive_typo'], 'Overcrowded'],
    ],
  ], '#c73c16',
  ['all',
    ['==', ['get', 'walk_typol'], 'Pharmacy desert'],
    ['==', ['get', 'drive_typo'], 'Pharmacy desert'],
  ], '#262323',
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