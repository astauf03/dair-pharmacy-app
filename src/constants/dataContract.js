// dataContract.js
// Place where everything the site knows about the v2 data is.
// This module also has no imports.

// Field Names
// v2 field names the site reads as constants.
export const FIELDS = {
  EA_CODE: 'EA_CODE',
  EA_TYPE: 'EA_TYPE',
  PR_NAME: 'PR_NAME',
  SP_NAME: 'SP_NAME',
  MN_NAME: 'MN_NAME',
  area_km2: 'area_km2',
  pop2023est: 'pop2023est',
  pop2011sum: 'pop2011sum',
  wlk_type: 'wlk_type',
  drv_type: 'drv_type',
  wlk_k1_km: 'wlk_k1_km',
  wlk_k3_km: 'wlk_k3_km',
  drv_k1_km: 'drv_k1_km',
  wlk_snapfl: 'wlk_snapfl',
  econ_stat: 'econ_stat',
  Black_Afr: 'Black_Afr',
  Coloured: 'Coloured',
  Ind_Asian: 'Ind_Asian',
  White: 'White',
  Other: 'Other',
  wlk_ai: 'wlk_ai',
  drv_ai: 'drv_ai',
  cent_lat: 'cent_lat',
  cent_lng: 'cent_lng',
}

// Access Typology
// Exact v2 values, display labels equal the values.
export const ACCESS_TYPOLOGY_CLASSES = [
  'Pharmacy Desert',
  'Access Gap',
  'Connectivity Gap',
  'Demand Overcrowding',
  'Artifact Zone',
  'Well-Served',
]

export const EMPTY_TYPOLOGY_CLASSES = ['Access Gap', 'Artifact Zone']

export const EMPTY_TYPOLOGY_NOTE =
  'Access Gap and Artifact Zone: no SALs in current data'

// Same palette meaning as WALK_TYPOLOGY_COLORS in mapStyles.js,
// keyed by Title Case v2 class names.
export const ACCESS_TYPOLOGY_COLORS = {
  'Pharmacy Desert': '#002395',
  'Access Gap': '#4A80C4',
  'Connectivity Gap': '#8AB0D8',
  'Demand Overcrowding': '#E8C97A',
  'Artifact Zone': '#ADADAC',
  'Well-Served': '#D4A030',
}

// Settlement Type
export const SETTLEMENT_TYPES = [
  'Suburb',
  'Farms & Smallholdings',
  'Township',
  'Informal Settlement',
  'Traditional (Former Homeland)',
  'Collective Living Quarters',
  'Non-Residential',
  'No Dwellings (2011)',
]

// Raw EA_TYPE to Settlement Type. Any value ending in "_*" is a clipped
// polygon with no 2011 dwellings, and null or unknown values map to null.
export const settlementTypeOf = (eaType) => {
  if (typeof eaType !== 'string') return null
  if (eaType.endsWith('_*')) return 'No Dwellings (2011)'

  switch (eaType) {
    case 'Suburb':
      return 'Suburb'
    case 'Township':
      return 'Township'
    case 'Informal residential':
      return 'Informal Settlement'
    case 'Traditional residential':
      return 'Traditional (Former Homeland)'
    case 'Collective living quarters':
      return 'Collective Living Quarters'
    case 'Farms':
    case 'Smallholdings':
    case 'Small holdings':
      return 'Farms & Smallholdings'
    case 'Commercial':
    case 'Industrial':
    case 'Parks and recreation':
    case 'Vacant':
      return 'Non-Residential'
    default:
      return null
  }
}

// Color mapping for 8 Settlement Types. Suburb, Township, Informal,
// and Traditional keep their current colors. Farms & Smallholdings uses the
// Farms color. Non-Residential uses the Industrial color. No Dwellings (2011)
// uses a neutral light gray.
export const SETTLEMENT_TYPE_COLORS = {
  'Suburb': '#6B8FA8',
  'Farms & Smallholdings': '#C8B878',
  'Township': '#702424',
  'Informal Settlement': '#C4713A',
  'Traditional (Former Homeland)': '#4A7C6F',
  'Collective Living Quarters': '#EBC159',
  'Non-Residential': '#555566',
  'No Dwellings (2011)': '#E8E4DC',
}

// Wealth Class
export const WEALTH_CLASS_LABELS = {
  Wealthy: 'Wealthy',
  Non_Wealthy: 'Non-Wealthy',
  Non_Residential: 'Non-Residential',
}

// Population Group
// Keys and labels are Title Case, field names keep their source spelling.
export const POPULATION_GROUPS = [
  { key: 'Black African', field: 'Black_Afr', label: 'Black African' },
  { key: 'Coloured', field: 'Coloured', label: 'Coloured' },
  { key: 'Indian/Asian', field: 'Ind_Asian', label: 'Indian/Asian' },
  { key: 'White', field: 'White', label: 'White' },
  { key: 'Other', field: 'Other', label: 'Other' },
]

// Distance Thresholds
export const THRESHOLDS_KM = { walk: 3, drive: 10 }

// True when km is null, undefined, non-finite, or beyond the mode's threshold.
export const isBeyondThreshold = (km, mode) =>
  km == null || !Number.isFinite(km) || km > THRESHOLDS_KM[mode]

// Mapbox GL expression with same rule: missing/null counts as beyond.
export const beyondThresholdExpression = (field, mode) => [
  'any',
  ['==', ['get', field], null],
  ['>', ['get', field], THRESHOLDS_KM[mode]],
]

// Tileset
// v2 fields the /map page reads from vector tileset.
export const TILE_FIELDS = [
  'EA_CODE',
  'EA_TYPE',
  'PR_NAME',
  'area_km2',
  'pop2023est',
  'pop2011sum',
  'wlk_type',
  'drv_type',
  'wlk_k1_km',
  'wlk_k3_km',
  'drv_k1_km',
  'wlk_snapfl',
  'econ_stat',
  'Black_Afr',
]

export const TILE_SOURCE_LAYER = 'dair_sal'
