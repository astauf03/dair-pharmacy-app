import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import "./n4.css"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function N4() {
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

    map.current.on("load", () => {   // This is gonna have chlropleth layers for population, and then the pointdata for pharmacies wil be revealed as we scroll
      // load Gauteng
      map.current.addSource("gauteng", {
        type: "geojson",
        data: "/data/gauteng.geojson"
      })
      map.current.addLayer({
        id: "gauteng-fill",
        type: "fill",
        source: "gauteng",
        paint: {
          "fill-color": "#002395",
          "fill-opacity": 0,           // hidden at first, Scrollama will reveal
        }
      })
      map.current.addLayer({
        id: "gauteng-outline",
        type: "line",
        source: "gauteng",
        paint: {
          "line-color": "#002395",
          "line-width": 1.5,
          "line-opacity": 0            // hidden at first
        }
      })

      // load KZN
      map.current.addSource("kzn", {
        type: "geojson",
        data: "/data/KZN.geojson"
      })
      map.current.addLayer({
        id: "kzn-fill",
        type: "fill",
        source: "kzn",
        paint: {
          "fill-color": "#97c93b",
          "fill-opacity": 0            // hidden at first
        }
      })
      map.current.addLayer({
        id: "kzn-outline",
        type: "line",
        source: "kzn",
        paint: {
          "line-color": "#97c93b",
          "line-width": 1.5,
          "line-opacity": 0            // hidden at first
        }
      })
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])


    return (
    <section className="n4">

      <div className="n4__intro">
        <span className="n4__eyebrow">Measuring Access </span>
        <h2 className="n4__title">Population Density + Pharm</h2>
        <p className="n4__body">
          This is a population density map at the most specific level available.
          This are bare bones median household income data. So, where are the pharmacies? 
        </p>
      </div>

      {/* Single map — Scrollama will control flyTo and layer visibility */}
      <div className="n4__map" ref={mapContainer} />

      <div className="n4__purpose">
        <h2 className="n4__title">Pharmacy statistic (use text highlighting here)</h2>
        <p className="n4__body">
          Pharmacy stats! Identified 4,000 + pharmacies, X in Gauteng, Y in KZN. 
            Where are they located? How does that relate to population density?
        
        </p>
      </div>

    </section>
  )
}

export default N4