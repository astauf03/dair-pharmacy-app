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
            Yet public and private medicine funding is split{" "}
            <span className="context-band__highlight">50/50</span>.
          </p>
          <p className="context-band__body">
            The <span className="highlight-blue">National Health Insurance Act of 2024</span> set out to close that gap, letting public funding reach private pharmacies. Whether that promise reaches people depends on one practical question: can they get there?
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