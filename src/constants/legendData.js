import {
  EA_TYPE_COLORS,
  EA_TYPE_LABELS,
  WALK_TYPOLOGY_COLORS,
} from './mapStyles'
import {
  ECON_STATUS_COLORS,
  EXCEEDS_WALK_COLORS,
  TRANSPORT_GAP_COLORS,
} from './layerExpressions'

const typologyOrder = [
  'Pharmacy desert',
  'Connectivity gap',
  'Demand overcrowding',
  'Access gap',
  'Well-served',
  'Artifact zone',
]

export const TYPOLOGY_LEGEND = typologyOrder.map(label => ({
  color: WALK_TYPOLOGY_COLORS[label],
  label,
}))

const eaTypes = [
  { colorKey: 'Township', labelKey: 'Township' },
  { colorKey: 'Informal residential', labelKey: 'Informal residential' },
  { colorKey: 'Suburb', label: 'Formal residential / suburb' },
  { colorKey: 'Traditional residential', labelKey: 'Traditional residential' },
  { colorKey: 'Small holdings', labelKey: 'Smallholdings' },
  { colorKey: 'Farms', labelKey: 'Farms' },
  { colorKey: 'Commercial', labelKey: 'Commercial' },
  { colorKey: 'Industrial', labelKey: 'Industrial' },
  { colorKey: 'Vacant', labelKey: 'Vacant' },
  { colorKey: 'Collective living quarters', labelKey: 'Collective living quarters' },
  { colorKey: 'Parks and recreation', label: 'Parks and recreation' },
]

export const EA_TYPE_LEGEND = eaTypes.map(({ colorKey, labelKey, label }) => ({
  color: EA_TYPE_COLORS[colorKey],
  label: (label ?? EA_TYPE_LABELS[labelKey]).replace('\n', ' '),
}))

export const EXCEEDS_WALK_LEGEND = [
  { color: EXCEEDS_WALK_COLORS.true, label: 'Beyond 3 km walk' },
  { color: EXCEEDS_WALK_COLORS.false, label: 'Within 3 km walk' },
]

export const TRANSPORT_GAP_LEGEND = [
  { color: TRANSPORT_GAP_COLORS.walkDesertDriveServed, label: 'Walk desert, drive served' },
  { color: TRANSPORT_GAP_COLORS.noAccessEitherMode, label: 'No access either mode' },
]

export const ECON_STATUS_LEGEND = [
  { color: ECON_STATUS_COLORS.Wealthy, label: 'Wealthy' },
  { color: ECON_STATUS_COLORS.Non_Wealthy, label: 'Non-wealthy' },
  { color: ECON_STATUS_COLORS.Non_Residential, label: 'Non-residential' },
]
