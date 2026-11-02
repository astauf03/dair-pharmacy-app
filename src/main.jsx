import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import 'mapbox-gl/dist/mapbox-gl.css'
import App from "./App.jsx"
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
