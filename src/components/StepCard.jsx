import "./stepcard.css"

export default function StepCard({ eyebrow, heading, body, body2, isActive, variant, showChart }) {
  return (
    <div className={`step-card ${showChart ? 'step-card--chart' : ''} ${isActive ? "step-card--active" : ""} ${variant ? `step-card--${variant}` : ""}`}>
      <div className="step-card__inner">
        {eyebrow && <p className="step-card__eyebrow">{eyebrow}</p>}
        <h2 className="step-card__heading">{heading}</h2>
        <p className="step-card__body">{body}</p>
        {body2 && <p className="step-card__body">{body2}</p>}
      </div>
    </div>
  )
}