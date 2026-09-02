import { use3DTilt } from "../../hooks/use3DTilt";
import { IconSparkle, IconUpload, IconGauge } from "../../icons";
import Counter from "./Counter";

interface Props {
  onOpenAuth: () => void;
  onExploreDemo: () => void;
}

const CANDIDATES = [
  { name: "Chitra Ameta", role: "AI Backend Lead", score: "96.4", fit: "strong" },
  { name: "Alex Rivera", role: "Full-Stack Dev", score: "91.0", fit: "strong" },
  { name: "Elena Rostova", role: "ML Engineer", score: "94.2", fit: "strong" },
  { name: "David Kim", role: "Python Core Dev", score: "88.0", fit: "moderate" },
  { name: "Sarah Chen", role: "DevOps Engineer", score: "85.5", fit: "moderate" },
];

export default function LandingHero({ onOpenAuth, onExploreDemo }: Props) {
  const tiltMain = use3DTilt({ maxRotation: 8, scale: 1.02 });

  return (
    <section className="lhero">
      <div className="lhero__badge">
        <span className="lhero__badge-dot" />
        <IconSparkle size={13} />
        <span>Sub-Second AI Resume Screening</span>
      </div>

      <h1 className="lhero__title">
        Screen 500 Resumes in Seconds with <span className="gradient-text">AI Precision</span>.
      </h1>

      <p className="lhero__sub">
        Zero manual review. Instant XML extraction, dual-engine semantic scoring, and automated skill-gap radar.
      </p>

      <div className="lhero__actions">
        <button className="btn btn--lg" onClick={onOpenAuth}>
          <IconSparkle size={17} /> Start Free Screening
        </button>
        <button className="btn btn--ghost btn--lg" onClick={onExploreDemo}>
          <IconUpload size={17} /> Live Simulator
        </button>
      </div>

      {/* 3D Floating Hero Card */}
      <div className="lhero__stage">
        <div
          ref={tiltMain.ref}
          style={tiltMain.style}
          {...tiltMain.bind}
          className="lhero__card lhero__card--primary"
        >
          <div className="cand__glare" style={tiltMain.glareStyle} />
          <div className="lhero__card-top">
            <div className="lhero__avatar">CA</div>
            <div>
              <div className="lhero__card-name">Chitra Ameta</div>
              <div className="lhero__card-role">Senior AI Backend Engineer</div>
            </div>
            <span className="fit strong">
              <Counter target={96.4} decimals={1} suffix=" Fit" />
            </span>
          </div>

          <div className="lhero__card-skills">
            <span className="chip">Python 3.12</span>
            <span className="chip">FastAPI</span>
            <span className="chip">PostgreSQL</span>
            <span className="chip">Docker</span>
            <span className="chip">LLM / RAG</span>
          </div>

          <div className="lhero__card-meter">
            <div className="meter__track">
              <div className="meter__seg sim" style={{ width: "40%" }} />
              <div className="meter__seg llm" style={{ width: "58%" }} />
            </div>
            <div className="meter__legend">
              <span>Similarity: <b><Counter target={92} suffix="%" /></b></span>
              <span>Model Score: <b><Counter target={98} suffix="%" /></b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimalist 3D Scrolling Marquee */}
      <div className="lhero__marquee-wrap">
        <div className="lhero__marquee-track">
          {[...CANDIDATES, ...CANDIDATES].map((item, idx) => (
            <div key={idx} className="lhero__marquee-card">
              <div className="avatar-dot">{item.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="name">{item.name}</div>
                <div className="role">{item.role}</div>
              </div>
              <span className={`fit ${item.fit}`}>{item.score}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
