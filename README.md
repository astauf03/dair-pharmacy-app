# MUSA/DAIR Pharmacy Access Map

A spatial storytelling application visualizing pharmacy access and healthcare geography across South Africa, focused on Gauteng and KwaZulu-Natal. Built for the [MUSA Practicum 2026](https://pennmusa.github.io/MUSA_801.io/) in collaboration with the [DAIR Institute](https://www.dair-institute.org/).

Live site: https://astauf03.github.io/dair-pharmacy-app/

---

## Table of Contents

1. [Project Purpose](#project-purpose)
2. [Architecture Overview](#architecture-overview)
3. [Setup](#setup)
4. [Environment Variables](#environment-variables)
5. [Data & Map Pipeline](#data--map-pipeline)
6. [Tilesets Workflow](#tilesets-workflow)
7. [How Story Sections Interact with Map Layers](#how-story-sections-interact-with-map-layers)
8. [Map Layer Reference](#map-layer-reference)
9. [Folder Structure](#folder-structure)
10. [Adding New Map Layers or Story Chapters](#adding-new-map-layers-or-story-chapters)
11. [Known Technical Debt & Limitations](#known-technical-debt--limitations)
12. [Troubleshooting](#troubleshooting)
13. [Acknowledgements](#acknowledgements)
14. [References & Documentation](#references--documentation)

---

## Project Purpose

This application examines disparities in pharmacy access shaped by South Africa's apartheid-era spatial geography. It combines a scroll-driven narrative (Story page) with an interactive map dashboard (Map page) to communicate access gaps across different Settlement Types — townships, informal settlements, and suburbs — in Gauteng and KwaZulu-Natal.

The unit of analysis is the **SAL** (Small Area Layer), a Stats SA polygon. Shared vocabulary (SAL, Settlement Type, Population Group, Access Typology) is defined in `GLOSSARY.md`.

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

Data pipeline
  └── ArcGIS Pro + Stats SA Census → eight Python notebooks
      (tess-vu/south-africa-pharmacies) → sal_combined_access
  └── Pharmacy data (insurance PDFs, Google Places API)
      → Snowflake (ingestion and cleaning; verify with team)

This repo
  └── scripts/derive_data.py → every public/data/ file the site loads
```

**There is no backend.** All data is either static GeoJSON files served from `public/data/` or a Mapbox vector tileset named by the `VITE_MAPBOX_TILESET` environment variable. The application makes no API calls at runtime beyond Mapbox tile requests.

---

## Setup

**Prerequisites:**

- [Node.js](https://nodejs.org) LTS
- A Mapbox account with an access token ([mapbox.com](https://mapbox.com)) — the free tier is fine for local development
- Python with the packages in `scripts/requirements.txt` — only needed to derive data, not to run the site. The maintainer runs it in the conda environment `za`.

**Steps:**

```bash
git clone <repo-url>
cd dair-pharmacy-app
npm install
```

Create a `.env` file in the project root:

```bash
VITE_MAPBOX_TOKEN=pk.your_token_here
VITE_MAPBOX_TILESET=yourusername.pharm_access_v2
```

Then start the dev server:

```bash
npm run dev
```

**Deriving the data files:**

The canonical source, `public/data/sal_combined_access.geojson`, is gitignored. Obtain it from the group repo (`tess-vu/south-africa-pharmacies`) or the data team, then run:

```bash
conda run -n za python scripts/derive_data.py
```

Any Python environment with the packages from `scripts/requirements.txt` works. See [Data & Map Pipeline](#data--map-pipeline) for what the script writes and checks.

**Deploy to GitHub Pages:**

`.github/workflows/deploy.yml` runs on every push to `main`: install, test, build, and publish to GitHub Pages. The build reads `VITE_MAPBOX_TOKEN` from a repository secret and `VITE_MAPBOX_TILESET` from a repository variable (Settings → Secrets and variables → Actions). Make sure GitHub Pages is set to deploy from GitHub Actions (Settings → Pages).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_MAPBOX_TOKEN` | Yes | Public Mapbox access token (starts with `pk.`). Must belong to the account that owns the tileset. |
| `VITE_MAPBOX_TILESET` | Yes | Mapbox tileset ID, e.g. `<username>.pharm_access_v2`. Set in `.env` locally and as a repository **variable** for deploys. |

The token is set globally in `src/main.jsx`; the tileset ID is read by `src/pages/MapPage.jsx`.

> **Token note:** a public `pk.` token from the tileset owner's account is required to read the tileset. A secret `sk.` token (with `tilesets:write`) is used only in the shell for the tileset CLI during the [Tilesets Workflow](#tilesets-workflow) — never in a file.

---

## Data & Map Pipeline

The canonical dataset has one row per SAL in Gauteng and KwaZulu-Natal (38,380 SALs). Field definitions live in the [data dictionary](docs/data-dictionary.md); this README does not repeat the field table. The 10-character field names come from the shapefile export, not from Mapbox — the dictionary's `full_name` column gives each long name.

**Derive script.** `scripts/derive_data.py` is the single command that turns the canonical source into every data file the site loads:

```bash
conda run -n za python scripts/derive_data.py
```

- **Inputs:** `public/data/sal_combined_access.geojson` (canonical, gitignored), `public/data/pharmacies.geojson`, the committed township extracts (read for their `EA_CODE` sets), and the tile field allowlist `scripts/tile_fields.json`.
- **Outputs (overwritten every run):**
  - `public/data/gauteng.geojson` and `public/data/kzn.geojson` — one centroid point per SAL
  - `public/data/olievenhoutbosch.geojson` and `public/data/kwamashu.geojson` — township polygons with v2 attributes
  - `public/data/chart_n2_gauteng.json` and `public/data/chart_n2_kzn.json` — Settlement Type chart data
  - `public/data/sal_tiles.geojson.ld` — the tileset upload file (gitignored; only the fields the map page reads)
  - `public/data/recipe.v2.json` — tileset recipe with a `USERNAME` placeholder
  - a printed statistics report (`STAT <key> = <value>` lines) that backs the story copy and the written report
- **Headline self-checks:** the script refuses to continue unless the data reproduces the research notebook's headline numbers — 38,380 SALs (Gauteng 20,850, KwaZulu-Natal 17,530), 27.5M modeled residents, 10.20M (37%) in a walking Pharmacy Desert, and 4.63M (17%) in a driving Pharmacy Desert.

**Static files.** Boundary, polygon, and pharmacy GeoJSON files are loaded directly by the frontend from `public/data/`.

---

## Tilesets Workflow

The main choropleth data lives in a Mapbox vector tileset. **Each data version gets a new tileset** (e.g. `pharm_access_v2`) — the live tileset is never overwritten, so the deployed site keeps working until the new tileset and code are ready.

The derive script prints the exact commands at the end of every run (replace `<username>` and `<tileset>`):

```bash
$env:MAPBOX_ACCESS_TOKEN = "<your sk. token with tilesets:write>"   # shell only, never in a file
tilesets upload-source <username> dair-sal-v2 public/data/sal_tiles.geojson.ld
tilesets create <username>.<tileset> --recipe public/data/recipe.v2.json --name "Pharmacy Access v2"
tilesets publish <username>.<tileset>
tilesets status <username>.<tileset>
```

Install the CLI once with `pip install mapbox-tilesets`, and keep the secret token in the shell session only.

Recipes need a concrete username, so `public/data/recipe.v2.json` carries a literal `USERNAME` placeholder. Substitute it and write the gitignored `recipe.local.json`:

```bash
(Get-Content public/data/recipe.v2.json) -replace 'USERNAME','<username>' | Set-Content recipe.local.json
```

**Merge order:** publish the tileset, set the `VITE_MAPBOX_TILESET` repository variable, then merge the code. Once published, the map page picks up the new data on next load — no code changes needed unless field names changed.

---

## How Story Sections Interact with Map Layers

Each scrollable story section initializes its own Mapbox map instance and uses **Scrollama** to react to scroll position. `src/pages/StoryPage.jsx` is the authoritative list of sections; the components live in `src/components/`.

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

The map container is sticky (`position: sticky`) while step cards scroll past it. Scrollama fires `onStepEnter` when a `.step-card` element crosses the configured offset (80% down the viewport). `StepCard.jsx` is the reusable scroll target element; each section maps an array of step configs (fly coordinates, layers to toggle) to `<StepCard>` instances.

---

## Map Layer Reference

Layer IDs, their stacking order, and their paint expressions live in the code, not here: `src/pages/MapPage.jsx` (layer IDs and source setup) and `src/constants/` (`layerExpressions.js` for paint and filter expressions, `legendData.js` and `mapStyles.js` for colors and legends, `dataContract.js` for field names and labels). Read the code — it is the single source of truth and cannot drift.

The vector tileset's source layer is `dair_sal`; `src/components/MapSidebar.jsx` manages the toggles and calls `map.setLayoutProperty(layerId, 'visibility', value)`.

---

## Folder Structure

See the repository tree. Site code is in `src/`, derived data in `public/data/`, scripts in `scripts/`, docs in `docs/`.

---

## Adding New Map Layers or Story Chapters

### Adding a new map layer

1. **Add field names and labels to `src/constants/dataContract.js` first.** If the map page reads the field from tiles, add it to `scripts/tile_fields.json` too and re-run the derive script.

2. **Define a paint expression** in `src/constants/layerExpressions.js`:
   ```js
   export const MY_NEW_LAYER_COLOR = [
     'match', ['get', 'field_name'],
     'Value A', '#hexcolor',
     'Value B', '#hexcolor',
     '#fallback'
   ]
   ```

3. **Add the layer** in `src/pages/MapPage.jsx` inside the `map.current.on('load', ...)` callback, before the `pharmacy-dots` layer so it renders below points:
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

4. **Add a toggle** in `src/components/MapSidebar.jsx`. If it's an access layer, add its ID to the radio group array. If it's an overlay or context layer, add it to the appropriate list.

5. **Add a legend entry** in `src/constants/legendData.js` and wire it to the active-layer state in `src/components/MapSidebar.jsx`.

> If the field comes from a new pipeline column, confirm the 10-character name in the [data dictionary](docs/data-dictionary.md), add it to the tile allowlist, and publish a new tileset (see [Tilesets Workflow](#tilesets-workflow)).

### Adding a new story chapter

1. **Create the component** `src/components/N6.jsx` (and `n6.css`). Model it on `src/components/N2.jsx` (or `src/components/N4.jsx` for a section with maps).

2. **Initialize a Mapbox map** inside a `useEffect` with `mapboxgl.Map({ container, style, center, zoom })`. Use `useRef` to hold the map instance so it persists across renders.

3. **Set up Scrollama** to watch `.step-card` elements inside your section and call `map.flyTo` and `setLayoutProperty` in the handlers.

4. **Register steps** as an array of config objects (center, zoom, which layers to show/hide) and map each to a `<StepCard>`.

5. **Add it to `src/pages/StoryPage.jsx`**:
   ```jsx
   import N6 from '../components/N6'
   // Insert at the appropriate position in the render tree
   <N6 />
   ```

6. **Add a nav anchor** in `src/components/NavBar.jsx` if the section needs direct linking.

---

## Known Technical Debt & Limitations

- **Hand-written story statistics:** story copy numbers are hand-written. The derive script prints every statistic as `STAT` lines, but updating the prose is manual — re-run the script and copy the numbers after any data refresh.

- **Multiple map instances:** each story section and the Map page instantiate a separate `mapboxgl.Map`. This is intentional for scroll isolation but is memory-intensive. The story page may become sluggish on low-end devices.

- **Recharts installed but unused:** `recharts` is listed in `package.json` but is not imported anywhere. All charts are custom D3. It can be removed.

- **Upstream notebooks live outside this repo:** the eight processing notebooks are in the group repo `tess-vu/south-africa-pharmacies`. Any schema change requires coordinating with the DAIR data team and re-running the derive script to update the constants and extracts.

- **Shapefile field names are terse:** the 10-character property names come from the shapefile export. The derive script asserts that every field the site reads exists in the source, but if the pipeline renames a field, expressions can still silently fall through to fallback values with no console error.

- **Province scope:** the application covers only Gauteng and KwaZulu-Natal. Expanding requires new processing in the upstream notebooks and a new tileset.

- **No error boundaries on map components:** if `VITE_MAPBOX_TOKEN` is missing or invalid, map containers fail silently. If `VITE_MAPBOX_TILESET` is missing, the map page logs a console error and skips the SAL layers. There is no user-facing error message.

---

## Troubleshooting

**Map is blank or shows no choropleth data**

- Confirm `VITE_MAPBOX_TOKEN` and `VITE_MAPBOX_TILESET` are set in `.env` and the dev server was restarted after adding them.
- Open the browser console. A 401 from Mapbox means the token is missing or invalid.
- A `pk.` token from an account that does not own the tileset will not load it. Use a token from the tileset owner's account.

**Map page shows pharmacy dots but no SAL choropleth**

- `VITE_MAPBOX_TILESET` is not set. The console logs `VITE_MAPBOX_TILESET is not set; skipping the SAL vector tileset layers.`
- Set it in `.env` locally (restart the dev server), or as a repository variable for deploys (Settings → Secrets and variables → Actions → Variables).

**Story map doesn't respond to scroll**

- Scrollama requires the page to actually be scrollable. If viewport height equals content height, scroll events won't fire.
- Check that `.step-card` elements exist in the DOM and that the Scrollama `step` selector in `setup()` matches the actual class name.
- If step positions seem wrong after a layout change, call `scroller.resize()` to recalculate offsets.

**All polygons show the same fallback color**

- The layer expression is referencing a property that doesn't exist in the tileset. Inspect actual property names by adding a temporary `map.on('click', layerId, e => console.log(e.features[0].properties))` handler and clicking a polygon.
- Cross-reference against the [data dictionary](docs/data-dictionary.md) — the tileset uses the 10-character field names.

**Deploy fails**

- Check the workflow run in the Actions tab. The build step needs the `VITE_MAPBOX_TOKEN` secret and the `VITE_MAPBOX_TILESET` variable to be set in repository Settings.
- Run `npm test` and `npm run build` locally and confirm both succeed.
- Ensure GitHub Pages is set to deploy from GitHub Actions (Settings → Pages).

**D3 chart doesn't render**

- The chart `useEffect` depends on a `ref` being attached to a DOM element. Add a guard: `if (!svgRef.current) return`.
- Chart data is derived from GeoJSON loaded via `fetch`. A 404 on the GeoJSON file produces empty data with no visible error — check the Network tab for failed requests.

**Tileset not updating after publishing**

- Mapbox tiles are aggressively cached. Hard-reload with `Ctrl+Shift+R` or clear the browser cache.
- Confirm the tileset status is `complete` before testing: `tilesets status <username>.<tileset>`.

---

## Acknowledgements

AI-assisted development tools, including Anthropic's Claude, were used extensively during this project's implementation process, particularly for frontend engineering, debugging, refactoring, and workflow acceleration. The project's conceptual framing, mapping logic, data interpretation, and design goals were developed and guided by the author `astauf03`.

`tess-vu` used self-contained Qwen 3.8 Coder 27B LLM and also DeepSeek V4 to aid with debugging, existing doc clarification, and test creation. Primary usage was to consolidate multiple existing branches into a single branch.

---

## References & Documentation

The following resources were particularly useful during development and may help future contributors:

- Mapbox GL JS Documentation for map rendering, layers, and interactions
- Mapbox Style Specification for paint/layout properties and expressions
- D3.js Documentation for chart rendering and scales
- Scrollama Documentation for scroll-driven storytelling interactions
- Mapbox Tilesets CLI Documentation for tileset uploads and recipes
- [Data dictionary](docs/data-dictionary.md) for every field in the true canonical v2 dataset