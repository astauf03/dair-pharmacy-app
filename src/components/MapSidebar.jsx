import { useState } from 'react'
import './mapsidebar.css'


const PROVINCES = ['Gauteng', 'KwaZulu-Natal']

const PROVINCE_VIEWS = {
  'Gauteng': { center: [28.15259, -26.09051], zoom: 7.13 },
  'KwaZulu-Natal': { center: [31.50080, -29.01379], zoom: 6.81 }
}

const LAYERS = [
  { id: 'walk',                label: 'Walking Access',      defaultOn: true  },
  { id: 'drive',               label: 'Driving Access',      defaultOn: false },
  { id: 'pharmacy-dots',       label: 'Pharmacies',          defaultOn: true  },
  { id: 'pop-density',         label: 'Population Density',  defaultOn: false },
  { id: 'disparity-highlight', label: 'Disparity highlight', defaultOn: false },
]

// gold low, blue high
const RAMP = [
  { token: '--data-access-1', hex: '#d4a030' },
  { token: '--data-access-2', hex: '#ebc159' },
  { token: '--data-access-3', hex: '#e8c97a' },
  { token: '--data-access-4', hex: '#c8d8e8' },
  { token: '--data-access-5', hex: '#8ab0d8' },
  { token: '--data-access-6', hex: '#4a80c4' },
  { token: '--data-access-7', hex: '#1a4fa8' },
  { token: '--data-access-8', hex: '#002395' },
]

const POP_DENSITY_CHIPS = [
  { color: '#F5F0E8', label: 'Sparse' },
  { color: '#C8B89A', label: '' },
  { color: '#8ab0d8', label: '' },
  { color: '#4a80c4', label: '' },
  { color: '#002395', label: 'Dense' },
]

const STATS_PLACEHOLDER = [
  { label: 'Pharmacies',          value: '–', subtext: 'visible in viewport' },
  { label: 'Wards with any access', value: '–', subtext: 'Walking Access Index > 0' },
  { label: 'Avg walking access',  value: '–', subtext: 'mean Walking Access Index' },
]


function MapSidebar({ onLayerToggle, mapRef, dynamicStats }) {
  const [activeProvince, setActiveProvince] = useState('Gauteng')
  const [layers, setLayers] = useState(
    Object.fromEntries(LAYERS.map(l => [l.id, l.defaultOn]))
  )
  const [collapsed, setCollapsed] = useState(false)

  function toggleLayer(id) {
    setLayers(prev => {
      const next = { ...prev, [id]: !prev[id] }
      onLayerToggle?.(id, next[id])
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
        duration: 1200
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

      {/* ── Header ── */}
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

        {/* ── Province toggle ── */}
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

        {/* ── Stat cards ── */}
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

        {/* ── Layer toggles ── */}
        <section className="sidebar__section">
          <p className="sidebar__section-label">Layers</p>
          <div className="layer-list">
            {LAYERS.map(l => (
              <div key={l.id} className="layer-row">
                <span className="layer-row__label">{l.label}</span>
                <button
                  role="switch"
                  aria-checked={layers[l.id]}
                  className={`toggle-switch ${layers[l.id] ? 'toggle-switch--on' : ''}`}
                  onClick={() => toggleLayer(l.id)}
                  aria-label={`Toggle ${l.label}`}
                >
                  <span className="toggle-switch__knob" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Legend ── */}
        <section className="sidebar__section">
          <p className="sidebar__section-label">Legend</p>
          <div className="map-legend">
            <div className="legend__ramp-labels">
              <span>Low access</span>
              <span>High access</span>
            </div>
            <div className="legend__ramp">
              {RAMP.map(stop => (
                <div
                  key={stop.token}
                  className="legend__ramp-seg"
                  style={{ background: stop.hex }}
                />
              ))}
            </div>
            <div className="legend__entries">
              <div className="legend__entry">
                <span className="legend__dot" />
                <span className="legend__entry-label">Pharmacy location</span>
              </div>
                 <div className="legend__entry" style={{ marginTop: '8px', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <span className="legend__entry-label" style={{ marginBottom: '4px' }}>Population Density</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {POP_DENSITY_CHIPS.map((chip, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '20px', height: '14px', borderRadius: '2px', background: chip.color, border: '1px solid rgba(0,0,0,0.15)' }} />
                      <span style={{ fontSize: '9px', color: 'var(--text-muted, #888)' }}>{chip.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default MapSidebar