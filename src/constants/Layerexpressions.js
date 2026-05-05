// TODO: confirm exact field names and values from data export once available.
// layerExpressions.js
// All Mapbox GL JS paint expressions for the DAIR pharmacy access map.
//
// FIELD NAME TRUNCATIONS (Tilesets CLI 10-char limit):
//   walk_typology       → walk_typol     walk_dist_k1_km  → walk_dist_
//   walk_dist_k3_km     → walk_dis_2     drive_typology   → drive_typo
//   exceeds_walk_k1_3km → exceeds_wa     walk_snap_flag   → walk_sna_1
//   sal2023_est         → sal2023_es     Black_African    → Black_Afri
//   econ_status         → econ_statu     pop_total_2011   → pop_total_
//   Ai_drive            → i_drive
//
// Boolean fields ('True'/'False' strings, not JS booleans):
//   exceeds_wa, walk_sna_1, drive_sn_1
// TODO: confirm exact field names and values from data export once available.


// ── 1. WALK TYPOLOGY ─
export const WALK_TYPOLOGY_COLOR = [
  'match', ['get', 'walk_typol'],
  'Pharmacy desert',     '#002395',
  'Access gap',          '#4a80c4',
  'Connectivity gap',    '#8ab0d8',
  'Artifact zone',       '#C8B89A',
  'Demand overcrowding', '#e8c97a',
  'Well-served',         '#d4a030',
  /* fallback */         '#C8B89A',
]

// ── 2. DRIVE TYPOLOGY 
export const DRIVE_TYPOLOGY_COLOR = [
  'match', ['get', 'drive_typo'],
  'Pharmacy desert',     '#002395',
  'Access gap',          '#4a80c4',
  'Connectivity gap',    '#8ab0d8',
  'Artifact zone',       '#C8B89A',
  'Demand overcrowding', '#e8c97a',
  'Well-served',         '#d4a030',
  /* fallback */         '#C8B89A',
]

// ── 3. WALK DISTANCE K=1 (nearest pharmacy) 
// Reversed ramp: near = gold (good), far = blue (bad)
export const WALK_DIST_K1_COLOR = [
  'interpolate', ['linear'], ['get', 'walk_dist_'],
  0,    '#d4a030',
  1,    '#e8c97a',
  3,    '#c8d8e8',
  5,    '#4a80c4',
  10,   '#002395',
  50,   '#001060',
]

// ── 4. WALK DISTANCE K=3 (third nearest — fragility layer) ───────────────────
export const WALK_DIST_K3_COLOR = [
  'interpolate', ['linear'], ['get', 'walk_dis_2'],
  0,    '#d4a030',
  3,    '#e8c97a',
  10,   '#c8d8e8',
  20,   '#4a80c4',
  50,   '#002395',
]

// ── 5. EXCEEDS WALK K1 3KM — binary disparity layer ─────────────────────────
// 'True'  = nearest pharmacy > 3km walk = pharmacy desert
// 'False' = within 3km = accessible
// Values are STRINGS not booleans (Python CSV export preserves capitalised True/False)
export const EXCEEDS_WALK_COLOR = [
  'match', ['get', 'exceeds_wa'],
  'True',  '#C0392B',   // red — beyond 3km, underserved
  'False', '#2980B9',   // blue — within 3km, accessible
  /* fallback */ '#C8B89A',
]

export const EXCEEDS_WALK_OPACITY = 0.75

// ── 6. SNAP FLAG — data quality overlay ────
// walk_sna_1 = 'True' means snap distance > 500m: interpret with caution
// Rendered as a semi-transparent warning wash on top of whatever layer is active.
// 'True'  = flagged   → visible orange-red wash
// 'False' = clean     → fully transparent (shows layer beneath unchanged)
export const SNAP_FLAG_COLOR = '#c73c16'

export const SNAP_FLAG_OPACITY = [
  'match', ['get', 'walk_sna_1'],
  'True',  0.30,
  'False', 0,
  0,
]

// ── 7. EA_TYPE — settlement / apartheid footprint ────────────────────────────
// _* variants are tile-boundary splits — listed explicitly alongside clean values
export const EA_TYPE_COLOR = [
  'match', ['get', 'EA_TYPE'],
  'Township',                     '#8B2500',
  'Informal residential',         '#C4713A',
  'Informal residential_*',       '#C4713A',
  'Formal residential',           '#6B8FA8',
  'Formal residential_*',         '#6B8FA8',
  'Suburb',                       '#6B8FA8',   // treat same as formal
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

// ── 8. % BLACK AFRICAN — warm earth ramp (distinct from access blue→gold) ────
// Parchment → amber → deep brown. Never confusable with access encoding.
export const PCT_BLACK_COLOR = [
  'interpolate', ['linear'],
  ['/', ['get', 'Black_Afri'], ['max', ['get', 'pop_total_'], 1]],
  0,    '#F5F0E8',
  0.25, '#e8d5b0',
  0.5,  '#d4a96a',
  0.75, '#8c5a1a',
  1,    '#2A2318',
]

// ── 9. POPULATION DENSITY — neutral parchment → dark ─────────────────────────
export const POP_DENSITY_COLOR = [
  'step',
  ['/', ['get', 'sal2023_es'], ['get', 'area_km2']],
  '#F5F0E8',
  100,  '#EDE7DC',
  500,  '#C8B89A',
  1000, '#6B5C4E',
  3000, '#2A2318',
  8000, '#1A1A1A',
]

// ── 10. ECONOMIC STATUS ─────────────────────
export const ECON_STATUS_COLOR = [
  'match', ['get', 'econ_statu'],
  'Wealthy',         '#d4a030',
  'Non_Wealthy',     '#6B5C4E',
  'Non_Residential', '#C8B89A',
  /* fallback */     '#F5F0E8',
]

// ── 11. TRANSPORT GAP — bivariate: walk vs drive ──────────────────────────────
// Orange = walk desert but drive well-served (car dependent)
// Blue   = pharmacy desert by both modes (truly isolated)
// Transparent = everything else
export const TRANSPORT_GAP_COLOR = [
  'case',
  ['all',
    ['==', ['get', 'walk_typol'], 'Pharmacy desert'],
    ['any',
      ['==', ['get', 'drive_typo'], 'Well-served'],
      ['==', ['get', 'drive_typo'], 'Demand overcrowding'],
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