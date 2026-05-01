import { useEffect, useRef} from 'react'
import './n3.css'


export default function N3() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // You can add any animation trigger here based on entry.isIntersecting
        // For example, you could add a class to start CSS animations
        if (entry.isIntersecting) {
          sectionRef.current.classList.add('is-visible')
        }
      },
      { threshold: 0.4 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

    


return (
  <section className="n3" id = "n3" ref={sectionRef}>

    <div className="n3__intro">
      <span className="n3__eyebrow">Spatial Apartheid</span>
      <h2 className="n3__title">Displacement, Townships, and Pharmacy Access</h2>
      <p className="n3__body">
        Paragraph or two talking about two legal frameworks, Group Area Act and something else. Then, lead in to how
        townships were derived from these laws, and how they are still shaped by them today. Then, talk about how this spatial legacy shapes pharmacy access. 
        Has the gov done anything to address township infrastructure desparaity? Why might this not have been successful. 
      </p>
    </div>

  </section>
)
}