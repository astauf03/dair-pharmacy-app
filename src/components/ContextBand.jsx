import "./contextband.css"

function ContextBand() {
  return (
    <section className="context-band">
      <span className="context-band__eyebrow">Context</span>
      <h2 className="context-band__title">Why Map Pharmacy Access?</h2>

      <p className="context-band__body">
        The catalyst of this project starts with a new healthcare policy passed by the South African parliament that intends to expand public healthcare services, fixing what is currently an imbalanced system. Right now, public and private medicine funding is split 50/50 by the government. However, the public health system serves over 80% of the population, whereas private pharmacies serve about 20%. This new bill seeks to bridge the gap between private and public disparities by making public health insurance acceptable in private pharmacies where supply is at a surplus. The National Health Insurance (NHI) Act of 2024 represents a landmark transformation in South African healthcare policy, establishing a public fund to subsidize the provision of care and medicines across the nation.
      </p>

      <p className="context-band__body">
        While the NHI creates funding mechanisms for healthcare provision, its success depends fundamentally on whether populations can physically access healthcare infrastructure, including pharmacies where they can obtain prescribed medications. This spatial dimension of healthcare access is not uniformly distributed across South Africa and reflects historical patterns of development, urbanization, and the enduring legacy of <span className="highlight-red">apartheid</span>-era spatial planning.
      </p>

      <p className="context-band__body">
        Also here is where I will be more specific about the{' '}
        <span className="highlight-blue">research questions</span>, and then why
        that might matter to someone from{' '}
        <span className="highlight-blue">KZN or Gauteng</span>.
      </p>
    </section>
  )
}

export default ContextBand