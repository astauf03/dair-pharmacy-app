 //Shared map styling constants — imported by N2, N4, and future sections.
// Do NOT redefine these inline in components.

export const EA_TYPE_COLORS = {
  'Township':                '#8B2500',
  'Informal residential':    '#C4713A',
  'Formal residential':      '#6B8FA8',
  'Suburb':                  '#6B8FA8',
  'Traditional residential': '#4A7C6F',
  'Smallholdings':           '#A89860',
  'Small holdings':          '#A89860',
  'Farms':                   '#C8B878',
  'Commercial':              '#002395',
  'Commerical':              '#002395',
  'Industrial':              '#555566',
}
export const EA_TYPE_DEFAULT_COLOR = '#E8E4DC'

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

export const EA_TYPE_ORDER = [
  'Township', 'Informal residential', 'Formal residential',
  'Traditional residential', 'Smallholdings', 'Farms',
  'Collective living quarters', 'Commercial', 'Industrial',
]
export const EA_TYPE_LABELS = {
  'Township':                   'Township',
  'Informal residential':       'Informal\nresidential',
  'Formal residential':         'Suburb',
  'Traditional residential':    'Traditional\nresidential',
  'Smallholdings':              'Small\nholdings',
  'Farms':                      'Farms',
  'Collective living quarters': 'Collective\nliving',
  'Industrial':                 'Industrial',
}
export const CHART_EA_TYPES = new Set([
  'Township', 'Informal residential', 'Formal residential',
  'Traditional residential', 'Smallholdings', 'Farms',
  'Collective living quarters', 'Commercial', 'Industrial',
])

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

// Walk/drive access typology — 6 categories.
// TODO: confirm exact string values from data once available.
export const WALK_TYPOLOGY_COLORS = {
  'Pharmacy desert': '#8B0000',
  'Poor access':     '#CC4400',
  'Low access':      '#E8821A',
  'Moderate access': '#E8C840',
  'Good access':     '#6AAF3D',
  'Well-served':     '#1A7A1A',
}
export const WALK_TYPOLOGY_EXPRESSION = [
  'match', ['get', 'walk_typology'],
  'Pharmacy desert', '#8B0000',
  'Poor access',     '#CC4400',
  'Low access',      '#E8821A',
  'Moderate access', '#E8C840',
  'Good access',     '#6AAF3D',
  'Well-served',     '#1A7A1A',
  '#E8E4DC',
]
export const DRIVE_TYPOLOGY_EXPRESSION = [
  'match', ['get', 'drive_typology'],
  'Pharmacy desert', '#8B0000',
  'Poor access',     '#CC4400',
  'Low access',      '#E8821A',
  'Moderate access', '#E8C840',
  'Good access',     '#6AAF3D',
  'Well-served',     '#1A7A1A',
  '#E8E4DC',
]

// Walk distance continuous color ramp (km)
export const WALK_DIST_COLOR_EXPRESSION = (property = 'walk_dist_k1_km') => [
  'interpolate', ['linear'], ['coalesce', ['get', property], 0],
  0,   '#1a9641',
  1,   '#a6d96a',
  2,   '#ffffbf',
  3,   '#fdae61',
  5,   '#d7191c',
  10,  '#7b0000',
]

// Binary: exceeds_walk_k1_3km "True" = pharmacy desert red, "False" = accessible blue
export const EXCEEDS_WALK_COLOR_EXPRESSION = [
  'match', ['get', 'exceeds_walk_k1_3km'],
  'True',  '#C0392B',
  '#2980B9',
]

// Snap flag — data quality: "True" = snapped >500m (lower confidence)
export const SNAP_FLAG_OPACITY_EXPRESSION = [
  'match', ['get', 'walk_snap_flag'],
  'True', 0.25,
  0.85,
]