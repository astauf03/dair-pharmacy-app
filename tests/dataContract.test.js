import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  ACCESS_TYPOLOGY_CLASSES,
  ACCESS_TYPOLOGY_COLORS,
  FIELDS,
  POPULATION_GROUPS,
  SETTLEMENT_TYPES,
  SETTLEMENT_TYPE_COLORS,
  TILE_FIELDS,
  TILE_SOURCE_LAYER,
  THRESHOLDS_KM,
  WEALTH_CLASS_LABELS,
  beyondThresholdExpression,
  isBeyondThreshold,
  settlementTypeOf,
} from '../src/constants/dataContract.js'

const isTitleCase = (value) => {
  if (typeof value !== 'string' || value.length === 0) return false
  const words = value.match(/[A-Za-z]+/g) ?? []
  return words.every((word) => word[0] === word[0].toUpperCase())
}

describe('display labels', () => {
  it('are Title Case', () => {
    const labels = [
      ...ACCESS_TYPOLOGY_CLASSES,
      ...SETTLEMENT_TYPES,
      ...Object.values(WEALTH_CLASS_LABELS),
      ...POPULATION_GROUPS.map((group) => group.label),
    ]
    for (const label of labels) {
      assert.ok(isTitleCase(label), `expected Title Case: ${label}`)
    }
  })
})

describe('settlementTypeOf', () => {
  it('maps every v2 EA_TYPE value to a non-null Settlement Type', () => {
    const values = [
      'Suburb',
      'Township',
      'Traditional residential',
      'Informal residential',
      'Farms',
      'Smallholdings',
      'Commercial',
      'Industrial',
      'Vacant',
      'Parks and recreation',
      'Collective living quarters',
    ]
    for (const value of values) {
      assert.ok(settlementTypeOf(value), `no Settlement Type for ${value}`)
    }
  })

  it('maps every _* value to No Dwellings (2011)', () => {
    const values = [
      'Vacant_*',
      'Industrial_*',
      'Farms_*',
      'Small holdings_*',
      'Informal residential_*',
      'Formal residential_*',
      'Parks and recreation_*',
      'Traditional residential_*',
      'Collective living quarters_*',
    ]
    for (const value of values) {
      assert.equal(
        settlementTypeOf(value),
        'No Dwellings (2011)',
        `wrong Settlement Type for ${value}`,
      )
    }
  })
})

describe('isBeyondThreshold', () => {
  it('counts null, over-threshold, and non-finite as beyond', () => {
    assert.equal(isBeyondThreshold(null, 'walk'), true)
    assert.equal(isBeyondThreshold(3.01, 'walk'), true)
    assert.equal(isBeyondThreshold(10.5, 'drive'), true)
    assert.equal(isBeyondThreshold(undefined, 'walk'), true)
    assert.equal(isBeyondThreshold(Number.NaN, 'walk'), true)
    assert.equal(isBeyondThreshold(Number.POSITIVE_INFINITY, 'drive'), true)
  })

  it('counts within-threshold values as not beyond', () => {
    assert.equal(isBeyondThreshold(3, 'walk'), false)
    assert.equal(isBeyondThreshold(0, 'drive'), false)
  })

  it('uses the walk and drive thresholds', () => {
    assert.deepEqual(THRESHOLDS_KM, { walk: 3, drive: 10 })
  })
})

describe('tile manifest', () => {
  it('matches TILE_FIELDS and TILE_SOURCE_LAYER', () => {
    const manifest = JSON.parse(
      readFileSync(new URL('../scripts/tile_fields.json', import.meta.url), 'utf8'),
    )
    assert.deepEqual(manifest.fields, TILE_FIELDS)
    assert.equal(manifest.source_layer, TILE_SOURCE_LAYER)
  })

  it('only lists fields present in FIELDS', () => {
    const fieldValues = new Set(Object.values(FIELDS))
    for (const field of TILE_FIELDS) {
      assert.ok(fieldValues.has(field), `${field} is not in FIELDS`)
    }
  })

  it('has a color for every typology class and Settlement Type', () => {
    for (const label of ACCESS_TYPOLOGY_CLASSES) {
      assert.ok(ACCESS_TYPOLOGY_COLORS[label], `no typology color for ${label}`)
    }
    for (const label of SETTLEMENT_TYPES) {
      assert.ok(SETTLEMENT_TYPE_COLORS[label], `no Settlement Type color for ${label}`)
    }
  })
})

