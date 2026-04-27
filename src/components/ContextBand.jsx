import { useEffect, useRef, useState } from "react"
import "./contextband.css"

function ContextBand() {
  const sectionRef = useRef(null)
  const [hasEntered, setHasEntered] = useState(false)
  const [displayNumber, setDisplayNumber] = useState(0)

  // Watch for section to enter viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEntered) {
          setHasEntered(true)
        }
      },
      { threshold: 0.6}  // fires when 40% of section is visible
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [hasEntered])

  // Count up from 0 to 80 once the section has entered
  useEffect(() => {
    if (!hasEntered) return

    const duration = 1600  // ms
    const target = 80
    const startTime = performance.now()

    let frameId
    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out: fast at start, slow at end
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayNumber(Math.round(eased * target))
      if (progress < 1) frameId = requestAnimationFrame(step)
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [hasEntered])

  return (
    <section className="context-band" ref={sectionRef}>
      <span className="context-band__eyebrow">Context</span>

      <div className={`context-band__grid ${hasEntered ? "is-visible" : ""}`}>
        {/* Left: the stat */}
        <div className="context-band__stat">
          <p className="context-band__stat-lead-in">Public pharmacies serve about</p>
        <div className="context-band__number">
            {displayNumber}<span className="context-band__percent">%</span>
        </div>
          <p className="context-band__stat-label">
              of the South African population. Add another statistic here. 
        </p>
      </div>

        {/* Right: the prose */}
        <div className="context-band__prose">
          <p className="context-band__lead">
            Yet can only meet {" "}
            <span className="context-band__highlight">20% of supply</span>. 
          </p>
          <p className="context-band__body">
            The <span className="highlight-blue">National Health Insurance Act of 2024</span>  passed in 2024 allows for citizens with public insurance to access private pharmacy resources. Public sector pharmacy locations include physical locations like hospitals, health facilities, community centres, medical stores found in malls, and other local and provincial offices (Health Care and Pharmacy Practice in South Africa - PMC p. 39). 
            Access to medicines in the private sector is typically well-stocked with generic and brand name medicines for little cost if insured. Public sector medicines are listed by the National Essential medicines list dictated by the Medicine Control Council.
            But, where are the pharmacies? The South African Pharmacy Council has a database of nationally registered pharmacies, but lacks open
          </p>
          <p className="context-band__body">
            This project maps that question across two provinces — and finds that geography, shaped by decades of <span className="highlight-red">apartheid</span> policy, still determines the answer.
          </p>
        </div>
      </div>
    </section>
  )
}

export default ContextBand