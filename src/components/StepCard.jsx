import "./stepcard.css"

export default function StepCard({ eyebrow, heading, body, isActive, variant }) {
  return (
    <div className={`step-card ${isActive ? "step-card--active" : ""} ${variant ? `step-card--${variant}` : ""}`}>
      <div className="step-card__inner">
        {eyebrow && <p className="step-card__eyebrow">{eyebrow}</p>}
        <h2 className="step-card__heading">{heading}</h2>
        <p className="step-card__body">{body}</p>
      </div>
    </div>
  )
}