describe('tileset recipe', () => {
  const recipe = JSON.parse(
    readFileSync(new URL('../public/data/recipe.v2.json', import.meta.url), 'utf8'),
  )

  it('keeps the v2 source layer name', () => {
    assert.ok(
      TILE_SOURCE_LAYER in recipe.layers,
      `expected layer ${TILE_SOURCE_LAYER} in recipe.layers`,
    )
  })

  it('points at the v2 source', () => {
    assert.ok(
      recipe.layers[TILE_SOURCE_LAYER].source.includes('dair-sal-v2'),
      `source does not mention dair-sal-v2: ${recipe.layers[TILE_SOURCE_LAYER].source}`,
    )
  })
})

describe('beyondThresholdExpression', () => {
  it('flags missing or null properties and values over the threshold', () => {
    assert.deepEqual(beyondThresholdExpression('wlk_k1_km', 'walk'), [
      'any',
      ['==', ['get', 'wlk_k1_km'], null],
      ['>', ['get', 'wlk_k1_km'], 3],
    ])
    assert.deepEqual(beyondThresholdExpression('drv_k1_km', 'drive'), [
      'any',
      ['==', ['get', 'drv_k1_km'], null],
      ['>', ['get', 'drv_k1_km'], 10],
    ])
  })
})

const TOWNSHIP_EXTRACTS = [
  {
    name: 'olievenhoutbosch',
    path: '../public/data/olievenhoutbosch.geojson',
    salCount: 82,
  },
  {
    name: 'kwamashu',
    path: '../public/data/kwamashu.geojson',
    salCount: 253,
  },
]

const TOWNSHIP_PROPERTIES = [
  'EA_CODE',
  'EA_TYPE',
  'PR_NAME',
  'SP_NAME',
  'MN_NAME',
  'area_km2',
  'pop2023est',
  'wlk_type',
  'wlk_k1_km',
  'Black_Afr',
  'Coloured',
  'Ind_Asian',
  'White',
  'Other',
  'settlement',
]

describe('township extracts', () => {
  const townships = TOWNSHIP_EXTRACTS.map(extract => ({
    ...extract,
    geojson: JSON.parse(
      readFileSync(new URL(extract.path, import.meta.url), 'utf8'),
    ),
  }))

  for (const township of townships) {
    it(`${township.name} has the expected unique SAL count`, () => {
      const codes = new Set(
        township.geojson.features.map(feature => feature.properties?.EA_CODE),
      )
      assert.equal(codes.size, township.salCount)
    })

    it(`${township.name} carries every property the township section reads`, () => {
      for (const feature of township.geojson.features) {
        for (const property of TOWNSHIP_PROPERTIES) {
          assert.ok(
            property in feature.properties,
            `missing ${property} on ${feature.properties?.EA_CODE}`,
          )
        }
      }
    })

    it(`${township.name} uses only valid wlk_type values`, () => {
      for (const feature of township.geojson.features) {
        assert.ok(
          ACCESS_TYPOLOGY_CLASSES.includes(feature.properties.wlk_type),
          `invalid wlk_type ${feature.properties.wlk_type} on ${feature.properties.EA_CODE}`,
        )
      }
    })

    it(`${township.name} EA_TYPE maps to a Settlement Type`, () => {
      for (const feature of township.geojson.features) {
        assert.ok(
          settlementTypeOf(feature.properties.EA_TYPE),
          `no Settlement Type for ${feature.properties.EA_TYPE} on ${feature.properties.EA_CODE}`,
        )
      }
    })
  }
})

const PROVINCE_POINT_EXTRACTS = [
  {
    name: 'gauteng',
    path: '../public/data/gauteng.geojson',
    featureCount: 20850,
  },
  {
    name: 'kzn',
    path: '../public/data/kzn.geojson',
    featureCount: 17530,
  },
]

