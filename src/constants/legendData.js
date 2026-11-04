import {
  ACCESS_TYPOLOGY_COLORS,
  SETTLEMENT_TYPE_COLORS,
  SETTLEMENT_TYPES,
  WEALTH_CLASS_LABELS,
} from './dataContract'
import {
  EXCEEDS_WALK_COLORS,
  TRANSPORT_GAP_COLORS,
  WEALTH_CLASS_COLORS,
} from './layerExpressions'

const typologyOrder = [
  'Pharmacy Desert',
  'Connectivity Gap',
  'Demand Overcrowding',
  'Well-Served',
]

export const TYPOLOGY_LEGEND = typologyOrder.map(label => ({
  color: ACCESS_TYPOLOGY_COLORS[label],
  label,
}))

export const SETTLEMENT_TYPE_LEGEND = SETTLEMENT_TYPES.map(label => ({
  color: SETTLEMENT_TYPE_COLORS[label],
  label,
}))

export const WEALTH_CLASS_LEGEND = Object.entries(WEALTH_CLASS_LABELS).map(([key, label]) => ({
  color: WEALTH_CLASS_COLORS[key],
  label,
}))

export const EXCEEDS_WALK_LEGEND = [
  { color: EXCEEDS_WALK_COLORS.true, label: 'Beyond 3 km Walk or Unreachable' },
  { color: EXCEEDS_WALK_COLORS.false, label: 'Within 3 km Walk' },
]

export const TRANSPORT_GAP_LEGEND = [
  { color: TRANSPORT_GAP_COLORS.walkDesertDriveServed, label: 'Walking Desert, Driving Served' },
  { color: TRANSPORT_GAP_COLORS.noAccessEitherMode, label: 'No Access Either Mode' },
]