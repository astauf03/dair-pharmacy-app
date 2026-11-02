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
        The spatial inequalities that influence pharmacy access in South Africa today are rooted in decades of legislated racial segregation. The Urban Areas Act of 1923 first established national control over racial integration, dictating where non-white people could go and what spaces they could enter [5]. This segregation was further codified by the Group Areas Act of 1950, implemented by the National Party under the official doctrine of apartheid (meaning "separateness"), which controlled the spatial lives of Black, Coloured, and Indian South Africans [6]. These populations were confined to designated townships and artificially constructed settlements far removed from urban resources and infrastructure.


        Despite apartheid formally ending in 1994, its spatial effects persist. Infrastructure limitations inherited from this era continue to shape a South African's ability to access healthcare, pharmacies, and other essential services. Government programs such as the Comprehensive Housing Plan (Breaking New Ground) have attempted to address housing inadequacies in informal settlements by incorporating principles like integrating subsidized and rental housing, providing municipal services at higher levels, and building socially integrated human settlements [7]. Unfortunately, this program’s their output has declined significantly in recent years, from peak production to approximately 25,000 units by 2023 [8].


        The question of who can reach a pharmacy is inseparable from the question of where apartheid placed them. To explore this disparity at a personal level, the neighborhoods of KwaMashu in KZN and Olievenhoutbosch in Gauteng serve as case studies for the broader scope of pharmacy access in South Africa.
 
      </p>
    </div>

  </section>
)
}