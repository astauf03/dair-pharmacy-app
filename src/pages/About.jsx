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
            We are a team of urban spatial analysts who collaborated on this project with DAIR as a part of the Urban Spatial Analytics program practicum project at the University of Pennsylvania.
          </p>
          <p className="n1__body">
            Each coming from different backgrounds and skill sets, we collaborated with DAIR to contribute to their spatial apartheid research on spatial change in South Africa.
          </p>
        </div>

        {/* Team section */}
        <div className="about-team">
          <span className="n1__eyebrow" style={{ textAlign: "center", display: "block" }}>
            Meet the team
          </span>
          <h2 className="n1__title" style={{ textAlign: "center", margin: "0 auto var(--space-xl)" }}>
            Our Team
          </h2>

          <div className="about-team__grid">
            {teamMembers.map((member) => (
              <div className="about-card" key={member.email}>
                <div className="about-card__img-wrap">
                  <img src={member.img} alt={member.alt} className="about-card__img" />
                </div>
                <div className="about-card__body">
                  <h3 className="about-card__name">{member.name}</h3>
                  <p className="about-card__title">{member.title}</p>
                  <p className="about-card__bio">{member.bio}</p>
                  <p className="about-card__email">{member.email}</p>
                  <button className="about-card__btn">Contact</button>
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