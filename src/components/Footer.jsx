import "./footer.css"
import teamMembers from "../constants/teammembers"

function Footer() {
  return (
    <footer className="footer">
      <p className="footer__text footer__members">
        {teamMembers.map((member, index) => (
          <span className="footer__member" key={member.name}>
            {member.portfolio
              ? <a href={member.portfolio} target="_blank" rel="noreferrer" className="footer__link">{member.name}</a>
              : member.name}
            {index < teamMembers.length - 1 && <span aria-hidden="true"> | </span>}
          </span>
        ))}
        <span className="footer__program">MUSA Practicum 2026</span>
      </p>
      <p className="footer__text">
        In partnership with{" "}
        <a href="https://www.dair-institute.org" target="_blank" rel="noreferrer" className="footer__link">
          DAIR Institute
        </a>
        {" "}· University of Pennsylvania{" "}
        <a href="https://www.design.upenn.edu/urban-spatial-analytics" target="_blank" rel="noreferrer" className="footer__link">
          Weitzman School of Design
        </a>
      </p>
    </footer>
  )
}

export default Footer