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

      <div className={`context-band__grid ${hasEntered ? "is-visible" : ""}`}>

        {/* LEFT: three stacked stats*/}
        <div className="context-band__stats">

          {/* Stat 1 — public pharmacy population coverage */}
          <div className="context-band__stat context-band__stat--1">
            <p className="context-band__stat-lead-in">Public pharmacies serve about</p>
            <div className="context-band__number">
              {stat1}<span className="context-band__percent">%</span>
            </div>
            <p className="context-band__stat-label">
              of South Africans — but receive only half of national health funding
            </p>
          </div>

          <div className="context-band__stat-divider" />

          {/* Stat 2 — no walking access */}
          <div className="context-band__stat context-band__stat--2">
            <p className="context-band__stat-lead-in">Across Gauteng and KwaZulu-Natal,</p>
            <div className="context-band__number context-band__number--accent">
              {stat2}<span className="context-band__percent">%</span>
            </div>
            <p className="context-band__stat-label">
              of the population has no pharmacy reachable on foot
            </p>
          </div>

          <div className="context-band__stat-divider" />

          {/* Stat 3 — pharmacy count, static */}
          <div className="context-band__stat context-band__stat--3">
            <p className="context-band__stat-lead-in">Our analysis identified</p>
            <div className="context-band__number context-band__number--secondary">
              2,241
            </div>
            <p className="context-band__stat-label">
              spatially verified pharmacies: 1,511 in Gauteng, 730 in KZN
            </p>
          </div>

        </div>

        {/* ── RIGHT: prose ── */}
        <div className="context-band__prose">
          <p className="context-band__lead">
            Yet private facilities receive 50% of the funding allocated by the South African Government for Healthcare.

          </p>
          <p className="context-band__body">
            Public pharmacies in South Africa serve about 80% of the population — but receive
            only half of national health funding. Until the{" "}
            <span className="highlight-blue">National Health Insurance Act of 2024</span>,
            The National Healthcare Insurance Act of 2024 set out to close that gap, guaranteeing all South Africans coverage at both 
            private and public pharmacies. Unfortunately, financial access is not the only barrier to pharmacy services for many South 
            Africans. Physical access is just as much of a challenge. A practical question arises: Can people actually reach pharmacies?
          </p>
          <p className="context-band__body">
           This project maps that question across two provinces and finds that geography shaped by decades of 
           oppression under Apartheid forms the answer.
          </p>
          <p className="context-band__body">
            There is no single official database of where South Africa's pharmacies are.
            We built one — assembling{" "}
            <span className="context-band__highlight">2,241 verified locations</span>{" "}
            from pharmacy council registries, insurer networks, and the Google Places API.
            What that map reveals is not a funding gap. It is a geography problem — and
            geography, in South Africa, was{" "}
            <span className="highlight-red">deliberately constructed</span>.
          </p>
        </div>

      </div>

      {/* ── Full-width: research questions ── */}
      <div className="context-band__questions">
        <p className="context-band__questions-lead">What we set out to understand</p>
        <div className="context-band__questions-list">
          <div className="context-band__question-item">
            <span className="context-band__question-num">01</span>
            <p className="context-band__question-text">
              What is the spatial distribution of pharmacies across Gauteng and
              KwaZulu-Natal?
            </p>
          </div>
          <div className="context-band__question-item">
            <span className="context-band__question-num">02</span>
            <p className="context-band__question-text">
              Which populations have adequate access to pharmacy services — and which
              face meaningful barriers?
            </p>
          </div>
          <div className="context-band__question-item">
            <span className="context-band__question-num">03</span>
            <p className="context-band__question-text">
              To what extent do patterns of pharmacy access reflect the historical
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