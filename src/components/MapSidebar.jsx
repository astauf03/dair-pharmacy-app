import { useState } from 'react'
import './mapsidebar.css'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PROVINCES = ['Gauteng', 'KwaZulu-Natal']

const PROVINCE_VIEWS = {
  'Gauteng':       { center: [28.15259, -26.09051], zoom: 7.13 },
  'KwaZulu-Natal': { center: [31.50080, -29.01379], zoom: 6    },
}

const LAYER_GROUPS = [
  { key: 'access',  label: 'Access layers',  note: 'Select one'  },
  { key: 'overlay', label: 'Overlays',       note: 'Stack freely' },
  { key: 'context', label: 'Context layers', note: null           },
]

const LAYERS = [
  // Access — radio group
  { id: 'walk-typology',     label: 'Walk typology',       defaultOn: true,  group: 'access'  },
  { id: 'walk-dist-k1',      label: 'Walk distance (k=1)', defaultOn: false, group: 'access'  },
  { id: 'walk-dist-k3',      label: 'Walk distance (k=3)', defaultOn: false, group: 'access'  },
  { id: 'drive-typology',    label: 'Drive typology',      defaultOn: false, group: 'access'  },
  // Overlays — free stack
  { id: 'pharmacy-dots',     label: 'Pharmacies',          defaultOn: true,  group: 'overlay' },
  { id: 'exceeds-walk-3km',  label: 'Beyond 3km walk',     defaultOn: false, group: 'overlay' },
  { id: 'transport-gap',     label: 'Transport gap',       defaultOn: false, group: 'overlay' },
  { id: 'walk-snap-flag',    label: 'Data uncertainty',    defaultOn: false, group: 'overlay' },
  // Context
  { id: 'ea-type',           label: 'Settlement type',     defaultOn: false, group: 'context' },
  { id: 'pct-black-african', label: '% Black African',     defaultOn: false, group: 'context' },
  { id: 'econ-status',       label: 'Economic status',     defaultOn: false, group: 'context' },
  { id: 'pop-density',       label: 'Population density',  defaultOn: false, group: 'context' },
]

// Legend data keyed by active access layer
const ACCESS_RAMP = [
  '#002395', '#1a4fa8', '#4a80c4', '#8ab0d8',
  '#c8d8e8', '#e8c97a', '#ebc159', '#d4a030',
]

const TYPOLOGY_LEGEND = [
  { color: '#002395', label: 'Pharmacy desert' },
  { color: '#4a80c4', label: 'Underserved'     },
  { color: '#8ab0d8', label: 'Fragile'         },
  { color: '#e8c97a', label: 'Overcrowded'     },
  { color: '#d4a030', label: 'Well-served'     },
  { color: '#aaaaaa', label: 'Data-uncertain'  },
]

const EA_TYPE_LEGEND = [
  { color: '#442520', label: 'Township'              },
  { color: '#6B5C4E', label: 'Informal residential'  },
  { color: '#C8B89A', label: 'Formal / Suburb'       },
  { color: '#8ab0d8', label: 'Traditional'           },
  { color: '#002395', label: 'Commercial'            },
  { color: '#EDE7DC', label: 'Farms / Smallholdings' },
]

const POP_DENSITY_CHIPS = [
  { color: '#F5F0E8', label: 'Sparse' },
  { color: '#C8B89A', label: ''       },
  { color: '#6B5C4E', label: ''       },
  { color: '#2A2318', label: ''       },
  { color: '#1A1A1A', label: 'Dense'  },
]

const STATS_PLACEHOLDER = [
  { label: 'Pharmacies',           value: '–', subtext: 'visible in viewport'        },
  { label: 'SALs beyond 3km walk', value: '–', subtext: 'exceeds walk k=1 threshold' },
  { label: 'Avg walk rank',        value: '–', subtext: 'mean normalised walk rank'   },
]

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`toggle-switch ${checked ? 'toggle-switch--on' : ''}`}
      onClick={onChange}
      aria-label={label}
    >
      <span className="toggle-switch__knob" />
    </button>
  )
}

