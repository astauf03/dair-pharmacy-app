import { useEffect, useRef, useState } from "react"
import "./contextband.css"

function useCounter(target, duration, delay, hasEntered, decimals = 0) {
  const [display, setDisplay] = useState(decimals > 0 ? (0).toFixed(decimals) : "0")

  useEffect(() => {
    if (!hasEntered) return

    let frameId
    const startTime = performance.now() + delay

    const step = (now) => {
      if (now < startTime) {
        frameId = requestAnimationFrame(step)
        return
      }
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = eased * target
      setDisplay(decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString())
      if (progress < 1) frameId = requestAnimationFrame(step)
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [hasEntered, target, duration, delay, decimals])

  return display
}

function ContextBand() {
  const sectionRef = useRef(null)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEntered) setHasEntered(true)
      },
      { threshold: 0.4 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [hasEntered])

  const stat1 = useCounter(80, 1400, 0, hasEntered, 0)
  const stat2 = useCounter(72.1, 1800, 300, hasEntered, 1)

  return (
    <section className="context-band" ref={sectionRef}>
      <span className="context-band__eyebrow">Context</span>

      {/* ── TWO-STAT + HOOK PROSE ── */}
      <div className={`context-band__grid ${hasEntered ? "is-visible" : ""}`}>

        {/* LEFT: two stats only */}
        <div className="context-band__stats">

          <div className="context-band__stat context-band__stat--1">
            <p className="context-band__stat-lead-in">Public pharmacies serve about</p>
            <div className="context-band__number">
              {stat1}<span className="context-band__percent">%</span>
            </div>
            <p className="context-band__stat-label">
              of South Africans, but receive only half of national health funding
            </p>
          </div>

          <div className="context-band__stat-divider" />

          <div className="context-band__stat context-band__stat--2">
            <p className="context-band__stat-lead-in">Across Gauteng and KwaZulu-Natal,</p>
            <div className="context-band__number context-band__number--accent">
              {stat2}<span className="context-band__percent">%</span>
            </div>
            <p className="context-band__stat-label">
              placeholder
            </p>
          </div>

        </div>

        {/* RIGHT: hook prose */}
        <div className="context-band__prose">
          <p className="context-band__lead">
            80% of South Africans are served by public pharmacies. 16% are served by private
            pharmacies. Yet private facilities receive 50% of the funding allocated by the
            South African government for healthcare.
          </p>
          <p className="context-band__body">
            The{" "}
            <span className="highlight-gold">National Health Insurance Act of 2024</span>{" "}
            set out to close that gap, guaranteeing all South Africans coverage at both
            private and public pharmacies. Unfortunately, financial access is not the only
            barrier to pharmacy services for many South Africans. Physical access is just as
            much of a challenge. A practical question arises: Can people actually reach
            pharmacies?
          </p>
          <p className="context-band__body">
            This project maps that question across two provinces and finds that geography
            shaped by decades of oppression under{" "}
            <span className="highlight-gold">apartheid</span> forms the answer.
          </p>
        </div>

      </div>

      {/* ── FULL-WIDTH NARRATIVE ── */}
      <div className="context-band__narrative">
        <p className="context-band__narrative-eyebrow">South Africa — Site Context</p>

        <div className="context-band__narrative-body">
          <p>
            Public pharmacies in South Africa serve about 80% of the population but receive
            only about 50% of government funding. Until the{" "}
            <span className="highlight-gold">National Health Insurance (NHI) Act of 2024</span>,
            uninsured South Africans could be denied service. The Act created a public fund
            to subsidize care and medicines, with significant implications for people in
            townships and non-wealthy areas. Despite this increase in financial support, the
            medicinal supply of public pharmacies remains determined by the{" "}
            <span className="highlight-gold">National Essential Medicines List</span>, while
            private pharmacies are more likely to carry both generic and branded medicines.
            In the public sector, pharmacists work across a wider variety of health
            facilities, including hospitals, community health centers, medical stores, and
            district, provincial, and national offices.
          </p>
          <p>
            Yet accessibility metrics do not encapsulate the entire story. Residents are not
            basing their healthcare decisions strictly upon proximity and location, but also
            on a host of social and economic dynamics that have been{" "}
            <span className="highlight-gold">spatially produced over time</span>. These
            dynamics include biases, stigmas, and perceptions of service quality. This means
            that existing inequities may be reproduced by individual decision-making{" "}
            <span className="context-band__citation">(Winchester and King, 2018)</span>.
            Compounding this, there is no official spatial database for pharmacies in South
            Africa, creating critical data gaps that this project addresses through a
            combination of private and publicly sourced pharmacy lists then forward geocoding
            using the Google Places API.
          </p>
          <p>
            While the NHI Act expands financial access to pharmacies, it does not address the
            spatial inequalities that ultimately determine whether people can reach them.
            Building off the research of the{" "}
            <a
              href="https://dair-institute.org/projects/impacts-of-spatial-apartheid/"
              target="_blank"
              rel="noreferrer"
              className="highlight-gold"
            >
              Distributed AI Research Institute (DAIR)
            </a>,
            which develops datasets and analytical frameworks for studying persistent spatial
            inequalities in South African settlements{" "}
            <span className="context-band__citation">(Sefala et al., 2021)</span>, this
            study investigates three questions:
          </p>
        </div>
      </div>
      {/* ── FULL-WIDTH: Research questions ── */}
      <div className="context-band__questions">
        <p className="context-band__questions-lead">What we set out to understand</p>
        <div className="context-band__questions-list">
          <div className="context-band__question-item">
            <span className="context-band__question-num">01</span>
            <p className="context-band__question-text">
              What is the spatial distribution of pharmacies in Gauteng and KwaZulu-Natal?
            </p>
          </div>
          <div className="context-band__question-item">
            <span className="context-band__question-num">02</span>
            <p className="context-band__question-text">
              What populations face access barriers?
            </p>
          </div>
          <div className="context-band__question-item">
            <span className="context-band__question-num">03</span>
            <p className="context-band__question-text">
              To what extent do patterns of pharmacy access correlate with historical
              geographies of{" "}
              <span className="highlight-red">apartheid</span>?
            </p>
          </div>
        </div>
      </div>

    </section>
  )
}

export default ContextBand