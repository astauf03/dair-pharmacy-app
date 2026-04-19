import { Link } from 'react-router-dom'
import './ctaband.css'

function CTABand() {
  return (
    <section className="cta-section">
      <div className="cta-card">
        <h2 className="cta-card__title">Now explore the data yourself.</h2>
        <Link to="/map" className="cta-card__button">Explore the Map →</Link>
      </div>
    </section>
  )
}

export default CTABand