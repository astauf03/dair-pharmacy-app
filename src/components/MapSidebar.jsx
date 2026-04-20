import { useState } from 'react'
import './mapsidebar.css'

// PLACEHOLDER stat values — replace with real data from Tess when available
const STATS = [
  { label: 'Pharmacies', value: '4,200', subtext: 'across both provinces' },
  { label: 'Wards with access', value: '61%', subtext: 'within 5km walk' },
  { label: 'Population served', value: '8.3M', subtext: 'estimated residents' },
]

const PROVINCES = ['Gauteng', 'KwaZulu-Natal']

const LAYERS = [
  { id: 'ward-boundaries', label: 'Ward boundaries', defaultOn: true },
  { id: 'pharmacies', label: 'Pharmacies', defaultOn: true },
  { id: 'population-heatmap', label: 'Population heatmap', defaultOn: false },
  { id: 'disparity-highlight', label: 'Disparity highlight', defaultOn: false },
]

// Choropleth ramp — 8 stops, blue → gold
const RAMP = [
  { token: '--data-access-1', hex: '#002395' },
  { token: '--data-access-2', hex: '#1a4fa8' },
  { token: '--data-access-3', hex: '#4a80c4' },
  { token: '--data-access-4', hex: '#8ab0d8' },
  { token: '--data-access-5', hex: '#c8d8e8' },
  { token: '--data-access-6', hex: '#e8c97a' },
  { token: '--data-access-7', hex: '#ebc159' },
  { token: '--data-access-8', hex: '#d4a030' },
]

function MapSidebar() {
  const [activeProvince, setActiveProvince] = useState('Gauteng')
  const [layers, setLayers] = useState(
    Object.fromEntries(LAYERS.map(l => [l.id, l.defaultOn]))
  )
  const [collapsed, setCollapsed] = useState(false)

  function toggleLayer(id) {
    setLayers(prev => ({ ...prev, [id]: !prev[id] }))
    // TODO Session 4: wire to map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
  }

  function handleProvince(province) {
    setActiveProvince(province)
    // TODO Session 4: wire to map.flyTo() for province center
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
            {STATS.map(s => (
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
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default MapSidebar