const PROVINCE_POINT_PROPERTIES = [
  'EA_CODE',
  'EA_TYPE',
  'settlement',
  'PR_NAME',
  'area_km2',
  'pop2023est',
  'wlk_type',
  'wlk_k1_km',
]

describe('province point extracts', () => {
  const provinces = PROVINCE_POINT_EXTRACTS.map(extract => ({
    ...extract,
    geojson: JSON.parse(
      readFileSync(new URL(extract.path, import.meta.url), 'utf8'),
    ),
  }))

  for (const province of provinces) {
    it(`${province.name} has the expected feature count`, () => {
      assert.equal(province.geojson.features.length, province.featureCount)
    })

    it(`${province.name} features are all Points`, () => {
      for (const feature of province.geojson.features) {
        assert.equal(feature.geometry?.type, 'Point')
      }
    })

    it(`${province.name} carries every property the story maps read`, () => {
      for (const feature of province.geojson.features) {
        for (const property of PROVINCE_POINT_PROPERTIES) {
          assert.ok(
            property in feature.properties,
            `missing ${property} on ${feature.properties?.EA_CODE}`,
          )
        }
      }
    })

    it(`${province.name} uses only valid wlk_type values`, () => {
      for (const feature of province.geojson.features) {
        assert.ok(
          ACCESS_TYPOLOGY_CLASSES.includes(feature.properties.wlk_type),
          `invalid wlk_type ${feature.properties.wlk_type} on ${feature.properties.EA_CODE}`,
        )
      }
    })

    it(`${province.name} uses only valid settlement values`, () => {
      for (const feature of province.geojson.features) {
        assert.ok(
          SETTLEMENT_TYPES.includes(feature.properties.settlement),
          `invalid settlement ${feature.properties.settlement} on ${feature.properties.EA_CODE}`,
        )
      }
    })

    it(`${province.name} EA_CODE values are unique`, () => {
      const codes = province.geojson.features.map(
        feature => feature.properties?.EA_CODE,
      )
      assert.equal(new Set(codes).size, province.featureCount)
    })
  }
})

const N2_CHART_FILES = [
  {
    name: 'gauteng',
    path: '../public/data/chart_n2_gauteng.json',
  },
  {
    name: 'kzn',
    path: '../public/data/chart_n2_kzn.json',
  },
]

const POPULATION_GROUP_KEYS = POPULATION_GROUPS.map(group => group.key)
const N2_CHART_KEYS = ['type', 'density', ...POPULATION_GROUP_KEYS]

describe('N2 chart files', () => {
  const charts = N2_CHART_FILES.map(chart => ({
    ...chart,
    records: JSON.parse(
      readFileSync(new URL(chart.path, import.meta.url), 'utf8'),
    ),
  }))

  for (const chart of charts) {
    it(`${chart.name} has the seven expected keys on every record`, () => {
      for (const record of chart.records) {
        assert.deepEqual(
          Object.keys(record).sort(),
          [...N2_CHART_KEYS].sort(),
        )
      }
    })

    it(`${chart.name} types are Settlement Types and never No Dwellings (2011)`, () => {
      for (const record of chart.records) {
        const type = record.type.replace(/\n/g, ' ')
        assert.ok(SETTLEMENT_TYPES.includes(type), `unknown type ${type}`)
        assert.notEqual(type, 'No Dwellings (2011)')
      }
    })

    it(`${chart.name} Population Group percentages sum to 98–102`, () => {
      for (const record of chart.records) {
        const sum = POPULATION_GROUP_KEYS.reduce(
          (total, key) => total + record[key],
          0,
        )
        assert.ok(
          sum >= 98 && sum <= 102,
          `percentages sum to ${sum} for ${record.type}`,
        )
      }
    })

    it(`${chart.name} density is a non-negative integer`, () => {
      for (const record of chart.records) {
        assert.ok(
          Number.isInteger(record.density),
          `density ${record.density} is not an integer for ${record.type}`,
        )
        assert.ok(
          record.density >= 0,
          `density ${record.density} is negative for ${record.type}`,
        )
      }
    })

    it(`${chart.name} has no duplicate types`, () => {
      const types = chart.records.map(record => record.type)
      assert.equal(new Set(types).size, types.length)
    })
  }
})
