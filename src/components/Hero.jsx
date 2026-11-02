import { Link } from "react-router-dom"
import "./hero.css"


function Hero() {
  return (
    <section className="hero">
      <div className="hero__overlay" />
      <span className="hero__eyebrow">MUSA + DAIR</span>
      <h1 className="hero__title">Geography of Pharmacy Access in South Africa</h1>
      <p className="hero__subtitle">
        Mapping pharmacy access and spatial disparity across Gauteng and KwaZulu-Natal.
      </p>
      <div>
        <Link to="/map" className="hero__cta-primary">Explore the Map</Link>
        <a href="#N1" className="hero__cta-secondary">Read the Story</a>
      </div>
    </section>
  )
}

export default Hero