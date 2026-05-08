# MUSA/DAIR Pharmacy Access Map

A spatial storytelling application visualizing pharmacy access and healthcare geography across South Africa, focused on Gauteng and KwaZulu-Natal. Built for the [MUSA Practicum 2026](https://pennmusa.github.io/MUSA_801.io/) in collaboration with the [DAIR Institute](https://www.dair-institute.org/).

Live site: (url)

---

## Table of Contents

1. [Project Purpose](#project-purpose)
2. [Architecture Overview](#architecture-overview)
3. [Setup](#setup)
4. [Environment Variables](#environment-variables)
5. [Folder Structure](#folder-structure)
6. [Data & Map Pipeline](#data--map-pipeline)
7. [Tilesets Workflow](#tilesets-workflow)
8. [How Story Sections Interact with Map Layers](#how-story-sections-interact-with-map-layers)
9. [Map Layer Reference](#map-layer-reference)
10. [Adding New Map Layers or Story Chapters](#adding-new-map-layers-or-story-chapters)
11. [Known Technical Debt & Limitations](#known-technical-debt--limitations)
12. [Troubleshooting](#troubleshooting)
13. [Acknowledgements](#acknowledgements)

---

## Project Purpose

This application examines disparities in pharmacy access shaped by South Africa's apartheid-era spatial geography. It combines a scroll-driven narrative (Story page) with an interactive map dashboard (Map page) to communicate access gaps across different settlement types — townships, informal settlements, and formal suburbs — primarily in Gauteng and KwaZulu-Natal provinces.

The two main views:

- **Story page** (`/`): Linear scrollytelling narrative that flies the map through spatial context, apartheid geography, township deep dives (Olievenhoutbosch and KwaMashu), and province-level comparisons.
- **Map page** (`/map`): Interactive dashboard where users toggle access layers, context overlays, and province views independently.

---

## Architecture Overview

```
React + Vite (frontend)
  ├── Mapbox GL JS        — vector tile rendering and layer management
  ├── Scrollama           — scroll-triggered map events
  ├── D3                  — custom stacked bar charts
  └── Turf.js             — client-side spatial analysis (buffer, point-in-polygon)

Data pipeline (external — not in this repo)
  └── Snowflake        — spatial preprocessing and access score computation
   └── Mapbox Tilesets CLI / API  — uploads processed data as vector tiles
  └── ArcGIS Pro         
     

Static GeoJSON (public/data/)
  — boundary and polygon files loaded directly by the frontend
```

**There is no backend.** All data is either static GeoJSON files served from `public/data/` or a Mapbox vector tileset (`astauf03.pharm_access_tileset`). The application makes no API calls at runtime beyond Mapbox tile requests.

---

## Setup

**Prerequisites:**

- [Node.js](https://nodejs.org) LTS
- A Mapbox account with an access token ([mapbox.com])(https://mapbox.com) - free tier is viable for deployment

**Steps:**

```bash
git clone <repo-url>
cd dair-pharmacy-app
npm install
```

Create a `.env` file in the project root: 

```bash
VITE_MAPBOX_TOKEN=pk.your_token_here
```

Then start the dev server:

```bash
npm run dev
```

**Deploy to GitHub Pages:**

```bash
npm run build
npm run deploy
```

This builds to `dist/` and pushes to the `gh-pages` branch via the `gh-packages` package. 

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_MAPBOX_TOKEN` | Yes | Public Mapbox access token. Must have permission to access the `astauf03.pharm_access_tileset` tileset. |

The token is set globally in `src/main.jsx` and referenced again in individual map components (`MapPage.jsx`, `N2.jsx`, `N4.jsx`, `N5Parallel.jsx`). All use `import.meta.env.VITE_MAPBOX_TOKEN`.

> **Note on token scope:** The Mapbox tileset (`astauf03.pharm_access_tileset`) is owned by the `astauf03` account. A public token from that account is needed to access it. If you fork this project, you will need to either upload the tileset to your own account or obtain a token scoped to the original account. The setup will be changing in the next couple of days.

---

## Folder Structure

```
dair-pharmacy-app/
├── public/
│   └── data/
│       ├── gauteng.geojson               # Gauteng EA-level polygons (with demographic fields)
│       ├── kzn.geojson                   # KZN EA-level polygons
│       ├── gauteng_boundary.geojson      # Province outline
│       ├── kzn_boundary.geojson
│       ├── south_africa.geojson          # National boundary
│       ├── gauteng-wards.geojson         # Ward boundaries (Gauteng)
│       ├── gauteng_polygons.geojson      # Sub-area polygons used in N4 township view
│       ├── kzn_polygons.geojson
│       ├── olievenhoutbosch.geojson      # Neighborhood boundary (Gauteng township)
│       ├── kwamashu.geojson              # Neighborhood boundary (KZN township)
│       ├── pharmacies.geojson            # Pharmacy point locations
│       ├── PHARMACIES_MASTER_FINAL.geojson  # Full national pharmacy dataset
│       └── recipe.json                   # Mapbox tileset recipe (see Tilesets Workflow)
├── src/
│   ├── App.jsx                           # React Router config (two routes: / and /map)
│   ├── main.jsx                          # Entry point; sets Mapbox token globally
│   ├── index.css                         # Design tokens (colors, type scale, spacing)
│   ├── constants/
│   │   ├── Layerexpressions.js           # All Mapbox GL paint/filter expressions
│   │   └── mapStyles.js                  # Color palettes, legend configs, chart constants
│   ├── pages/
│   │   ├── StoryPage.jsx                 # Scrollytelling page (composes all N* sections)
│   │   ├── MapPage.jsx                   # Interactive map dashboard
│   │   └── About.jsx
│   └── components/
│       ├── Hero.jsx / hero.css
│       ├── NavBar.jsx / navbar.css
│       ├── ContextBand.jsx / contextband.css   # Animated stat counters (hardcoded values)
│       ├── N2.jsx / n2.css               # Section: spatial orientation + province maps
│       ├── N3.jsx / n3.css               # Section: apartheid geography (no map)
│       ├── N4.jsx / n4.css               # Section: township deep dive (dual maps)
│       ├── N5Parallel.jsx / n5.css       # Section: province-level comparison
│       ├── StepCard.jsx / stepcard.css   # Reusable scroll step card
│       ├── MapSidebar.jsx / mapsidebar.css  # Interactive controls for MapPage
│       ├── Conclusion.jsx / conclusion.css
│       ├── CTABand.jsx / ctaband.css
│       ├── ZoomOut.jsx / zoomout.css
│       └── Footer.jsx / footer.css
├── .env                                  # Not committed — create locally (see Setup)
├── index.html
├── package.json
└── vite.config.js
```
## Data & Map Pipeline

Most spatial computation happens **outside this repository**, in Snowflake. The frontend consumes pre-processed outputs.

### What Snowflake produces

The Snowflake pipeline (maintained by MUSA team, transfer to DAIR team in the works) computes per-small-area-layer (SAL) access metrics including:

| Field (truncated) | Full name | Description |
|---|---|---|
| `walk_typol` | `walk_typology` | 6-category access typology (Pharmacy desert → Well-served) |
| `walk_dist_` | `walk_dist_k1_km` | Distance to nearest pharmacy on foot (km) |
| `drive_typo` | `drive_typology` | Drive-mode access typology |
| `exceeds_wa` | `exceeds_walk_k1_3km` | Binary: walk distance to nearest exceeds 3km |
| `walk_sna_1` | `walk_snap_flag` | Snap flag: nearest pharmacy matched >500m from road network |
| `ea_type` | `ea_type` | Settlement typology (Township, Informal, Formal Suburb, etc.) |
| `Black_Afri` | `Black_African` | Percent Black African population |
| `econ_statu` | `econ_status` | Economic classification |
| `pop_densit` | `pop_density` | Population density |

> **Field name truncation:** Mapbox vector tile properties are limited to 10 characters. The truncated names above are what actually appear in the tileset and are used throughout `Layerexpressions.js`. If the Snowflake pipeline renames any source fields, the truncated names in the tileset may differ and expressions will silently fall through to fallback values.

### From Snowflake to the frontend

1. Snowflake outputs processed SAL-level data (format managed by the DAIR data team — likely GeoJSON or CSV with geometry)
2. The Mapbox Tilesets CLI converts this to a vector tileset and uploads it to the `astauf03` Mapbox account
3. The tileset is referenced in the frontend as `mapbox://astauf03.pharm_access_tileset`

Static GeoJSON files (boundaries, ward polygons, pharmacy points) are loaded directly by the frontend from `public/data/` and added as Mapbox sources at map initialization.

---

## Tilesets Workflow

The main choropleth data lives in a Mapbox vector tileset, not a static file. To update it after a new Snowflake export:

### Prerequisites

```bash
pip install mapbox-tilesets
```

You will need a Mapbox **secret token** (starts with `sk.`) with `tilesets:write` scope for the `astauf03` account.

### Upload workflow

The username will change if you have your own mapbox account. You will need to create one, download the final dataset from the [group repo](https://github.com/tess-vu/south-africa-pharmacies), and upload the tiles to your own account. A similiar process like below will occur: 

```bash
# 1. Upload source data (newline-delimited GeoJSON recommended)
tilesets upload-source astauf03 dair-sal ./processed_sal_data.geojson

# 2. Update the tileset recipe (if changed)
tilesets update-recipe astauf03.pharm_access_tileset public/data/recipe.json

# 3. Publish (triggers tile processing)
tilesets publish astauf03.pharm_access_tileset

# 4. Check processing status (takes a few minutes)
tilesets status astauf03.pharm_access_tileset
```

If creating the tileset for the first time on a new account:

```bash
tilesets create astauf03.pharm_access_tileset \
  --recipe public/data/recipe.json \
  --name "Pharmacy Access"
```

Once published, the frontend picks up new data automatically on next load — no code changes needed unless field names changed.

---
 
## How Story Sections Interact with Map Layers

Each scrollable story section (`N2`, `N4`, `N5Parallel`) initializes its own Mapbox map instance and uses **Scrollama** to react to scroll position.

### General pattern

```jsx
// Inside a story section component (simplified)
const scroller = scrollama()
scroller
  .setup({ step: '.section .step-card', offset: 0.8, progress: true })
  .onStepEnter(({ index }) => {
    map.current.flyTo({ center, zoom, duration: 3500 })
    // Show or hide layers based on which step is active
    map.current.setLayoutProperty('layer-name', 'visibility', 'visible')
  })
  .onStepProgress(({ index, progress }) => {
    // Trigger chart or overlay at a scroll threshold
    if (progress > 0.75) setShowChart(true)
  })
```

The map container is sticky (`position: sticky`) while step cards scroll past it. Scrollama fires `onStepEnter` when a `.step-card` element crosses the configured offset (80% down the viewport).

### Section summary

| Component | What it shows | Map behavior | Visualization |
|---|---|---|---|
| `N2` | Spatial context: EA types and population density by province | Flies between Gauteng and KZN; toggles EA-type and population layers | D3 stacked bar: racial composition by settlement type |
| `N3` | Apartheid geography context | No map — CSS fade-in triggered by IntersectionObserver | None |
| `N4` | Township deep dive | Side-by-side Olievenhoutbosch (Gauteng) and KwaMashu (KZN) maps; layers toggle per step | D3 stacked bar: comparison between townships |
| `N5Parallel` | Province-level access comparison | Parallel maps with ward boundaries and pharmacy dots | Visual comparison only |

### StepCard

`StepCard.jsx` is the reusable scroll target element. Scrollama watches `.step-card` elements and fires events as they cross the scroll offset threshold. Each section creates an array of step configs (with `fly` coordinates and which layers to toggle) and maps them to `<StepCard>` instances.

---

## Map Layer Reference

All layers are defined and added in `src/pages/MapPage.jsx`. Paint and filter expressions live in `src/constants/Layerexpressions.js`. Colors and legend metadata are in `src/constants/mapStyles.js`.

### Layer stack (bottom to top)

| Layer ID | Type | Data source | Purpose |
|---|---|---|---|
| `sa` | fill | vector tileset | Neutral base fill for all SAL polygons |
| `walk-typology` | fill | vector tileset | 6-category access typology choropleth |
| `walk-dist-k1` | fill | vector tileset | Continuous ramp: distance to nearest pharmacy |
| `walk-dist-k3` | fill | vector tileset | Continuous ramp: distance to 3rd nearest (fragility indicator) |
| `drive-typology` | fill | vector tileset | Drive-mode access typology |
| `ea-type` | fill | vector tileset | Settlement type overlay |
| `pct-black-african` | fill | vector tileset | Racial composition ramp |
| `econ-status` | fill | vector tileset | Economic classification overlay |
| `pop-density` | fill | vector tileset | Population density ramp |
| `exceeds-walk-3km` | fill | vector tileset | Binary: >3km walk to nearest pharmacy |
| `transport-gap` | fill | vector tileset | Bivariate: walk desert + drive served |
| `walk-snap-flag` | fill | vector tileset | Orange wash for uncertain pharmacy snaps (>500m) |
| `sal-outline` | line | vector tileset | SAL polygon outlines |
| `pharmacy-dots` | circle | GeoJSON | Pharmacy point locations (clickable) |

### Layer groups and toggle behavior

**Access layers** — radio group, one visible at a time:
`walk-typology`, `walk-dist-k1`, `walk-dist-k3`, `drive-typology`

**Overlays** — stack freely on top of whichever access layer is active:
`pharmacy-dots`, `exceeds-walk-3km`, `transport-gap`, `walk-snap-flag`

**Context layers** — toggle individually:
`ea-type`, `pct-black-african`, `econ-status`, `pop-density`

`MapSidebar.jsx` manages toggle state and calls `map.setLayoutProperty(layerId, 'visibility', value)`.

---

## Adding New Map Layers or Story Chapters

### Adding a new map layer

1. **Define a paint expression** in `src/constants/Layerexpressions.js`:
   ```js
   export const MY_NEW_LAYER_COLOR = [
     'match', ['get', 'truncated_field'],
     'Value A', '#hexcolor',
     'Value B', '#hexcolor',
     '#fallback'
   ]
   ```

2. **Add the layer** in `MapPage.jsx` inside the `map.current.on('load', ...)` callback, before the `pharmacy-dots` layer so it renders below points:
   ```js
   map.current.addLayer({
     id: 'my-new-layer',
     type: 'fill',
     source: 'SA-access',
     'source-layer': 'dair_sal',
     layout: { visibility: 'none' },
     paint: { 'fill-color': MY_NEW_LAYER_COLOR, 'fill-opacity': 0.8 }
   })
   ```

3. **Add a toggle** in `MapSidebar.jsx`. If it's an access layer, add its ID to the radio group array. If it's an overlay or context layer, add it to the appropriate list.

4. **Add a legend entry** in `src/constants/mapStyles.js` and wire it to the active-layer state in `MapSidebar.jsx`.

> If the field comes from a new Snowflake column, confirm the truncated property name by inspecting a feature in Mapbox Studio or logging `e.features[0].properties` in a `click` handler. Then republish the tileset (see [Tilesets Workflow](#tilesets-workflow)).

### Adding a new story chapter

1. **Create the component** `src/components/N6.jsx` (and `n6.css`). Model on `N2.jsx` for scroll-triggered behavior or `N3.jsx` for a static section.

2. **Initialize a Mapbox map** inside a `useEffect` with `mapboxgl.Map({ container, style, center, zoom })`. Use `useRef` to hold the map instance so it persists across renders.

3. **Set up Scrollama** to watch `.step-card` elements inside your section and call `map.flyTo` and `setLayoutProperty` in the handlers.

4. **Register steps** as an array of config objects (center, zoom, which layers to show/hide) and map each to a `<StepCard>`.

5. **Add to `StoryPage.jsx`**:
   ```jsx
   import N6 from '../components/N6'
   // Insert at the appropriate position in the render tree
   <N6 />
   ```

6. **Add a nav anchor** in `NavBar.jsx` if the section needs direct linking.

---

## Known Technical Debt & Limitations

- **Hardcoded statistics:** The `ContextBand.jsx` headline numbers (80%, 72.1%, 2,241 pharmacies) are hardcoded. They will go stale if the underlying dataset changes and must be updated manually.

- **Multiple map instances:** Each story section and the Map page each instantiate a separate `mapboxgl.Map`. This is intentional for scroll isolation but is memory-intensive. The story page may become sluggish on low-end devices.

- **Recharts installed but unused:** `recharts` is listed in `package.json` but is not imported anywhere. All charts are custom D3. It can be removed.

- **No data pipeline in this repo:** The Snowflake SQL and tileset upload scripts live outside this repository. Any schema changes require coordinating with the DAIR data team and updating `Layerexpressions.js` to match new truncated field names.

- **Field name truncation is fragile:** Mapbox's 10-character property name limit means expressions in `Layerexpressions.js` use truncated names (e.g., `walk_typol` instead of `walk_typology`). If the pipeline rebuilds the tileset with different truncation, expressions will silently return fallback values with no console error.

- **Province scope:** The application covers only Gauteng and KwaZulu-Natal. The national boundary GeoJSON exists but the access tileset does not include other provinces. Expanding requires new Snowflake processing and a tileset republish.

- **No error boundaries on map components:** If `VITE_MAPBOX_TOKEN` is missing or invalid, map containers fail silently. There is no user-facing error message.

---

## Troubleshooting

**Map is blank or shows no choropleth data**

- Confirm `VITE_MAPBOX_TOKEN` is set in `.env` and the dev server was restarted after adding it.
- Open the browser console. A 401 from Mapbox means the token is missing or invalid.
- The tileset `astauf03.pharm_access_tileset` requires a token from the `astauf03` account. A personal token will not load it unless the tileset is public or your account has been granted access.

**Story map doesn't respond to scroll**

- Scrollama requires the page to actually be scrollable. If viewport height equals content height, scroll events won't fire.
- Check that `.step-card` elements exist in the DOM and that the Scrollama `step` selector in `setup()` matches the actual class name.
- If step positions seem wrong after a layout change, call `scroller.resize()` to recalculate offsets.

**All polygons show the same fallback color**

- The layer expression is referencing a property that doesn't exist in the tileset. Inspect actual property names by adding a temporary `map.on('click', layerId, e => console.log(e.features[0].properties))` handler and clicking a polygon.
- Cross-reference against the field name table in [Data & Map Pipeline](#data--map-pipeline) — the tileset uses truncated names.

**`npm run deploy` fails**

- Run `npm run build` first and confirm it succeeds.
- Ensure the repository has GitHub Pages enabled and the `gh-pages` branch exists (it is created automatically on first deploy).

**D3 chart doesn't render**

- The chart `useEffect` depends on a `ref` being attached to a DOM element. Add a guard: `if (!svgRef.current) return`.
- Chart data is derived from GeoJSON loaded via `fetch`. A 404 on the GeoJSON file produces empty data with no visible error — check the Network tab for failed requests.

**Tileset not updating after republish**

- Mapbox tiles are aggressively cached. Hard-reload with `Ctrl+Shift+R` or clear browser cache.
- Confirm the tileset status is `complete` before testing: `tilesets status astauf03.pharm_access_tileset`.

---

## Acknowledgements

AI-assisted development tools, including Anthropic's Claude, were used extensively during this project's implementation process, particularly for frontend engineering, debugging, refactoring, and workflow acceleration. The project's conceptual framing, mapping logic, data interpretation, and design goals were developed and guided by the author.

---

## References & Documentation

The following resources were particularly useful during development and may help future contributors:

- Mapbox GL JS Documentation — map rendering, layers, and interactions
- Mapbox Style Specification — paint/layout properties and expressions
- D3.js Documentation — chart rendering and scales
- Scrollama Documentation — scroll-driven storytelling interactions
- Mapbox Tilesets CLI Documentation — tileset uploads and recipes

