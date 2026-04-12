# DAIR Pharmacy Access — Frontend

React + Mapbox web application for the MUSA Practicum 2026 pharmacy access project.
Built in collaboration with the DAIR Institute.

## Stack
- React (Vite)
- Mapbox GL JS
- Scrollama
- Turf.js
- GitHub Pages

## Prerequisites
[Node.js](https://nodejs.org) (LTS version) — required before anything else
A Mapbox account + access token — get one free at [mapbox.com](https://mapbox.com)

## Setup

1. Clone the repo
2. Run `npm install`
3. Create a `.env` file in the root with your Mapbox token: `VITE_MAPBOX_TOKEN=your_token_here`
4. Run `npm run dev`

## Repo Structure
public/
  data/
    gauteng.geojson       # Gauteng province boundary
    KZN.geojson           # KwaZulu-Natal province boundary
src/
  components/
    NavBar.jsx/css        # Sticky nav, conditional Map/Story button
    Hero.jsx/css          # Full-bleed landing section
    ContextBand.jsx/css   # NHI Act 2024 context
    N1.jsx/css            # Positionality + DAIR partnership
    N2.jsx/css            # Spatial orientation + province map
    N3.jsx/css            # Apartheid geography
    N4.jsx/css            # Pharmacy data intro
    N5.jsx/css            # Access + disparity findings
    CTABand.jsx/css       # Green CTA card → map page
    Footer.jsx/css        # Team + DAIR attribution
    MapSidebar.jsx        # Map page sidebar (in progress)
  pages/
    StoryPage.jsx         # Scrollytelling narrative page
    MapPage.jsx           # Interactive Mapbox dashboard
  index.css               # All design tokens (colors, type, spacing)
  App.jsx                 # Router config
  main.jsx                # Entry point



## To-Do

### In Progress
- [ ] Scrollama wiring — scroll-triggered map flyTo + layer visibility
- [ ] Step card components for N2–N5 scroll sections
- [ ] MapSidebar content — province toggles, stat cards, legend scaffold construction
- [ ] Data geojson identification and collection

### Up Next
- [ ] Ward-level choropleth fill layer (blue→gold ramp)
- [ ] Province outline layers on map page
- [ ] Pharmacy dot layer — pending pharmacies.geojson
- [ ] Ward click interaction → sidebar stat update
- [ ] Drop-pin buffer tool (Turf.js circle + points-within-polygon)

### Pending Data (from Tess/Snowflake pipeline)
- [ ] pharmacies.geojson — point data
- [ ] Access scores per ward for choropleth
- [ ] *MORE THAT I NEED TO WRITE A DOCUMENT FOR*


### Before Final Deploy
- [ ] Real copy for all narrative sections
- [ ] GitHub Pages deployment config
- [ ] Mapbox token handling for production
- [ ] Remove all console.log debug statements
- [ ] Real data!!!!!