function LegendRamp({ colors, lowLabel = 'Low', highLabel = 'High' }) {
  return (
    <>
      <div className="legend__ramp-labels">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <div className="legend__ramp">
        {colors.map((hex, i) => (
          <div key={i} className="legend__ramp-seg" style={{ background: hex }} />
        ))}
      </div>
    </>
  )
}

function LegendSwatches({ items }) {
  return (
    <div className="legend__swatches">
      {items.map(({ color, label }) => (
        <div key={label} className="legend__entry">
          <span className="legend__swatch" style={{ background: color }} />
          <span className="legend__entry-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Dynamic legend — switches based on active layers
// ─────────────────────────────────────────────

function ActiveLegend({ layers }) {
  const activeAccess = LAYERS.find(l => l.group === 'access' && layers[l.id])

  return (
    <div className="map-legend">

      {/* Access layer legend */}
      {(activeAccess?.id === 'walk-typology' || activeAccess?.id === 'drive-typology') && (
        <>
          <p className="legend__sublabel">
            {activeAccess.id === 'walk-typology' ? 'Walk typology' : 'Drive typology'}
          </p>
          <LegendSwatches items={TYPOLOGY_LEGEND} />
        </>
      )}

      {(activeAccess?.id === 'walk-dist-k1' || activeAccess?.id === 'walk-dist-k3') && (
        <>
          <p className="legend__sublabel">
            {activeAccess.id === 'walk-dist-k1' ? 'Walk distance to k=1 pharmacy' : 'Walk distance to k=3 pharmacy'}
          </p>
          <LegendRamp colors={[...ACCESS_RAMP].reverse()} lowLabel="Near" highLabel="Far" />
        </>
      )}

      {/* Overlay indicators */}
      {layers['pharmacy-dots'] && (
        <div className="legend__entry" style={{ marginTop: 8 }}>
          <span className="legend__dot" />
          <span className="legend__entry-label">Pharmacy location</span>
        </div>
      )}

      {layers['exceeds-walk-3km'] && (
        <div className="legend__entry" style={{ marginTop: 4 }}>
          <span className="legend__swatch" style={{ background: '#002395' }} />
          <span className="legend__entry-label">Beyond 3km walk</span>
        </div>
      )}

      {layers['transport-gap'] && (
        <>
          <div className="legend__entry" style={{ marginTop: 4 }}>
            <span className="legend__swatch" style={{ background: '#c73c16' }} />
            <span className="legend__entry-label">Walk desert, drive served</span>
          </div>
          <div className="legend__entry" style={{ marginTop: 2 }}>
            <span className="legend__swatch" style={{ background: '#002395' }} />
            <span className="legend__entry-label">No access either mode</span>
          </div>
        </>
      )}

      {layers['walk-snap-flag'] && (
        <div className="legend__entry" style={{ marginTop: 4 }}>
          <span className="legend__swatch" style={{ background: '#c73c16', opacity: 0.4 }} />
          <span className="legend__entry-label">Data uncertainty (snap &gt;500m)</span>
        </div>
      )}

      {/* Context layer legends */}
      {layers['ea-type'] && (
        <>
          <p className="legend__sublabel" style={{ marginTop: 8 }}>Settlement type</p>
          <LegendSwatches items={EA_TYPE_LEGEND} />
        </>
      )}

      {layers['pct-black-african'] && (
        <>
          <p className="legend__sublabel" style={{ marginTop: 8 }}>% Black African</p>
          <LegendRamp colors={ACCESS_RAMP} lowLabel="0%" highLabel="100%" />
        </>
      )}

      {layers['econ-status'] && (
        <>
          <p className="legend__sublabel" style={{ marginTop: 8 }}>Economic status</p>
          <LegendSwatches items={[
            { color: '#d4a030', label: 'Wealthy'          },
            { color: '#002395', label: 'Non-wealthy'      },
            { color: '#C8B89A', label: 'Non-residential'  },
          ]} />
        </>
      )}

      {layers['pop-density'] && (
        <>
          <p className="legend__sublabel" style={{ marginTop: 8 }}>Population density</p>
          <div className="legend__chips">
            {POP_DENSITY_CHIPS.map((chip, i) => (
              <div key={i} className="legend__chip">
                <div
                  className="legend__chip-swatch"
                  style={{ background: chip.color }}
                />
                {chip.label && (
                  <span className="legend__chip-label">{chip.label}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

function MapSidebar({ onLayerToggle, mapRef, dynamicStats }) {
  const [activeProvince, setActiveProvince] = useState('Gauteng')
  const [layers, setLayers] = useState(
    Object.fromEntries(LAYERS.map(l => [l.id, l.defaultOn]))
  )
  const [collapsed, setCollapsed] = useState(false)

  function toggleLayer(id) {
    const layer = LAYERS.find(l => l.id === id)

    setLayers(prev => {
      const next = { ...prev }

      if (layer.group === 'access') {
        // Radio behavior — turn off all access layers, turn on selected
        LAYERS.filter(l => l.group === 'access').forEach(l => {
          next[l.id] = false
          onLayerToggle?.(l.id, false)
        })
        next[id] = true
        onLayerToggle?.(id, true)
      } else {
        next[id] = !prev[id]
        onLayerToggle?.(id, next[id])
      }

      return next
    })
  }

  function handleProvince(province) {
    setActiveProvince(province)
    const view = PROVINCE_VIEWS[province]
    if (view && mapRef?.current) {
      mapRef.current.flyTo({
        center: view.center,
        zoom: view.zoom,
        duration: 1200,
      })
    }
  }

  if (collapsed) {
    return (
      <div className="map-sidebar map-sidebar--collapsed">
        <button
          className="sidebar__collapse-btn"
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
        >
          ▶
        </button>
      </div>
    )
  }

  return (
    <div className="map-sidebar">

      {/* Header */}
      <div className="sidebar__header">
        <span className="sidebar__header-label">Explore</span>
        <button
          className="sidebar__collapse-btn"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
        >
          ◀
        </button>
      </div>

      <div className="sidebar__body">

        {/* Province toggle */}
        <section className="sidebar__section">
          <p className="sidebar__section-label">Province</p>
          <div className="province-toggle">
            {PROVINCES.map(p => (
              <button
                key={p}
                className={`province-pill ${activeProvince === p ? 'province-pill--active' : ''}`}
                onClick={() => handleProvince(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Stat cards */}
        <section className="sidebar__section">
          <p className="sidebar__section-label">Summary</p>
          <div className="stat-grid">
            {(dynamicStats ?? STATS_PLACEHOLDER).map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-card__label">{s.label}</span>
                <span className="stat-card__value">{s.value}</span>
                <span className="stat-card__subtext">{s.subtext}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Layer toggles — grouped */}
        <section className="sidebar__section">
          <p className="sidebar__section-label">Layers</p>
          <div className="layer-list">
            {LAYER_GROUPS.map(group => (
              <div key={group.key} className="layer-group">
                <div className="layer-group__header">
                  <span className="layer-group__title">{group.label}</span>
                  {group.note && (
                    <span className="layer-group__note">{group.note}</span>
                  )}
                </div>
                {LAYERS.filter(l => l.group === group.key).map(l => (
                  <div key={l.id} className="layer-row">
                    <span className="layer-row__label">{l.label}</span>
                    <Toggle
                      checked={layers[l.id]}
                      onChange={() => toggleLayer(l.id)}
                      label={`Toggle ${l.label}`}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic legend */}
        <section className="sidebar__section">
          <p className="sidebar__section-label">Legend</p>
          <ActiveLegend layers={layers} />
        </section>

      </div>
    </div>
  )
}

export default MapSidebar