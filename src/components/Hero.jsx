import { Link } from 'react-router-dom'
import './hero.css'

function Hero() {
  return (
    <section className="hero">
      <span className="hero__eyebrow">MUSA + DAIR</span>
      <h1 className="hero__title">Geography of Healthcare Access in South Africa</h1>
      <p className="hero__subtitle">
        Mapping pharmacy access and spatial disparity across Gauteng and KwaZulu-Natal.
      </p>
      <div>
        <Link to="/map" className="hero__cta-primary">Explore the Map</Link>
        <a href="#n1" className="hero__cta-secondary">Read the Story</a>
      </div>
    </section>
  )
}

export default Hero