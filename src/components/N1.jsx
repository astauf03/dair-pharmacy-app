import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import "./n1.css"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN


function N1() {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
 
  if (map.current) return
  if (!mapContainer.current) return

  map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: "mapbox://styles/mapbox/satellite-v9",
    center: [28.0, -29.0],
    zoom: 3.8,
    interactive: false,
  })

  map.current.on("load", () => {
    console.log("map loaded successfully")
  })

  map.current.on("error", (e) => {
    console.log("map error:", e)
  })

  return () => {
    if (map.current) {
      map.current.remove()
      map.current = null
    }
  }
}, [])

  return (
    <section className="n1">

      {/* N1-text: who we are */}
      <div className="n1__intro">
        <span className="n1__eyebrow">Positionality</span>
        <h2 className="n1__title">Who We Are</h2>
        <p className="n1__body">
          We are a team of urban spatial analysts based at the University of 
          Pennsylvania"s Weitzman School of Design. We are not South African. 
          We have not visited the communities we are mapping. We want to be 
          transparent about that.
        </p>
        <p className="n1__body">
          This project was commissioned by the{" "}
          <a 
            href="https://www.dair-institute.org" 
            target="_blank" 
            rel="noreferrer"
            className="n1__link"
          >
            Distributed AI Research Institute (DAIR)
          </a>
          {" "}— a research organization founded to center the voices of 
          communities most affected by AI and data systems. Their guidance 
          shapes how we approach this work.
        </p>
      </div>

      {/* N1-bleed: Mapbox map */}
      <div className="n1__map" ref={mapContainer} />

      {/* N1-text-2: why South Africa */}
      <div className="n1__purpose">
        <span className="n1__eyebrow">Why South Africa</span>
        <h2 className="n1__title">A Question of Access</h2>
        <p className="n1__body">
          The passage of the National Health Insurance Act in 2024 created a 
          new imperative: if public funding can now reach private pharmacies, 
          who actually lives close enough to benefit? The answer is not evenly 
          distributed — and its unevenness traces directly back to apartheid-era 
          spatial planning.
        </p>
      </div>

    </section>
  )
}

export default N1