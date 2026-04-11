import { Link } from 'react-router-dom'
import './navbar.css'

function NavBar() {
  return (
    <nav className="navbar">
      <span className="navbar__brand">Geography of Healthcare Access</span>
      <div className="navbar__links">
        <a href="#n1" className="navbar__link">About</a>
        <a 
          href="YOUR_MARKDOWN_URL_HERE" 
          target="_blank" 
          rel="noreferrer" 
          className="navbar__link"
        >
          Markdown
        </a>
        <Link to="/map" className="navbar__cta">Map ↗</Link>
      </div>
    </nav>
  )
}

export default NavBar