import './footer.css'
import musaLogo from '../assets/musa-logo.svg'

function Footer() {
  return (
    <footer className="footer">
      <img src={musaLogo} alt="MUSA Logo" className="footer__logo" />
      <p className="footer__text">
        Tess Vu | Joey Cahill | Jill Kalman | Alex Stauffer | MUSA Practicum 2026 (we can add portfolio links or something)
      </p>
      <p className="footer__text">
        In partnership with{' '}
        <a href="https://www.dair-institute.org" target="_blank" rel="noreferrer" className="footer__link">
          DAIR Institute
        </a>
        {' '}· University of Pennsylvania{' '}
        <a href="https://www.design.upenn.edu/urban-spatial-analytics" target="_blank" rel="noreferrer" className="footer__link">
          Weitzman School of Design
        </a>
      </p>
    </footer>
  )
}

export default Footer