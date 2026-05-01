
import "./about.css"


function About() {
    <section className="n1">

      {/* N1-text: who we are */}
      <div className="n1__intro">
        <span className="n1__eyebrow">Positionality</span>
        <h2 className="n1__title">Who We Are</h2>
        <p className="n1__body">
          We are a team of urban spatial analysts based at the University of 
          Pennsylvania"s Weitzman School of Design. We are not South African. 
          We have not visited the communities we are mapping. We want to be 
          transparent about that.
        </p>
        <p className="n1__body">
          This project was commissioned by the{" "}
          <a 
            href="https://www.dair-institute.org" 
            target="_blank" 
            rel="noreferrer"
            className="n1__link"
          >
            Distributed AI Research Institute (DAIR)
          </a>
          {" "}— a research organization founded to center the voices of 
          communities most affected by AI and data systems. Their guidance 
          shapes how we approach this work.
        </p>
      </div>


      {/* N1-text-2: why South Africa */}
      <div className="n1__purpose">
        <span className="n1__eyebrow">Why South Africa</span>
        <h2 className="n1__title">A Question of Access</h2>
        <p className="n1__body">
          The passage of the National Health Insurance Act in 2024 created a 
          new imperative: if public funding can now reach private pharmacies, 
          who actually lives close enough to benefit? The answer is not evenly 
          distributed — and its unevenness traces directly back to apartheid-era 
          spatial planning.
        </p>
      </div>

    </section>
  
}

export default About