import "../components/about.css";
import "../components/navbar.css";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import teamMembers from "../constants/teammembers";
import "../index.css"

function About() {
  return (
    <>
      <NavBar />
      <div className="n1">

        {/* Intro block */}
        <div className="n1__intro">
          <span className="n1__eyebrow" style={{ color: "#E34234" }}>Who we are</span>
          <h1 className="n1__title">About Us</h1>
          <p className="n1__body">  
            We are a team of spatial analysts who collaborated on this project with the Distributed AI Research Institute (DAIR) as a part of the Urban Spatial Analytics program practicum project at the University of Pennsylvania.
          </p>
          <p className="n1__body">
            Each coming from different backgrounds and skill sets, we collaborated with DAIR to contribute to their spatial apartheid research on spatial change in South Africa.
          </p>
        </div>

        {/* Team section */}
        <div className="about-team">
          <h2 className="n1__title" style={{ textAlign: "center", margin: "0 auto var(--space-xl)" }}>
            The Team
          </h2>

          <div className="about-team__grid">
            {teamMembers.map((member) => (
              <div className="about-card" key={member.email}>
                <div className="about-card__body">
                  <div className="about-card__header">
                    <div className="about-card__img-wrap">
                      <img src={member.img} alt={member.alt} className="about-card__img" />
                    </div>
                    <div className="about-card__identity">
                      <h3 className="about-card__name">{member.name}</h3>
                      <p className="about-card__title">{member.title}</p>
                    </div>
                  </div>
                  <div className="about-card__bios">
                    {['bio', 'bio2', 'bio3'].flatMap(field => {
                      const paragraphs = member[field]
                      if (!paragraphs) return []
                      return (Array.isArray(paragraphs) ? paragraphs : [paragraphs])
                        .map((paragraph, index) => (
                          <p className="about-card__bio" key={`${field}-${index}`}>
                            {paragraph}
                          </p>
                        ))
                    })}
                  </div>
                  <div className="about-card__links">
                    {member.email && (
                      <a className="about-card__btn" href={`mailto:${member.email}`}>Email</a>
                    )}
                    {member.LinkedIn && (
                      <a
                        className="about-card__btn"
                        href={member.LinkedIn}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        LinkedIn
                      </a>
                    )}
                    {member.GitHub && (
                      <a
                        className="about-card__btn"
                        href={member.GitHub}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        GitHub
                      </a>
                    )}
                    {member.portfolio && (
                      <a
                        className="about-card__btn"
                        href={member.portfolio}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}

export default About;