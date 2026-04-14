import { Link, useLocation } from "react-router-dom"
import "./navbar.css"

function NavBar() {
  const location = useLocation()
  const isMapPage = location.pathname === "/map"

  return (
    <nav className="navbar">
      <span className="navbar__brand">Geography of Healthcare Access</span>
      <div className="navbar__links">
        <a href="#n1" className="navbar__link">About</a>
        <a href="YOUR_MARKDOWN_URL" target="_blank" rel="noreferrer" className="navbar__link">Markdown</a>
        {isMapPage 
          ? <Link to="/" className="navbar__cta">Story</Link>
          : <Link to="/map" className="navbar__cta">Map</Link>
        }
      </div>
    </nav>
  )
}

export default NavBar